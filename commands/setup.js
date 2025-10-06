const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure ticket system - opens setup wizard')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const requiredRoleId = '1165786013730361437';
    
    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({ 
        content: '❌ You do not have permission to use this command. Only White House Chief of Staff can configure the ticket system.', 
        ephemeral: true 
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Ticket System Setup')
      .setDescription('Click the buttons below to configure each ticket type and the transcript channel.\n\n**Setup Steps:**\n1. Configure General Inquiry\n2. Configure Press Clearance\n3. Configure Agency Hotline\n4. Configure Internal Affairs\n5. Configure Escalation & Transcript\n\n**Easy Setup:** Use dropdown menus to select channels and roles - no need to copy IDs!')
      .setColor('#0A235B');

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_general_inquiry')
        .setLabel('General Inquiry')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝'),
      new ButtonBuilder()
        .setCustomId('setup_press_clearance')
        .setLabel('Press Clearance')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📰')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_agency_hotline')
        .setLabel('Agency Hotline')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📞'),
      new ButtonBuilder()
        .setCustomId('setup_internal_affairs')
        .setLabel('Internal Affairs')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔒')
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_escalation_transcript')
        .setLabel('Escalation & Transcript')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⚡')
    );

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2, row3],
      ephemeral: true
    });
  },
};
