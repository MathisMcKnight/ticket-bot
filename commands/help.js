const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📚 Ticket Bot Commands')
      .setDescription('All commands require Administrator permissions')
      .setColor('#0A235B')
      .addFields(
        { name: '/setup', value: 'Configure the ticket system (category & support role)', inline: false },
        { name: '/panel', value: 'Create a ticket panel for users to open tickets', inline: false },
        { name: '/ticket admin', value: 'List all open tickets', inline: false },
        { name: '/ticket blacklist', value: 'Blacklist a user from creating tickets', inline: false },
        { name: '/ticket unblacklist', value: 'Remove a user from the blacklist', inline: false },
        { name: '/ticket list-blacklist', value: 'Show all blacklisted users', inline: false },
        { name: '/ticket delete', value: 'Delete a ticket channel and save transcript', inline: false },
        { name: '/ticket close-all', value: 'Close all open tickets', inline: false },
        { name: '/ticket transcript', value: 'View saved transcripts for a user', inline: false }
      )
      .setFooter({ text: 'White House Systems Ticket Bot' });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
