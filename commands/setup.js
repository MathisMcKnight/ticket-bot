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
    .addChannelOption(opt =>
      opt.setName('transcriptchannel').setDescription('Channel for public transcripts').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const category = interaction.options.getChannel('category');
    const role = interaction.options.getRole('supportrole');
    const transcriptChannel = interaction.options.getChannel('transcriptchannel');

    db.prepare(
      `INSERT OR REPLACE INTO configs (guild_id, category_id, support_role_id, transcript_channel_id) VALUES (?, ?, ?, ?)`
    ).run(interaction.guild.id, category.id, role.id, transcriptChannel.id);

    await interaction.reply({
      content: `✅ Configuration saved!\n📁 Category: ${category}\n👥 Role: ${role}\n📜 Transcript Channel: ${transcriptChannel}`,
      ephemeral: true,
    });
  },
};
