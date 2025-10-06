const { SlashCommandBuilder, InteractionResponseFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands'),
  async execute(interaction) {
    await interaction.reply({
      content: 'Available commands: `/setup`, `/panel`, `/ticket`',
      flags: InteractionResponseFlags.Ephemeral,
    });
  },
};
