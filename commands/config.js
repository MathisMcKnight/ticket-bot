const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Quick configuration commands for ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub
        .setName('general-inquiry')
        .setDescription('Configure General Inquiry ticket settings')
        .addChannelOption(o =>
          o.setName('category')
            .setDescription('Category for General Inquiry tickets')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addRoleOption(o =>
          o.setName('role')
            .setDescription('Manager role for General Inquiry tickets')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('press-clearance')
        .setDescription('Configure Press Clearance ticket settings')
        .addChannelOption(o =>
          o.setName('category')
            .setDescription('Category for Press Clearance tickets')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addRoleOption(o =>
          o.setName('role')
            .setDescription('Manager role for Press Clearance tickets')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('agency-hotline')
        .setDescription('Configure Agency Hotline ticket settings')
        .addChannelOption(o =>
          o.setName('category')
            .setDescription('Category for Agency Hotline tickets')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addRoleOption(o =>
          o.setName('role')
            .setDescription('Manager role for Agency Hotline tickets')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('internal-affairs')
        .setDescription('Configure Internal Affairs ticket settings')
        .addChannelOption(o =>
          o.setName('category')
            .setDescription('Category for Internal Affairs tickets')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
        .addRoleOption(o =>
          o.setName('role')
            .setDescription('Manager role for Internal Affairs tickets')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('escalation-category')
        .setDescription('Configure escalation category')
        .addChannelOption(o =>
          o.setName('category')
            .setDescription('Category for escalated tickets')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('transcript-channel')
        .setDescription('Configure transcript channel')
        .addChannelOption(o =>
          o.setName('channel')
            .setDescription('Channel for transcript messages')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const requiredRoleId = '1165786013730361437';
    
    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({ 
        content: '❌ You do not have permission to use this command. Only White House Chief of Staff can configure the ticket system.', 
        ephemeral: true 
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'general-inquiry') {
      const category = interaction.options.getChannel('category');
      const role = interaction.options.getRole('role');

      db.prepare(`
        INSERT INTO configs (guild_id, general_inquiry_category_id, general_inquiry_role_id) 
        VALUES (?, ?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET 
          general_inquiry_category_id = excluded.general_inquiry_category_id,
          general_inquiry_role_id = excluded.general_inquiry_role_id
      `).run(interaction.guild.id, category.id, role.id);

      return interaction.reply({ 
        content: `✅ **General Inquiry** configured!\n📂 Category: ${category}\n👥 Manager Role: ${role}`, 
        ephemeral: true 
      });
    }

    if (sub === 'press-clearance') {
      const category = interaction.options.getChannel('category');
      const role = interaction.options.getRole('role');

      db.prepare(`
        INSERT INTO configs (guild_id, press_clearance_category_id, press_clearance_role_id) 
        VALUES (?, ?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET 
          press_clearance_category_id = excluded.press_clearance_category_id,
          press_clearance_role_id = excluded.press_clearance_role_id
      `).run(interaction.guild.id, category.id, role.id);

      return interaction.reply({ 
        content: `✅ **Press Clearance** configured!\n📂 Category: ${category}\n👥 Manager Role: ${role}`, 
        ephemeral: true 
      });
    }

    if (sub === 'agency-hotline') {
      const category = interaction.options.getChannel('category');
      const role = interaction.options.getRole('role');

      db.prepare(`
        INSERT INTO configs (guild_id, agency_hotline_category_id, agency_hotline_role_id) 
        VALUES (?, ?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET 
          agency_hotline_category_id = excluded.agency_hotline_category_id,
          agency_hotline_role_id = excluded.agency_hotline_role_id
      `).run(interaction.guild.id, category.id, role.id);

      return interaction.reply({ 
        content: `✅ **Agency Hotline** configured!\n📂 Category: ${category}\n👥 Manager Role: ${role}`, 
        ephemeral: true 
      });
    }

    if (sub === 'internal-affairs') {
      const category = interaction.options.getChannel('category');
      const role = interaction.options.getRole('role');

      db.prepare(`
        INSERT INTO configs (guild_id, internal_affairs_category_id, internal_affairs_role_id) 
        VALUES (?, ?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET 
          internal_affairs_category_id = excluded.internal_affairs_category_id,
          internal_affairs_role_id = excluded.internal_affairs_role_id
      `).run(interaction.guild.id, category.id, role.id);

      return interaction.reply({ 
        content: `✅ **Internal Affairs** configured!\n📂 Category: ${category}\n👥 Manager Role: ${role}`, 
        ephemeral: true 
      });
    }

    if (sub === 'escalation-category') {
      const category = interaction.options.getChannel('category');

      db.prepare(`
        INSERT INTO configs (guild_id, escalation_category_id) 
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET 
          escalation_category_id = excluded.escalation_category_id
      `).run(interaction.guild.id, category.id);

      return interaction.reply({ 
        content: `✅ **Escalation Category** configured!\n📂 Category: ${category}`, 
        ephemeral: true 
      });
    }

    if (sub === 'transcript-channel') {
      const channel = interaction.options.getChannel('channel');

      db.prepare(`
        INSERT INTO configs (guild_id, transcript_channel_id) 
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET 
          transcript_channel_id = excluded.transcript_channel_id
      `).run(interaction.guild.id, channel.id);

      return interaction.reply({ 
        content: `✅ **Transcript Channel** configured!\n📝 Channel: ${channel}`, 
        ephemeral: true 
      });
    }
  },
};
