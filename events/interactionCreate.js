const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, AttachmentBuilder, ChannelType, StringSelectMenuBuilder } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

const setupState = new Map();

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Command error.', ephemeral: true });
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket-panel') {
      const choice = interaction.values[0];
      const db = require('../database');

      const config = db.prepare(`SELECT * FROM configs WHERE guild_id = ?`).get(interaction.guild.id);
      
      if (!config) {
        return interaction.reply({ content: '⚙️ Run `/setup` first.', ephemeral: true });
      }

      const bl = db.prepare(`SELECT * FROM blacklists WHERE user_id = ?`).get(interaction.user.id);
      
      if (bl) {
        return interaction.reply({ 
          content: `🚫 You are blacklisted.\n**Reason:** ${bl.reason || 'No reason provided'}`, 
          ephemeral: true 
        });
      }

      const ticketTypes = {
        'general_inquiry': 'General Inquiry',
        'press_clearance': 'Press Clearance request',
        'agency_hotline': 'Agency Directorate Hotline',
        'internal_affairs': 'White House Internal Affairs Hotline'
      };

      const categoryMapping = {
        'general_inquiry': config.general_inquiry_category_id,
        'press_clearance': config.press_clearance_category_id,
        'agency_hotline': config.agency_hotline_category_id,
        'internal_affairs': config.internal_affairs_category_id
      };

      const roleMapping = {
        'general_inquiry': config.general_inquiry_role_id,
        'press_clearance': config.press_clearance_role_id,
        'agency_hotline': config.agency_hotline_role_id,
        'internal_affairs': config.internal_affairs_role_id
      };

      const categoryId = categoryMapping[choice];
      const roleId = roleMapping[choice];

      if (!categoryId || !roleId) {
        return interaction.reply({ content: `⚠️ This ticket type is not configured yet. Please ask an admin to run /setup.`, ephemeral: true });
      }

      const lastTicket = db.prepare(`SELECT MAX(ticket_number) as max_num FROM tickets`).get();
      const ticketNumber = (lastTicket?.max_num || 0) + 1;

      const category = interaction.guild.channels.cache.get(categoryId);
      const channel = await interaction.guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: 0,
        parent: category.id,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: ['ViewChannel'] },
          { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] },
          { id: roleId, allow: ['ViewChannel', 'SendMessages'] },
        ],
      });

      db.prepare(`INSERT INTO tickets (ticket_number, user_id, channel_id, status, ticket_type) VALUES (?, ?, ?, 'open', ?)`).run(
        ticketNumber,
        interaction.user.id,
        channel.id,
        ticketTypes[choice] || choice
      );

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticketNumber}`)
        .setDescription(`**Type:** ${ticketTypes[choice] || choice}\n**Created by:** ${interaction.user}\n\nType your issue below. A staff member will assist you shortly.`)
        .setColor('#0A235B');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger)
      );

      await channel.send({ content: `<@&${roleId}>`, embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
    }

    if (interaction.isButton()) {
      const db = require('../database');

      if (interaction.customId === 'close_ticket') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: '❌ Only administrators can close tickets.', ephemeral: true });
        }

        const modal = new ModalBuilder()
          .setCustomId('close_reason_modal')
          .setTitle('Close Ticket');

        const reasonInput = new TextInputBuilder()
          .setCustomId('close_reason')
          .setLabel('Why are you closing this ticket?')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMinLength(5)
          .setMaxLength(500);

        const row = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(row);

        return await interaction.showModal(modal);
      }

      if (interaction.customId === 'claim_ticket') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: '❌ Only administrators can claim tickets.', ephemeral: true });
        }
        return await interaction.reply({ content: `🎟️ Ticket claimed by ${interaction.user.tag}` });
      }

      if (interaction.customId === 'setup_general_inquiry') {
        const categories = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
        
        if (categories.size === 0) {
          return interaction.reply({ content: '❌ No categories found in this server.', ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('select_category_general_inquiry')
          .setPlaceholder('Select a category for General Inquiry tickets')
          .addOptions(
            Array.from(categories.values()).slice(0, 25).map(category => ({
              label: category.name,
              value: category.id,
              description: `ID: ${category.id}`
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        return await interaction.reply({
          content: '📂 **Step 1/2:** Select the category where General Inquiry tickets will be created:',
          components: [row],
          ephemeral: true
        });
      }

      if (interaction.customId === 'setup_press_clearance') {
        const categories = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
        
        if (categories.size === 0) {
          return interaction.reply({ content: '❌ No categories found in this server.', ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('select_category_press_clearance')
          .setPlaceholder('Select a category for Press Clearance tickets')
          .addOptions(
            Array.from(categories.values()).slice(0, 25).map(category => ({
              label: category.name,
              value: category.id,
              description: `ID: ${category.id}`
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        return await interaction.reply({
          content: '📂 **Step 1/2:** Select the category where Press Clearance tickets will be created:',
          components: [row],
          ephemeral: true
        });
      }

      if (interaction.customId === 'setup_agency_hotline') {
        const categories = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
        
        if (categories.size === 0) {
          return interaction.reply({ content: '❌ No categories found in this server.', ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('select_category_agency_hotline')
          .setPlaceholder('Select a category for Agency Hotline tickets')
          .addOptions(
            Array.from(categories.values()).slice(0, 25).map(category => ({
              label: category.name,
              value: category.id,
              description: `ID: ${category.id}`
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        return await interaction.reply({
          content: '📂 **Step 1/2:** Select the category where Agency Hotline tickets will be created:',
          components: [row],
          ephemeral: true
        });
      }

      if (interaction.customId === 'setup_internal_affairs') {
        const categories = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
        
        if (categories.size === 0) {
          return interaction.reply({ content: '❌ No categories found in this server.', ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('select_category_internal_affairs')
          .setPlaceholder('Select a category for Internal Affairs tickets')
          .addOptions(
            Array.from(categories.values()).slice(0, 25).map(category => ({
              label: category.name,
              value: category.id,
              description: `ID: ${category.id}`
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        return await interaction.reply({
          content: '📂 **Step 1/2:** Select the category where Internal Affairs tickets will be created:',
          components: [row],
          ephemeral: true
        });
      }

      if (interaction.customId === 'setup_escalation_transcript') {
        const categories = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
        
        if (categories.size === 0) {
          return interaction.reply({ content: '❌ No categories found in this server.', ephemeral: true });
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('select_escalation_category')
          .setPlaceholder('Select the escalation category')
          .addOptions(
            Array.from(categories.values()).slice(0, 25).map(category => ({
              label: category.name,
              value: category.id,
              description: `ID: ${category.id}`
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        return await interaction.reply({
          content: '📂 **Step 1/2:** Select the category for escalated tickets:',
          components: [row],
          ephemeral: true
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      const db = require('../database');

      if (interaction.customId.startsWith('select_category_')) {
        const ticketType = interaction.customId.replace('select_category_', '');
        const categoryId = interaction.values[0];
        
        setupState.set(interaction.user.id, { ticketType, categoryId });

        const roles = interaction.guild.roles.cache.filter(r => !r.managed && r.name !== '@everyone');
        
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`select_role_${ticketType}`)
          .setPlaceholder('Select the manager role for this ticket type')
          .addOptions(
            Array.from(roles.values()).slice(0, 25).map(role => ({
              label: role.name,
              value: role.id,
              description: `ID: ${role.id}`
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        return await interaction.update({
          content: `✅ Category selected: <#${categoryId}>\n\n👥 **Step 2/2:** Select the manager role:`,
          components: [row]
        });
      }

      if (interaction.customId.startsWith('select_role_')) {
        const ticketType = interaction.customId.replace('select_role_', '');
        const roleId = interaction.values[0];
        const state = setupState.get(interaction.user.id);

        if (!state || state.ticketType !== ticketType) {
          return interaction.update({ content: '❌ Setup session expired. Please start again.', components: [] });
        }

        const typeMapping = {
          'general_inquiry': { catCol: 'general_inquiry_category_id', roleCol: 'general_inquiry_role_id', name: 'General Inquiry' },
          'press_clearance': { catCol: 'press_clearance_category_id', roleCol: 'press_clearance_role_id', name: 'Press Clearance' },
          'agency_hotline': { catCol: 'agency_hotline_category_id', roleCol: 'agency_hotline_role_id', name: 'Agency Hotline' },
          'internal_affairs': { catCol: 'internal_affairs_category_id', roleCol: 'internal_affairs_role_id', name: 'Internal Affairs' }
        };

        const mapping = typeMapping[ticketType];
        
        db.prepare(`
          INSERT INTO configs (guild_id, ${mapping.catCol}, ${mapping.roleCol}) 
          VALUES (?, ?, ?)
          ON CONFLICT(guild_id) DO UPDATE SET 
            ${mapping.catCol} = excluded.${mapping.catCol},
            ${mapping.roleCol} = excluded.${mapping.roleCol}
        `).run(interaction.guild.id, state.categoryId, roleId);

        setupState.delete(interaction.user.id);

        return await interaction.update({
          content: `✅ **${mapping.name}** configuration saved!\n📂 Category: <#${state.categoryId}>\n👥 Manager Role: <@&${roleId}>`,
          components: []
        });
      }

      if (interaction.customId === 'select_escalation_category') {
        const categoryId = interaction.values[0];
        
        setupState.set(interaction.user.id, { escalationCategoryId: categoryId });

        const textChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
        
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('select_transcript_channel')
          .setPlaceholder('Select the transcript channel')
          .addOptions(
            Array.from(textChannels.values()).slice(0, 25).map(channel => ({
              label: channel.name,
              value: channel.id,
              description: `ID: ${channel.id}`
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        return await interaction.update({
          content: `✅ Escalation category selected: <#${categoryId}>\n\n📝 **Step 2/2:** Select the transcript channel:`,
          components: [row]
        });
      }

      if (interaction.customId === 'select_transcript_channel') {
        const transcriptChannelId = interaction.values[0];
        const state = setupState.get(interaction.user.id);

        if (!state || !state.escalationCategoryId) {
          return interaction.update({ content: '❌ Setup session expired. Please start again.', components: [] });
        }

        db.prepare(`
          INSERT INTO configs (guild_id, escalation_category_id, transcript_channel_id) 
          VALUES (?, ?, ?)
          ON CONFLICT(guild_id) DO UPDATE SET 
            escalation_category_id = excluded.escalation_category_id,
            transcript_channel_id = excluded.transcript_channel_id
        `).run(interaction.guild.id, state.escalationCategoryId, transcriptChannelId);

        setupState.delete(interaction.user.id);

        return await interaction.update({
          content: `✅ **Escalation & Transcript** configuration saved!\n📂 Escalation Category: <#${state.escalationCategoryId}>\n📝 Transcript Channel: <#${transcriptChannelId}>`,
          components: []
        });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'close_reason_modal') {
      const db = require('../database');
      const closeReason = interaction.fields.getTextInputValue('close_reason');
      const ticket = db.prepare(`SELECT * FROM tickets WHERE channel_id = ?`).get(interaction.channel.id);

      if (!ticket) {
        return interaction.reply({ content: '❌ Ticket not found in database.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const attachment = await discordTranscripts.createTranscript(interaction.channel, {
          limit: -1,
          filename: `ticket-${ticket.ticket_number}-transcript.html`,
          saveImages: true,
          poweredBy: false
        });

        const token = uuidv4();
        const fileName = `${token}.html`;
        const filePath = `transcripts/${fileName}`;
        
        await fs.writeFile(filePath, attachment.attachment);

        const config = db.prepare(`SELECT * FROM configs WHERE guild_id = ?`).get(interaction.guild.id);
        
        db.prepare(`
          INSERT INTO transcripts (ticket_id, ticket_number, channel_id, user_id, user_tag, ticket_type, messages, close_reason, token, file_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          ticket.id,
          ticket.ticket_number,
          ticket.channel_id,
          ticket.user_id,
          interaction.user.tag,
          ticket.ticket_type || 'N/A',
          `HTML_TRANSCRIPT:ticket-${ticket.ticket_number}-transcript.html`,
          closeReason,
          token,
          filePath
        );

        db.prepare(`UPDATE tickets SET status = 'closed' WHERE channel_id = ?`).run(interaction.channel.id);

        const transcriptUrl = `https://${process.env.REPLIT_DEV_DOMAIN}/transcripts/${token}`;
        const viewButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('📄 View Transcript')
            .setStyle(ButtonStyle.Link)
            .setURL(transcriptUrl)
        );

        try {
          const ticketCreator = await interaction.client.users.fetch(ticket.user_id);
          
          const dmEmbed = new EmbedBuilder()
            .setTitle('🎫 Your Ticket Has Been Closed')
            .setDescription(`Your ticket **#${ticket.ticket_number}** (${ticket.ticket_type || 'General'}) has been closed.\n\nClick the button below to view your transcript in your browser.`)
            .addFields(
              { name: '📝 Close Reason', value: closeReason },
              { name: '👤 Closed By', value: interaction.user.tag }
            )
            .setColor('#0A235B')
            .setFooter({ text: 'Thanks for your communications with the White House!' })
            .setTimestamp();

          await ticketCreator.send({ 
            embeds: [dmEmbed],
            components: [viewButton]
          });
        } catch (dmError) {
          console.error('Could not DM user:', dmError.message);
        }

        if (config && config.transcript_channel_id) {
          const transcriptChannel = interaction.guild.channels.cache.get(config.transcript_channel_id);
          
          if (transcriptChannel) {
            const transcriptEmbed = new EmbedBuilder()
              .setTitle(`📜 Ticket #${ticket.ticket_number} - Transcript`)
              .setDescription(`**User:** <@${ticket.user_id}>\n**Type:** ${ticket.ticket_type || 'N/A'}\n**Closed by:** ${interaction.user}\n**Close Reason:** ${closeReason}`)
              .setColor('#0A235B')
              .setTimestamp();

            await transcriptChannel.send({ 
              embeds: [transcriptEmbed],
              components: [viewButton]
            });
          }
        }

        await interaction.editReply({ content: `✅ Ticket closed! Transcript sent to user and saved. Deleting channel in 5 seconds...` });
        
        setTimeout(async () => {
          try {
            await interaction.channel.delete();
          } catch (deleteError) {
            console.error('Error deleting channel:', deleteError);
          }
        }, 5000);

      } catch (error) {
        console.error('Error closing ticket:', error);
        await interaction.editReply({ content: '❌ Error closing ticket. Please try again.' });
      }
    }


  },
};
