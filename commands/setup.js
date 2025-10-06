const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure ticket system for this server')
    .addChannelOption(opt =>
      opt.setName('category').setDescription('Ticket category').setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('supportrole').setDescription('Support role').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const category = interaction.options.getChannel('category');
    const role = interaction.options.getRole('supportrole');

    db.prepare(
      `INSERT OR REPLACE INTO configs (guild_id, category_id, support_role_id) VALUES (?, ?, ?)`
    ).run(interaction.guild.id, category.id, role.id);

    await interaction.reply({
      content: `✅ Configuration saved! Category: ${category}, Role: ${role}`,
      ephemeral: true,
    });
  },
};
