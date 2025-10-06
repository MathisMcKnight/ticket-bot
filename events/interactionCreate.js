const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');

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
        'general': 'General Inquiry',
        'support': 'Support Request',
        'escalate': 'Escalation'
      };

      const lastTicket = db.prepare(`SELECT MAX(ticket_number) as max_num FROM tickets`).get();
      const ticketNumber = (lastTicket?.max_num || 0) + 1;

      const category = interaction.guild.channels.cache.get(config.category_id);
      const channel = await interaction.guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: 0,
        parent: category.id,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: ['ViewChannel'] },
          { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] },
          { id: config.support_role_id, allow: ['ViewChannel', 'SendMessages'] },
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

      await channel.send({ content: `<@&${config.support_role_id}>`, embeds: [embed], components: [row] });
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

        await interaction.showModal(modal);
      }

      if (interaction.customId === 'claim_ticket') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: '❌ Only administrators can claim tickets.', ephemeral: true });
        }
        await interaction.reply({ content: `🎟️ Ticket claimed by ${interaction.user.tag}` });
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
        let allMessages = [];
        let lastId;

        while (true) {
          const options = { limit: 100 };
          if (lastId) options.before = lastId;

          const messages = await interaction.channel.messages.fetch(options);
          if (messages.size === 0) break;

          allMessages.push(...Array.from(messages.values()));
          lastId = messages.last().id;

          if (messages.size < 100) break;
        }

        allMessages.reverse();
        
        const transcriptText = allMessages.map(msg => 
          `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`
        ).join('\n');

        const result = db.prepare(`
          INSERT INTO transcripts (ticket_id, ticket_number, channel_id, user_id, user_tag, ticket_type, messages, close_reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          ticket.id,
          ticket.ticket_number,
          ticket.channel_id,
          ticket.user_id,
          interaction.user.tag,
          ticket.ticket_type || 'N/A',
          transcriptText,
          closeReason
        );

        db.prepare(`UPDATE tickets SET status = 'closed' WHERE channel_id = ?`).run(interaction.channel.id);

        const config = db.prepare(`SELECT * FROM configs WHERE guild_id = ?`).get(interaction.guild.id);
        
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
          SendMessages: false
        });
        
        await interaction.channel.permissionOverwrites.edit(ticket.user_id, {
          SendMessages: false
        });
        
        if (config && config.support_role_id) {
          await interaction.channel.permissionOverwrites.edit(config.support_role_id, {
            SendMessages: false
          });
        }

        await interaction.channel.send(`🔒 This ticket has been closed and locked. No one can send messages anymore.\n**Close Reason:** ${closeReason}`);

        if (config && config.transcript_channel_id) {
          const transcriptChannel = interaction.guild.channels.cache.get(config.transcript_channel_id);
          
          if (transcriptChannel) {
            const transcriptEmbed = new EmbedBuilder()
              .setTitle(`📜 Ticket #${ticket.ticket_number} - Transcript`)
              .setDescription(`**User:** <@${ticket.user_id}>\n**Type:** ${ticket.ticket_type || 'N/A'}\n**Closed by:** ${interaction.user}\n**Close Reason:** ${closeReason}\n**Messages:** ${allMessages.length}`)
              .setColor('#0A235B')
              .setTimestamp();

            const transcriptButton = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`view_transcript_${result.lastInsertRowid}`)
                .setLabel('View Transcript')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📄')
            );

            await transcriptChannel.send({ embeds: [transcriptEmbed], components: [transcriptButton] });
          }
        }

        await interaction.editReply({ content: `✅ Ticket closed and transcript saved (${allMessages.length} messages).` });
      } catch (error) {
        console.error('Error saving transcript:', error);
        
        try {
          const config = db.prepare(`SELECT * FROM configs WHERE guild_id = ?`).get(interaction.guild.id);
          
          await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: false
          });
          await interaction.channel.permissionOverwrites.edit(ticket.user_id, {
            SendMessages: false
          });
          
          if (config && config.support_role_id) {
            await interaction.channel.permissionOverwrites.edit(config.support_role_id, {
              SendMessages: false
            });
          }
        } catch (lockError) {
          console.error('Error locking channel:', lockError);
        }
        
        await interaction.editReply({ content: '✅ Ticket closed (transcript save failed).' });
      }
    }

    if (interaction.isButton() && interaction.customId.startsWith('view_transcript_')) {
      const db = require('../database');
      const transcriptId = interaction.customId.replace('view_transcript_', '');
      const transcript = db.prepare(`SELECT * FROM transcripts WHERE id = ?`).get(transcriptId);

      if (!transcript) {
        return interaction.reply({ content: '❌ Transcript not found.', ephemeral: true });
      }

      const transcriptEmbed = new EmbedBuilder()
        .setTitle(`📜 Ticket #${transcript.ticket_number} - Full Transcript`)
        .setDescription(`**User:** <@${transcript.user_id}> (${transcript.user_tag})\n**Type:** ${transcript.ticket_type}\n**Closed by:** ${transcript.user_tag}\n**Close Reason:** ${transcript.close_reason}\n**Closed:** <t:${Math.floor(new Date(transcript.closed_at).getTime() / 1000)}:F>\n\n**Messages:**\n\`\`\`\n${transcript.messages.slice(0, 3900)}\n\`\`\``)
        .setColor('#0A235B')
        .setTimestamp();

      if (transcript.messages.length > 3900) {
        transcriptEmbed.setFooter({ text: 'Transcript truncated due to Discord limits. Full transcript available to admins via /ticket transcript.' });
      }

      await interaction.reply({ embeds: [transcriptEmbed], ephemeral: true });
    }
  },
};
