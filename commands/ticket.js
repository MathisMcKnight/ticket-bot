const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionResponseFlags,
} = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket management commands')
    .addSubcommand(sub =>
      sub
        .setName('blacklist')
        .setDescription('Blacklist a user from creating tickets')
        .addUserOption(o =>
          o.setName('user').setDescription('User to blacklist').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('reason').setDescription('Reason').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('admin').setDescription('List all open tickets (admin only)')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'blacklist') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ You lack permissions.', flags: InteractionResponseFlags.Ephemeral });
      }

      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');

      db.prepare(`INSERT OR REPLACE INTO blacklists (user_id) VALUES (?)`).run(user.id);
      return interaction.reply({ content: `🚫 ${user.tag} was blacklisted for: ${reason}`, flags: InteractionResponseFlags.Ephemeral });
    }

    if (sub === 'admin') {
      const rows = db.prepare(`SELECT * FROM tickets WHERE status = 'open'`).all();
      
      if (rows.length === 0) {
        return interaction.reply({ content: 'No open tickets.', flags: InteractionResponseFlags.Ephemeral });
      }
      
      const list = rows.map(r => `• <#${r.channel_id}> — <@${r.user_id}>`).join('\n');
      await interaction.reply({ content: `📋 Open Tickets:\n${list}`, flags: InteractionResponseFlags.Ephemeral });
    }
  },
};
