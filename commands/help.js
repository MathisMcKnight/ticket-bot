const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📚 Ticket Bot Commands')
      .setDescription('**All commands require Administrator permissions**\n\n**✨ Features:**\n• Automatic ticket numbering (#1, #2, etc.)\n• HTML transcripts in Discord Chat Exporter format\n• Automatic DM notifications with transcripts\n• Channels deleted after archiving\n• Required close reasons via modal')
      .setColor('#0A235B')
      .addFields(
        { name: '⚙️ Setup Commands', value: '`/setup` - Configure ticket system (category, support role, transcript channel)\n`/panel` - Create ticket panel for users', inline: false },
        { name: '🎫 Ticket Management', value: '`/ticket admin` - List all open tickets with numbers\n`/ticket delete <channel> <reason>` - Delete ticket and send transcript\n`/ticket close-all <reason>` - Close all tickets and send transcripts', inline: false },
        { name: '🚫 Blacklist Management', value: '`/ticket blacklist <user> <reason>` - Blacklist user\n`/ticket unblacklist <user>` - Remove from blacklist\n`/ticket list-blacklist` - View all blacklisted users', inline: false },
        { name: '📜 Transcripts', value: '`/ticket transcript <user>` - View transcript history\nHTML transcripts posted to transcript channel\nUsers receive transcripts via DM automatically', inline: false }
      )
      .setFooter({ text: 'White House Systems Ticket Bot • HTML transcripts sent to users on close/delete' });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
