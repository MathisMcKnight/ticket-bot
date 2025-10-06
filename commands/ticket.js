const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../database');
const discordTranscripts = require('discord-html-transcripts');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket management commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('admin')
        .setDescription('List all open tickets')
    )
    .addSubcommand(sub =>
      sub
        .setName('blacklist')
        .setDescription('Blacklist a user from creating tickets')
        .addUserOption(o =>
          o.setName('user').setDescription('User to blacklist').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('reason').setDescription('Reason for blacklist').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('unblacklist')
        .setDescription('Remove a user from the blacklist')
        .addUserOption(o =>
          o.setName('user').setDescription('User to unblacklist').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list-blacklist')
        .setDescription('Show all blacklisted users')
    )
    .addSubcommand(sub =>
      sub
        .setName('delete')
        .setDescription('Delete a ticket channel and save transcript')
        .addChannelOption(o =>
          o.setName('channel').setDescription('Ticket channel to delete').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('reason').setDescription('Reason for deletion').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('close-all')
        .setDescription('Close all open tickets')
        .addStringOption(o =>
          o.setName('reason').setDescription('Reason for closing all tickets').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('transcript')
        .setDescription('View saved transcripts for a user')
        .addUserOption(o =>
          o.setName('user').setDescription('User to view transcripts for').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('escalate')
        .setDescription('Escalate current ticket to White House Chief of Staff')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'admin') {
      const rows = db.prepare(`SELECT * FROM tickets WHERE status = 'open'`).all();
      
      if (rows.length === 0) {
        return interaction.reply({ content: '📋 No open tickets.', ephemeral: true });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('📋 Open Tickets')
        .setDescription(rows.map(r => `• **#${r.ticket_number}** <#${r.channel_id}> — <@${r.user_id}> (${r.ticket_type || 'N/A'})`).join('\n'))
        .setColor('#0A235B')
        .setFooter({ text: `Total: ${rows.length} ticket(s)` });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'blacklist') {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');

      db.prepare(`INSERT OR REPLACE INTO blacklists (user_id, reason) VALUES (?, ?)`).run(user.id, reason);
      
      const embed = new EmbedBuilder()
        .setTitle('🚫 User Blacklisted')
        .setDescription(`**User:** ${user.tag}\n**Reason:** ${reason}`)
        .setColor('#FF0000');

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'unblacklist') {
      const user = interaction.options.getUser('user');
      
      const result = db.prepare(`DELETE FROM blacklists WHERE user_id = ?`).run(user.id);
      
      if (result.changes === 0) {
        return interaction.reply({ content: '❌ User is not blacklisted.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ User Unblacklisted')
        .setDescription(`**User:** ${user.tag}`)
        .setColor('#00FF00');

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'list-blacklist') {
      const rows = db.prepare(`SELECT * FROM blacklists`).all();
      
      if (rows.length === 0) {
        return interaction.reply({ content: '📋 No blacklisted users.', ephemeral: true });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🚫 Blacklisted Users')
        .setDescription(rows.map(r => `• <@${r.user_id}> - ${r.reason || 'No reason'}`).join('\n'))
        .setColor('#FF0000')
        .setFooter({ text: `Total: ${rows.length} user(s)` });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'delete') {
      const channel = interaction.options.getChannel('channel');
      const reason = interaction.options.getString('reason');
      
      const ticket = db.prepare(`SELECT * FROM tickets WHERE channel_id = ?`).get(channel.id);
      
      if (!ticket) {
        return interaction.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const attachment = await discordTranscripts.createTranscript(channel, {
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
          `DELETED: ${reason}`,
          token,
          filePath
        );

        db.prepare(`UPDATE tickets SET status = 'deleted' WHERE channel_id = ?`).run(channel.id);

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
            .setTitle('🎫 Your Ticket Has Been Deleted')
            .setDescription(`Your ticket **#${ticket.ticket_number}** (${ticket.ticket_type || 'General'}) has been deleted.\n\nClick the button below to view your transcript in your browser.`)
            .addFields(
              { name: '📝 Delete Reason', value: reason },
              { name: '👤 Deleted By', value: interaction.user.tag }
            )
            .setColor('#FF0000')
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
              .setTitle(`📜 Ticket #${ticket.ticket_number} - Transcript (DELETED)`)
              .setDescription(`**User:** <@${ticket.user_id}>\n**Type:** ${ticket.ticket_type || 'N/A'}\n**Deleted by:** ${interaction.user}\n**Delete Reason:** ${reason}`)
              .setColor('#FF0000')
              .setTimestamp();

            await transcriptChannel.send({ 
              embeds: [transcriptEmbed],
              components: [viewButton]
            });
          }
        }

        await channel.delete();
        
        await interaction.editReply({ content: `✅ Ticket deleted! Transcript sent to user and saved.` });
      } catch (error) {
        console.error('Error deleting ticket:', error);
        await interaction.editReply({ content: '❌ Error deleting ticket.' });
      }
    }

    if (sub === 'close-all') {
      const reason = interaction.options.getString('reason');
      const rows = db.prepare(`SELECT * FROM tickets WHERE status = 'open'`).all();
      
      if (rows.length === 0) {
        return interaction.reply({ content: '📋 No open tickets to close.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const config = db.prepare(`SELECT * FROM configs WHERE guild_id = ?`).get(interaction.guild.id);
      
      let closed = 0;
      for (const ticket of rows) {
        try {
          const channel = await interaction.guild.channels.fetch(ticket.channel_id);
          if (channel) {
            const attachment = await discordTranscripts.createTranscript(channel, {
              limit: -1,
              filename: `ticket-${ticket.ticket_number}-transcript.html`,
              saveImages: true,
              poweredBy: false
            });

            const token = uuidv4();
            const fileName = `${token}.html`;
            const filePath = `transcripts/${fileName}`;
            
            await fs.writeFile(filePath, attachment.attachment);

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
              `BULK CLOSE: ${reason}`,
              token,
              filePath
            );

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
                  { name: '📝 Close Reason', value: `BULK CLOSE: ${reason}` },
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
                  .setDescription(`**User:** <@${ticket.user_id}>\n**Type:** ${ticket.ticket_type || 'N/A'}\n**Closed by:** ${interaction.user}\n**Close Reason:** BULK CLOSE: ${reason}`)
                  .setColor('#0A235B')
                  .setTimestamp();

                await transcriptChannel.send({ 
                  embeds: [transcriptEmbed],
                  components: [viewButton]
                });
              }
            }

            db.prepare(`UPDATE tickets SET status = 'closed' WHERE channel_id = ?`).run(ticket.channel_id);
            
            setTimeout(async () => {
              try {
                await channel.delete();
              } catch (deleteError) {
                console.error('Error deleting channel:', deleteError);
              }
            }, 3000);
            
            closed++;
          }
        } catch (error) {
          console.error(`Error closing ticket ${ticket.channel_id}:`, error);
        }
      }

      await interaction.editReply({ content: `✅ Closed ${closed} ticket(s)! Transcripts sent to users and saved. Channels will be deleted shortly.` });
    }

    if (sub === 'transcript') {
      const user = interaction.options.getUser('user');
      
      const transcripts = db.prepare(`SELECT * FROM transcripts WHERE user_id = ? ORDER BY closed_at DESC`).all(user.id);
      
      if (transcripts.length === 0) {
        return interaction.reply({ content: `📋 No transcripts found for ${user.tag}.`, ephemeral: true });
      }

      const config = db.prepare(`SELECT * FROM configs WHERE guild_id = ?`).get(interaction.guild.id);

      const embed = new EmbedBuilder()
        .setTitle(`📜 Transcripts for ${user.tag}`)
        .setDescription(transcripts.map((t, i) => 
          `**${i + 1}.** Ticket #${t.ticket_number} - ${t.ticket_type} | Closed: ${new Date(t.closed_at).toLocaleDateString()}\nReason: ${t.close_reason || 'N/A'}`
        ).join('\n\n'))
        .setColor('#0A235B')
        .setFooter({ text: `Total: ${transcripts.length} transcript(s). HTML transcripts available in ${config?.transcript_channel_id ? '#transcript-channel' : 'transcript channel'}.` });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'escalate') {
      const ticket = db.prepare(`SELECT * FROM tickets WHERE channel_id = ?`).get(interaction.channel.id);
      
      if (!ticket) {
        return interaction.reply({ content: '❌ This command can only be used in a ticket channel.', ephemeral: true });
      }

      if (ticket.status !== 'open') {
        return interaction.reply({ content: '❌ This ticket is already closed.', ephemeral: true });
      }

      const config = db.prepare(`SELECT * FROM configs WHERE guild_id = ?`).get(interaction.guild.id);

      if (!config || !config.escalation_category_id) {
        return interaction.reply({ content: '⚠️ Escalation category not configured. Please ask an admin to run /setup.', ephemeral: true });
      }

      const escalationRoleId = '1165786013730361437';
      const escalationCategory = interaction.guild.channels.cache.get(config.escalation_category_id);

      if (!escalationCategory) {
        return interaction.reply({ content: '❌ Escalation category not found.', ephemeral: true });
      }

      await interaction.channel.setParent(escalationCategory.id);

      db.prepare(`UPDATE tickets SET ticket_type = 'Escalation' WHERE channel_id = ?`).run(interaction.channel.id);

      const embed = new EmbedBuilder()
        .setTitle('⚡ Ticket Escalated')
        .setDescription(`This ticket has been escalated to the White House Chief of Staff.\n\n**Escalated by:** ${interaction.user}`)
        .setColor('#FF6B00')
        .setTimestamp();

      await interaction.channel.send({ content: `<@&${escalationRoleId}>`, embeds: [embed] });
      await interaction.reply({ content: '✅ Ticket escalated successfully!', ephemeral: true });
    }
  },
};
