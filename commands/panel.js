const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  InteractionResponseFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Posts the ticket panel'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🎟️ Ticket Panel')
      .setDescription('Select a category below to open a support ticket.')
      .setColor('#0A235B')
      .setThumbnail('https://cdn.discordapp.com/attachments/1199006145323479192/1424566777534480404/image.png');

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket-panel')
      .setPlaceholder('Select a ticket type...')
      .addOptions([
        {
          label: 'General Inquiry',
          description: 'Ask a general question',
          value: 'general',
        },
        {
          label: 'Support Request',
          description: 'Get help from the support team',
          value: 'support',
        },
        {
          label: 'Escalation',
          description: 'Escalate to White House Chief of Staff',
          value: 'escalate',
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ content: '✅ Panel created.', flags: InteractionResponseFlags.Ephemeral });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  },
};
