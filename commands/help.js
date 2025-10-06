const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📚 Ticket Bot Commands')
      .setDescription('**All commands require Administrator permissions**\n\n**✨ Features:**\n• 4 ticket types with dedicated categories & roles\n• Automatic ticket numbering (#1, #2, etc.)\n• Web-based transcripts viewable in browser\n• Click buttons to open transcripts instantly\n• Automatic DM notifications with view links\n• Escalation system to White House Chief of Staff')
      .setColor('#0A235B')
      .addFields(
        { name: '⚙️ Setup Commands', value: '`/setup` - Configure ticket system (opens setup wizard)\n`/panel` - Create ticket panel for users', inline: false },
        { name: '🎫 Ticket Types', value: '• General Inquiry\n• Press Clearance request\n• Agency Directorate Hotline\n• White House Internal Affairs Hotline\n• Escalation (via `/ticket escalate`)', inline: false },
        { name: '🛠️ Ticket Management', value: '`/ticket admin` - List all open tickets\n`/ticket escalate` - Escalate ticket to Chief of Staff\n`/ticket delete <channel> <reason>` - Delete ticket and send transcript\n`/ticket close-all <reason>` - Close all tickets', inline: false },
        { name: '🚫 Blacklist Management', value: '`/ticket blacklist <user> <reason>` - Blacklist user\n`/ticket unblacklist <user>` - Remove from blacklist\n`/ticket list-blacklist` - View all blacklisted users', inline: false },
        { name: '📜 Transcripts', value: '`/ticket transcript <user>` - View transcript history\nClick "View Transcript" button to open in browser', inline: false }
      )
      .setFooter({ text: 'White House Systems Ticket Bot • Multi-type routing with escalation support' });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
