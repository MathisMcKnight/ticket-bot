const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const db = require('../database');

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
    )
    .addSubcommand(sub =>
      sub
        .setName('close-all')
        .setDescription('Close all open tickets')
    )
    .addSubcommand(sub =>
      sub
        .setName('transcript')
        .setDescription('View saved transcripts for a user')
        .addUserOption(o =>
          o.setName('user').setDescription('User to view transcripts for').setRequired(true)
        )
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
        .setDescription(rows.map(r => `• <#${r.channel_id}> — <@${r.user_id}> (${r.ticket_type || 'N/A'})`).join('\n'))
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
      
      const ticket = db.prepare(`SELECT * FROM tickets WHERE channel_id = ?`).get(channel.id);
      
      if (!ticket) {
        return interaction.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        let allMessages = [];
        let lastId;

        while (true) {
          const options = { limit: 100 };
          if (lastId) options.before = lastId;

          const messages = await channel.messages.fetch(options);
          if (messages.size === 0) break;

          allMessages.push(...Array.from(messages.values()));
          lastId = messages.last().id;

          if (messages.size < 100) break;
        }

        allMessages.reverse();
        
        const transcriptText = allMessages.map(msg => 
          `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`
        ).join('\n');

        db.prepare(`
          INSERT INTO transcripts (ticket_id, channel_id, user_id, user_tag, ticket_type, messages)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          ticket.id,
          ticket.channel_id,
          ticket.user_id,
          allMessages[0]?.author?.tag || 'Unknown',
          ticket.ticket_type || 'N/A',
          transcriptText
        );

        db.prepare(`UPDATE tickets SET status = 'deleted' WHERE channel_id = ?`).run(channel.id);

        await channel.delete();
        
        await interaction.editReply({ content: `✅ Ticket deleted and transcript saved (${allMessages.length} messages).` });
      } catch (error) {
        console.error('Error deleting ticket:', error);
        await interaction.editReply({ content: '❌ Error deleting ticket.' });
      }
    }

    if (sub === 'close-all') {
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
            await channel.permissionOverwrites.edit(interaction.guild.id, {
              SendMessages: false
            });
            
            await channel.permissionOverwrites.edit(ticket.user_id, {
              SendMessages: false
            });
            
            if (config && config.support_role_id) {
              await channel.permissionOverwrites.edit(config.support_role_id, {
                SendMessages: false
              });
            }
            
            await channel.send('🔒 This ticket has been closed and locked. No one can send messages anymore.');
            db.prepare(`UPDATE tickets SET status = 'closed' WHERE channel_id = ?`).run(ticket.channel_id);
            closed++;
          }
        } catch (error) {
          console.error(`Error closing ticket ${ticket.channel_id}:`, error);
        }
      }

      await interaction.editReply({ content: `✅ Closed ${closed} ticket(s).` });
    }

    if (sub === 'transcript') {
      const user = interaction.options.getUser('user');
      
      const transcripts = db.prepare(`SELECT * FROM transcripts WHERE user_id = ? ORDER BY closed_at DESC`).all(user.id);
      
      if (transcripts.length === 0) {
        return interaction.reply({ content: `📋 No transcripts found for ${user.tag}.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`📜 Transcripts for ${user.tag}`)
        .setDescription(transcripts.map((t, i) => 
          `**${i + 1}.** Type: ${t.ticket_type} | Closed: ${new Date(t.closed_at).toLocaleDateString()}`
        ).join('\n'))
        .setColor('#0A235B')
        .setFooter({ text: `Total: ${transcripts.length} transcript(s)` });

      await interaction.reply({ embeds: [embed], ephemeral: true });

      if (transcripts[0].messages) {
        const firstTranscript = transcripts[0].messages.slice(0, 1900);
        await interaction.followUp({ 
          content: `**Latest Transcript:**\n\`\`\`${firstTranscript}${transcripts[0].messages.length > 1900 ? '...' : ''}\`\`\``,
          ephemeral: true 
        });
      }
    }
  },
};
