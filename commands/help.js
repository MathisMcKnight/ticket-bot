const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📚 Ticket Bot Commands')
      .setDescription('**All commands require Administrator permissions**\n\n**✨ New Features:**\n• Automatic ticket numbering\n• Required close reasons via modal\n• Admin-only close/claim buttons\n• Public transcript channel with interactive buttons')
      .setColor('#0A235B')
      .addFields(
        { name: '⚙️ Setup Commands', value: '`/setup` - Configure ticket system (category, support role, transcript channel)\n`/panel` - Create ticket panel for users', inline: false },
        { name: '🎫 Ticket Management', value: '`/ticket admin` - List all open tickets with numbers\n`/ticket delete <channel> <reason>` - Delete ticket with reason\n`/ticket close-all <reason>` - Close all tickets with reason', inline: false },
        { name: '🚫 Blacklist Management', value: '`/ticket blacklist <user> <reason>` - Blacklist user\n`/ticket unblacklist <user>` - Remove from blacklist\n`/ticket list-blacklist` - View all blacklisted users', inline: false },
        { name: '📜 Transcripts', value: '`/ticket transcript <user>` - View saved transcripts\nPublic transcripts posted to designated channel with view buttons', inline: false }
      )
      .setFooter({ text: 'White House Systems Ticket Bot • Close reasons are required for all closures' });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
