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

    const modal = new ModalBuilder()
      .setCustomId('setup_modal_part1')
      .setTitle('Ticket System Setup (1/2)');

    const generalCategoryInput = new TextInputBuilder()
      .setCustomId('general_inquiry_category')
      .setLabel('General Inquiry - Category ID')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Right-click category → Copy ID')
      .setRequired(false);

    const generalRoleInput = new TextInputBuilder()
      .setCustomId('general_inquiry_role')
      .setLabel('General Inquiry - Manager Role ID')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Right-click role → Copy ID')
      .setRequired(false);

    const pressCategoryInput = new TextInputBuilder()
      .setCustomId('press_clearance_category')
      .setLabel('Press Clearance - Category ID')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Right-click category → Copy ID')
      .setRequired(false);

    const pressRoleInput = new TextInputBuilder()
      .setCustomId('press_clearance_role')
      .setLabel('Press Clearance - Manager Role ID')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Right-click role → Copy ID')
      .setRequired(false);

    const agencyCategoryInput = new TextInputBuilder()
      .setCustomId('agency_hotline_category')
      .setLabel('Agency Hotline - Category ID')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Right-click category → Copy ID')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(generalCategoryInput),
      new ActionRowBuilder().addComponents(generalRoleInput),
      new ActionRowBuilder().addComponents(pressCategoryInput),
      new ActionRowBuilder().addComponents(pressRoleInput),
      new ActionRowBuilder().addComponents(agencyCategoryInput)
    );

    await interaction.showModal(modal);
  },
};
