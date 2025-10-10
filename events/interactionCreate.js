const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

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

      await interaction.deferReply({ ephemeral: true });

      try {
        const configResult = await db.query(`SELECT * FROM configs WHERE guild_id = $1`, [interaction.guild.id]);
        const config = configResult.rows[0];
        
        if (!config) {
          return interaction.editReply({ content: '⚙️ Run `/setup` first.' });
        }

        const blResult = await db.query(`SELECT * FROM blacklists WHERE user_id = $1`, [interaction.user.id]);
        const bl = blResult.rows[0];
        
        if (bl) {
          return interaction.editReply({ 
            content: `🚫 You are blacklisted.\n**Reason:** ${bl.reason || 'No reason provided'}`
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
        return interaction.editReply({ content: `⚠️ This ticket type is not configured yet. Please ask an admin to run /setup.` });
      }

      const lastTicketResult = await db.query(`SELECT MAX(ticket_number) as max_num FROM tickets`, []);
      const lastTicket = lastTicketResult.rows[0];
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

      await db.query(`INSERT INTO tickets (ticket_number, user_id, channel_id, status, ticket_type) VALUES ($1, $2, $3, 'open', $4)`, [
        ticketNumber,
        interaction.user.id,
        channel.id,
        ticketTypes[choice] || choice
      ]);

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticketNumber}`)
        .setDescription(`**Type:** ${ticketTypes[choice] || choice}\n**Created by:** ${interaction.user}\n\nType your issue below. A staff member will assist you shortly.`)
        .setColor('#0A235B');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger)
      );

      await channel.send({ content: `<@&${roleId}>`, embeds: [embed], components: [row] });
      await interaction.editReply({ content: `✅ Ticket created: ${channel}` });
      } catch (error) {
        console.error('Error creating ticket:', error);
        await interaction.editReply({ content: '❌ Error creating ticket. Please try again.' });
      }
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
        const modal = new ModalBuilder()
          .setCustomId('modal_general_inquiry')
          .setTitle('General Inquiry Setup');

        const categoryInput = new TextInputBuilder()
          .setCustomId('category_id')
          .setLabel('Category ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click category → Copy ID')
          .setRequired(true);

        const roleInput = new TextInputBuilder()
          .setCustomId('role_id')
          .setLabel('Manager Role ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click role → Copy ID')
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(categoryInput),
          new ActionRowBuilder().addComponents(roleInput)
        );

        return await interaction.showModal(modal);
      }

      if (interaction.customId === 'setup_press_clearance') {
        const modal = new ModalBuilder()
          .setCustomId('modal_press_clearance')
          .setTitle('Press Clearance Setup');

        const categoryInput = new TextInputBuilder()
          .setCustomId('category_id')
          .setLabel('Category ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click category → Copy ID')
          .setRequired(true);

        const roleInput = new TextInputBuilder()
          .setCustomId('role_id')
          .setLabel('Manager Role ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click role → Copy ID')
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(categoryInput),
          new ActionRowBuilder().addComponents(roleInput)
        );

        return await interaction.showModal(modal);
      }

      if (interaction.customId === 'setup_agency_hotline') {
        const modal = new ModalBuilder()
          .setCustomId('modal_agency_hotline')
          .setTitle('Agency Hotline Setup');

        const categoryInput = new TextInputBuilder()
          .setCustomId('category_id')
          .setLabel('Category ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click category → Copy ID')
          .setRequired(true);

        const roleInput = new TextInputBuilder()
          .setCustomId('role_id')
          .setLabel('Manager Role ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click role → Copy ID')
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(categoryInput),
          new ActionRowBuilder().addComponents(roleInput)
        );

        return await interaction.showModal(modal);
      }

      if (interaction.customId === 'setup_internal_affairs') {
        const modal = new ModalBuilder()
          .setCustomId('modal_internal_affairs')
          .setTitle('Internal Affairs Setup');

        const categoryInput = new TextInputBuilder()
          .setCustomId('category_id')
          .setLabel('Category ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click category → Copy ID')
          .setRequired(true);

        const roleInput = new TextInputBuilder()
          .setCustomId('role_id')
          .setLabel('Manager Role ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click role → Copy ID')
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(categoryInput),
          new ActionRowBuilder().addComponents(roleInput)
        );

        return await interaction.showModal(modal);
      }

      if (interaction.customId === 'setup_escalation_transcript') {
        const modal = new ModalBuilder()
          .setCustomId('modal_escalation_transcript')
          .setTitle('Escalation & Transcript Setup');

        const escalationCategoryInput = new TextInputBuilder()
          .setCustomId('escalation_category_id')
          .setLabel('Escalation Category ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click category → Copy ID')
          .setRequired(true);

        const transcriptChannelInput = new TextInputBuilder()
          .setCustomId('transcript_channel_id')
          .setLabel('Transcript Channel ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click channel → Copy ID')
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(escalationCategoryInput),
          new ActionRowBuilder().addComponents(transcriptChannelInput)
        );

        return await interaction.showModal(modal);
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'close_reason_modal') {
      const db = require('../database');
      const closeReason = interaction.fields.getTextInputValue('close_reason');
      
      try {
        const ticketResult = await db.query(`SELECT * FROM tickets WHERE channel_id = $1`, [interaction.channel.id]);
        const ticket = ticketResult.rows[0];

        if (!ticket) {
          return interaction.reply({ content: '❌ Ticket not found in database.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const attachment = await discordTranscripts.createTranscript(interaction.channel, {
          limit: -1,
          filename: `ticket-${ticket.ticket_number}-transcript.html`,
          saveImages: true,
          poweredBy: false
        });

        const token = uuidv4();
        const fileName = `${token}.html`;
        const filePath = path.join('transcripts', fileName);
        
        await fs.writeFile(filePath, attachment.attachment);

        const configResult = await db.query(`SELECT * FROM configs WHERE guild_id = $1`, [interaction.guild.id]);
        const config = configResult.rows[0];
        
        await db.query(`
          INSERT INTO transcripts (ticket_id, ticket_number, channel_id, user_id, user_tag, ticket_type, messages, close_reason, token, file_path)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
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
        ]);

        await db.query(`UPDATE tickets SET status = 'closed' WHERE channel_id = $1`, [interaction.channel.id]);

        const transcriptUrl = `https://${process.env.DOMAIN}/transcripts/${token}`;
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
        if (interaction.deferred) {
          await interaction.editReply({ content: '❌ Error closing ticket. Please try again.' });
        } else {
          await interaction.reply({ content: '❌ Error closing ticket. Please try again.', ephemeral: true });
        }
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_general_inquiry') {
      const db = require('../database');
      const categoryId = interaction.fields.getTextInputValue('category_id');
      const roleId = interaction.fields.getTextInputValue('role_id');

      try {
        await db.query(`
          INSERT INTO configs (guild_id, general_inquiry_category_id, general_inquiry_role_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT(guild_id) DO UPDATE SET 
            general_inquiry_category_id = excluded.general_inquiry_category_id,
            general_inquiry_role_id = excluded.general_inquiry_role_id
        `, [interaction.guild.id, categoryId, roleId]);

        await interaction.reply({ content: '✅ General Inquiry configuration saved!', ephemeral: true });
      } catch (error) {
        console.error('Error saving general inquiry config:', error);
        await interaction.reply({ content: '❌ Error saving configuration. Please try again.', ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_press_clearance') {
      const db = require('../database');
      const categoryId = interaction.fields.getTextInputValue('category_id');
      const roleId = interaction.fields.getTextInputValue('role_id');

      try {
        await db.query(`
          INSERT INTO configs (guild_id, press_clearance_category_id, press_clearance_role_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT(guild_id) DO UPDATE SET 
            press_clearance_category_id = excluded.press_clearance_category_id,
            press_clearance_role_id = excluded.press_clearance_role_id
        `, [interaction.guild.id, categoryId, roleId]);

        await interaction.reply({ content: '✅ Press Clearance configuration saved!', ephemeral: true });
      } catch (error) {
        console.error('Error saving press clearance config:', error);
        await interaction.reply({ content: '❌ Error saving configuration. Please try again.', ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_agency_hotline') {
      const db = require('../database');
      const categoryId = interaction.fields.getTextInputValue('category_id');
      const roleId = interaction.fields.getTextInputValue('role_id');

      try {
        await db.query(`
          INSERT INTO configs (guild_id, agency_hotline_category_id, agency_hotline_role_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT(guild_id) DO UPDATE SET 
            agency_hotline_category_id = excluded.agency_hotline_category_id,
            agency_hotline_role_id = excluded.agency_hotline_role_id
        `, [interaction.guild.id, categoryId, roleId]);

        await interaction.reply({ content: '✅ Agency Hotline configuration saved!', ephemeral: true });
      } catch (error) {
        console.error('Error saving agency hotline config:', error);
        await interaction.reply({ content: '❌ Error saving configuration. Please try again.', ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_internal_affairs') {
      const db = require('../database');
      const categoryId = interaction.fields.getTextInputValue('category_id');
      const roleId = interaction.fields.getTextInputValue('role_id');

      try {
        await db.query(`
          INSERT INTO configs (guild_id, internal_affairs_category_id, internal_affairs_role_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT(guild_id) DO UPDATE SET 
            internal_affairs_category_id = excluded.internal_affairs_category_id,
            internal_affairs_role_id = excluded.internal_affairs_role_id
        `, [interaction.guild.id, categoryId, roleId]);

        await interaction.reply({ content: '✅ Internal Affairs configuration saved!', ephemeral: true });
      } catch (error) {
        console.error('Error saving internal affairs config:', error);
        await interaction.reply({ content: '❌ Error saving configuration. Please try again.', ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_escalation_transcript') {
      const db = require('../database');
      const escalationCategoryId = interaction.fields.getTextInputValue('escalation_category_id');
      const transcriptChannelId = interaction.fields.getTextInputValue('transcript_channel_id');

      try {
        await db.query(`
          INSERT INTO configs (guild_id, escalation_category_id, transcript_channel_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT(guild_id) DO UPDATE SET 
            escalation_category_id = excluded.escalation_category_id,
            transcript_channel_id = excluded.transcript_channel_id
        `, [interaction.guild.id, escalationCategoryId, transcriptChannelId]);

        await interaction.reply({ content: '✅ Escalation & Transcript configuration saved!', ephemeral: true });
      } catch (error) {
        console.error('Error saving escalation & transcript config:', error);
        await interaction.reply({ content: '❌ Error saving configuration. Please try again.', ephemeral: true });
      }
    }

  },
};
