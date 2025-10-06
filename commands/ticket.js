const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
        return interaction.reply({ content: '❌ You lack permissions.', ephemeral: true });
      }

      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');

      db.run(`INSERT OR REPLACE INTO blacklists (user_id, reason) VALUES (?, ?)`, [user.id, reason]);
      return interaction.reply({ content: `🚫 ${user.tag} was blacklisted for: ${reason}`, ephemeral: true });
    }

    if (sub === 'admin') {
      db.all(`SELECT * FROM tickets WHERE status = 'open'`, async (err, rows) => {
        if (err) return console.error(err);
        if (rows.length === 0) {
          return interaction.reply({ content: 'No open tickets.', ephemeral: true });
        }
        const list = rows.map(r => `• <#${r.channel_id}> — <@${r.user_id}>`).join('\n');
        await interaction.reply({ content: `📋 Open Tickets:\n${list}`, ephemeral: true });
      });
    }
  },
};
