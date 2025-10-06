const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📚 Ticket Bot Commands')
      .setDescription('**All commands require Administrator permissions**\n\n**✨ Features:**\n• Automatic ticket numbering (#1, #2, etc.)\n• Web-based transcripts viewable in browser\n• Click buttons to open transcripts instantly\n• Automatic DM notifications with view links\n• Channels deleted after archiving')
      .setColor('#0A235B')
      .addFields(
        { name: '⚙️ Setup Commands', value: '`/setup` - Configure ticket system (category, support role, transcript channel)\n`/panel` - Create ticket panel for users', inline: false },
        { name: '🎫 Ticket Management', value: '`/ticket admin` - List all open tickets with numbers\n`/ticket delete <channel> <reason>` - Delete ticket and send transcript link\n`/ticket close-all <reason>` - Close all tickets and send transcript links', inline: false },
        { name: '🚫 Blacklist Management', value: '`/ticket blacklist <user> <reason>` - Blacklist user\n`/ticket unblacklist <user>` - Remove from blacklist\n`/ticket list-blacklist` - View all blacklisted users', inline: false },
        { name: '📜 Transcripts', value: '`/ticket transcript <user>` - View transcript history\nClick "View Transcript" button to open in browser\nTranscripts auto-open in default browser', inline: false }
      )
      .setFooter({ text: 'White House Systems Ticket Bot • Click buttons to view transcripts instantly!' });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
