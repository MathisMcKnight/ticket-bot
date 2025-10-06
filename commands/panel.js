const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Posts the ticket panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const requiredRoleId = '1165786013730361437';
    
    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({ 
        content: '❌ You do not have permission to use this command. Only White House Chief of Staff can create ticket panels.', 
        ephemeral: true 
      });
    }

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
          description: 'Questions & Support',
          value: 'general_inquiry',
        },
        {
          label: 'Press Clearance request',
          description: 'Media Authorization',
          value: 'press_clearance',
        },
        {
          label: 'Agency Directorate Hotline',
          description: 'Agency Matters',
          value: 'agency_hotline',
        },
        {
          label: 'White House Internal Affairs Hotline',
          description: 'Internal Reports',
          value: 'internal_affairs',
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ content: '✅ Panel created.', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  },
};
