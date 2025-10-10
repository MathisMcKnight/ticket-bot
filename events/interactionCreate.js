const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

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

      try {
        const configResult = await db.query(`SELECT * FROM configs WHERE guild_id = $1`, [interaction.guild.id]);
        const config = configResult.rows[0];
        
        if (!config) {
          return interaction.reply({ content: '⚙️ Run `/setup` first.', ephemeral: true });
        }

        const blResult = await db.query(`SELECT * FROM blacklists WHERE user_id = $1`, [interaction.user.id]);
        const bl = blResult.rows[0];
        
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

        await db.query(
          `INSERT INTO tickets (ticket_number, user_id, channel_id, status, ticket_type) VALUES ($1, $2, $3, 'open', $4)`,
          [ticketNumber, interaction.user.id, channel.id, ticketTypes[choice] || choice]
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

        const templateEmbed = new EmbedBuilder()
          .setTitle('📝 Please Provide Information')
          .setDescription('To help us assist you better, please provide the following information:')
          .addFields(
            { name: 'Roblox Username', value: '*Your Roblox username*', inline: false },
            { name: 'Purpose for Opening Ticket', value: '*Describe why you opened this ticket*', inline: false }
          )
          .setColor('#0A235B')
          .setFooter({ text: 'Please fill out this template in your next message' });

        await channel.send({ embeds: [templateEmbed] });
        await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
      } catch (error) {
        console.error('Error creating ticket:', error);
        await interaction.reply({ content: '❌ Error creating ticket. Please try again.', ephemeral: true });
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
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'transfer_ticket') {
      const db = require('../database');
      const categoryId = interaction.values[0];
      
      try {
        const ticketResult = await db.query(`SELECT * FROM tickets WHERE channel_id = $1`, [interaction.channel.id]);
        const ticket = ticketResult.rows[0];
        
        if (!ticket) {
          return interaction.update({ content: '❌ This is not a valid ticket channel.', components: [] });
        }

        const categoryNames = {
          '1338827711652565085': 'General Inquires',
          '1424653874085494854': 'Internal Affairs',
          '1424655379001901107': 'Agency Affairs',
          '1424656073071001720': 'Comms Dept'
        };

        const configResult = await db.query(`SELECT * FROM configs WHERE guild_id = $1`, [interaction.guild.id]);
        const config = configResult.rows[0];
        
        const categoryToRoleMapping = {
          '1338827711652565085': config?.general_inquiry_role_id,
          '1424653874085494854': config?.internal_affairs_role_id,
          '1424655379001901107': config?.agency_hotline_role_id,
          '1424656073071001720': config?.press_clearance_role_id
        };

        const newRoleId = categoryToRoleMapping[categoryId];

        if (!newRoleId) {
          return interaction.update({ 
            content: '❌ Target category not configured. Please ask an admin to run /setup.', 
            components: [] 
          });
        }

        const currentPermissions = interaction.channel.permissionOverwrites.cache;
        const oldRoleOverwrites = currentPermissions.filter(p => 
          p.type === 0 && p.id !== interaction.guild.id && p.id !== ticket.user_id
        );

        for (const overwrite of oldRoleOverwrites.values()) {
          await interaction.channel.permissionOverwrites.delete(overwrite.id);
        }

        await interaction.channel.permissionOverwrites.create(newRoleId, {
          ViewChannel: true,
          SendMessages: true
        });

        await interaction.channel.setParent(categoryId);
        
        const transferEmbed = new EmbedBuilder()
          .setTitle('🔄 Ticket Transferred')
          .setDescription(`This ticket has been transferred to **${categoryNames[categoryId]}**\n\n**Transferred by:** ${interaction.user}\n**New Support Team:** <@&${newRoleId}>`)
          .setColor('#00A8FF')
          .setTimestamp();

        await interaction.channel.send({ content: `<@&${newRoleId}>`, embeds: [transferEmbed] });
        await interaction.update({ content: `✅ Ticket transferred to ${categoryNames[categoryId]}!`, components: [] });
      } catch (error) {
        console.error('Transfer error:', error);
        await interaction.update({ content: '❌ Failed to transfer ticket. Please check category permissions.', components: [] });
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'setup_continue_part2') {
        const modal = new ModalBuilder()
          .setCustomId('setup_modal_part2')
          .setTitle('Ticket System Setup (2/2)');

        const agencyRoleInput = new TextInputBuilder()
          .setCustomId('agency_hotline_role')
          .setLabel('Agency Hotline - Manager Role ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click role → Copy ID')
          .setRequired(false);

        const internalCategoryInput = new TextInputBuilder()
          .setCustomId('internal_affairs_category')
          .setLabel('Internal Affairs - Category ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click category → Copy ID')
          .setRequired(false);

        const internalRoleInput = new TextInputBuilder()
          .setCustomId('internal_affairs_role')
          .setLabel('Internal Affairs - Manager Role ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click role → Copy ID')
          .setRequired(false);

        const escalationCategoryInput = new TextInputBuilder()
          .setCustomId('escalation_category')
          .setLabel('Escalation Category ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click category → Copy ID')
          .setRequired(false);

        const transcriptChannelInput = new TextInputBuilder()
          .setCustomId('transcript_channel')
          .setLabel('Transcript Channel ID')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Right-click channel → Copy ID')
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(agencyRoleInput),
          new ActionRowBuilder().addComponents(internalCategoryInput),
          new ActionRowBuilder().addComponents(internalRoleInput),
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
        const filePath = `transcripts/${fileName}`;
        
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

        const domain = process.env.DOMAIN || process.env.REPLIT_DEV_DOMAIN || process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:5000';
        const transcriptUrl = `https://${domain}/transcripts/${token}`;
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

    if (interaction.isModalSubmit() && interaction.customId === 'setup_modal_part1') {
      const db = require('../database');
      
      const generalCategory = interaction.fields.getTextInputValue('general_inquiry_category').trim();
      const generalRole = interaction.fields.getTextInputValue('general_inquiry_role').trim();
      const pressCategory = interaction.fields.getTextInputValue('press_clearance_category').trim();
      const pressRole = interaction.fields.getTextInputValue('press_clearance_role').trim();
      const agencyCategory = interaction.fields.getTextInputValue('agency_hotline_category').trim();

      try {
        let updates = [];

        if (generalCategory && generalRole) {
          await db.query(`
            INSERT INTO configs (guild_id, general_inquiry_category_id, general_inquiry_role_id) 
            VALUES ($1, $2, $3)
            ON CONFLICT(guild_id) DO UPDATE SET 
              general_inquiry_category_id = EXCLUDED.general_inquiry_category_id,
              general_inquiry_role_id = EXCLUDED.general_inquiry_role_id
          `, [interaction.guild.id, generalCategory, generalRole]);
          updates.push('✅ General Inquiry');
        }

        if (pressCategory && pressRole) {
          await db.query(`
            INSERT INTO configs (guild_id, press_clearance_category_id, press_clearance_role_id) 
            VALUES ($1, $2, $3)
            ON CONFLICT(guild_id) DO UPDATE SET 
              press_clearance_category_id = EXCLUDED.press_clearance_category_id,
              press_clearance_role_id = EXCLUDED.press_clearance_role_id
          `, [interaction.guild.id, pressCategory, pressRole]);
          updates.push('✅ Press Clearance');
        }

        if (agencyCategory) {
          updates.push('⚠️ Agency Hotline (incomplete - need role in Part 2)');
        }

        const continueButton = new ButtonBuilder()
          .setCustomId('setup_continue_part2')
          .setLabel('Continue to Part 2')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('➡️');

        const row = new ActionRowBuilder().addComponents(continueButton);

        const summary = updates.length > 0 ? updates.join('\n') : '⚠️ No complete configurations saved';

        await interaction.reply({
          content: `**Setup Part 1 Saved!**\n\n${summary}\n\n📝 Click below to configure remaining ticket types and settings:`,
          components: [row],
          ephemeral: true
        });
      } catch (error) {
        console.error('Error in setup part 1:', error);
        await interaction.reply({ content: '❌ Error saving configuration. Please try again.', ephemeral: true });
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'setup_modal_part2') {
      const db = require('../database');
      
      const agencyRole = interaction.fields.getTextInputValue('agency_hotline_role').trim();
      const internalCategory = interaction.fields.getTextInputValue('internal_affairs_category').trim();
      const internalRole = interaction.fields.getTextInputValue('internal_affairs_role').trim();
      const escalationCategory = interaction.fields.getTextInputValue('escalation_category').trim();
      const transcriptChannel = interaction.fields.getTextInputValue('transcript_channel').trim();

      try {
        let updates = [];

        if (agencyRole) {
          const configResult = await db.query(`SELECT agency_hotline_category_id FROM configs WHERE guild_id = $1`, [interaction.guild.id]);
          const config = configResult.rows[0];
          if (config && config.agency_hotline_category_id) {
            await db.query(`UPDATE configs SET agency_hotline_role_id = $1 WHERE guild_id = $2`, [agencyRole, interaction.guild.id]);
            updates.push('✅ Agency Hotline');
          }
        }

        if (internalCategory && internalRole) {
          await db.query(`
            INSERT INTO configs (guild_id, internal_affairs_category_id, internal_affairs_role_id) 
            VALUES ($1, $2, $3)
            ON CONFLICT(guild_id) DO UPDATE SET 
              internal_affairs_category_id = EXCLUDED.internal_affairs_category_id,
              internal_affairs_role_id = EXCLUDED.internal_affairs_role_id
          `, [interaction.guild.id, internalCategory, internalRole]);
          updates.push('✅ Internal Affairs');
        }

        if (escalationCategory) {
          await db.query(`
            INSERT INTO configs (guild_id, escalation_category_id) 
            VALUES ($1, $2)
            ON CONFLICT(guild_id) DO UPDATE SET 
              escalation_category_id = EXCLUDED.escalation_category_id
          `, [interaction.guild.id, escalationCategory]);
          updates.push('✅ Escalation Category');
        }

        if (transcriptChannel) {
          await db.query(`
            INSERT INTO configs (guild_id, transcript_channel_id) 
            VALUES ($1, $2)
            ON CONFLICT(guild_id) DO UPDATE SET 
              transcript_channel_id = EXCLUDED.transcript_channel_id
          `, [interaction.guild.id, transcriptChannel]);
          updates.push('✅ Transcript Channel');
        }

        const summary = updates.length > 0 ? updates.join('\n') : '⚠️ No configurations saved';

        await interaction.reply({
          content: `**Setup Part 2 Saved!**\n\n${summary}\n\n🎉 Your ticket system is now configured!`,
          ephemeral: true
        });
      } catch (error) {
        console.error('Error in setup part 2:', error);
        await interaction.reply({ content: '❌ Error saving configuration. Please try again.', ephemeral: true });
      }
    }

  },
};
