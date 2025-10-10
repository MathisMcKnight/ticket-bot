const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure individual ticket types')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub
        .setName('general-inquiry')
        .setDescription('Configure General Inquiry ticket type')
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
        .setDescription('Configure Press Clearance ticket type')
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
        .setDescription('Configure Agency Hotline ticket type')
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
        .setDescription('Configure Internal Affairs ticket type')
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
        .setName('escalation')
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
            .setDescription('Channel where transcripts will be posted')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('View current configuration')
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

      try {
        await db.query(`
          INSERT INTO configs (guild_id, general_inquiry_category_id, general_inquiry_role_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT(guild_id) DO UPDATE SET 
            general_inquiry_category_id = EXCLUDED.general_inquiry_category_id,
            general_inquiry_role_id = EXCLUDED.general_inquiry_role_id
        `, [interaction.guild.id, category.id, role.id]);

        return interaction.reply({ 
          content: `✅ **General Inquiry** configured!\n📂 Category: ${category}\n👥 Manager Role: ${role}`, 
          ephemeral: true 
        });
      } catch (error) {
        console.error('Error configuring general inquiry:', error);
        return interaction.reply({ content: '❌ Error saving configuration.', ephemeral: true });
      }
    }

    if (sub === 'press-clearance') {
      const category = interaction.options.getChannel('category');
      const role = interaction.options.getRole('role');

      try {
        await db.query(`
          INSERT INTO configs (guild_id, press_clearance_category_id, press_clearance_role_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT(guild_id) DO UPDATE SET 
            press_clearance_category_id = EXCLUDED.press_clearance_category_id,
            press_clearance_role_id = EXCLUDED.press_clearance_role_id
        `, [interaction.guild.id, category.id, role.id]);

        return interaction.reply({ 
          content: `✅ **Press Clearance** configured!\n📂 Category: ${category}\n👥 Manager Role: ${role}`, 
          ephemeral: true 
        });
      } catch (error) {
        console.error('Error configuring press clearance:', error);
        return interaction.reply({ content: '❌ Error saving configuration.', ephemeral: true });
      }
    }

    if (sub === 'agency-hotline') {
      const category = interaction.options.getChannel('category');
      const role = interaction.options.getRole('role');

      try {
        await db.query(`
          INSERT INTO configs (guild_id, agency_hotline_category_id, agency_hotline_role_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT(guild_id) DO UPDATE SET 
            agency_hotline_category_id = EXCLUDED.agency_hotline_category_id,
            agency_hotline_role_id = EXCLUDED.agency_hotline_role_id
        `, [interaction.guild.id, category.id, role.id]);

        return interaction.reply({ 
          content: `✅ **Agency Hotline** configured!\n📂 Category: ${category}\n👥 Manager Role: ${role}`, 
          ephemeral: true 
        });
      } catch (error) {
        console.error('Error configuring agency hotline:', error);
        return interaction.reply({ content: '❌ Error saving configuration.', ephemeral: true });
      }
    }

    if (sub === 'internal-affairs') {
      const category = interaction.options.getChannel('category');
      const role = interaction.options.getRole('role');

      try {
        await db.query(`
          INSERT INTO configs (guild_id, internal_affairs_category_id, internal_affairs_role_id) 
          VALUES ($1, $2, $3)
          ON CONFLICT(guild_id) DO UPDATE SET 
            internal_affairs_category_id = EXCLUDED.internal_affairs_category_id,
            internal_affairs_role_id = EXCLUDED.internal_affairs_role_id
        `, [interaction.guild.id, category.id, role.id]);

        return interaction.reply({ 
          content: `✅ **Internal Affairs** configured!\n📂 Category: ${category}\n👥 Manager Role: ${role}`, 
          ephemeral: true 
        });
      } catch (error) {
        console.error('Error configuring internal affairs:', error);
        return interaction.reply({ content: '❌ Error saving configuration.', ephemeral: true });
      }
    }

    if (sub === 'escalation') {
      const category = interaction.options.getChannel('category');

      try {
        await db.query(`
          INSERT INTO configs (guild_id, escalation_category_id) 
          VALUES ($1, $2)
          ON CONFLICT(guild_id) DO UPDATE SET 
            escalation_category_id = EXCLUDED.escalation_category_id
        `, [interaction.guild.id, category.id]);

        return interaction.reply({ 
          content: `✅ **Escalation Category** configured!\n📂 Category: ${category}`, 
          ephemeral: true 
        });
      } catch (error) {
        console.error('Error configuring escalation:', error);
        return interaction.reply({ content: '❌ Error saving configuration.', ephemeral: true });
      }
    }

    if (sub === 'transcript-channel') {
      const channel = interaction.options.getChannel('channel');

      try {
        await db.query(`
          INSERT INTO configs (guild_id, transcript_channel_id) 
          VALUES ($1, $2)
          ON CONFLICT(guild_id) DO UPDATE SET 
            transcript_channel_id = EXCLUDED.transcript_channel_id
        `, [interaction.guild.id, channel.id]);

        return interaction.reply({ 
          content: `✅ **Transcript Channel** configured!\n📝 Channel: ${channel}`, 
          ephemeral: true 
        });
      } catch (error) {
        console.error('Error configuring transcript channel:', error);
        return interaction.reply({ content: '❌ Error saving configuration.', ephemeral: true });
      }
    }

    if (sub === 'view') {
      try {
        const result = await db.query(`SELECT * FROM configs WHERE guild_id = $1`, [interaction.guild.id]);
        const config = result.rows[0];

        if (!config) {
          return interaction.reply({ 
            content: '⚙️ No configuration found. Use `/config` subcommands or `/setup` to configure the bot.', 
            ephemeral: true 
          });
        }

        const embed = {
          title: '⚙️ Current Configuration',
          color: 0x0A235B,
          fields: [
            {
              name: '📝 General Inquiry',
              value: config.general_inquiry_category_id 
                ? `Category: <#${config.general_inquiry_category_id}>\nRole: <@&${config.general_inquiry_role_id}>`
                : 'Not configured',
              inline: true
            },
            {
              name: '📰 Press Clearance',
              value: config.press_clearance_category_id 
                ? `Category: <#${config.press_clearance_category_id}>\nRole: <@&${config.press_clearance_role_id}>`
                : 'Not configured',
              inline: true
            },
            {
              name: '📞 Agency Hotline',
              value: config.agency_hotline_category_id 
                ? `Category: <#${config.agency_hotline_category_id}>\nRole: <@&${config.agency_hotline_role_id}>`
                : 'Not configured',
              inline: true
            },
            {
              name: '🔒 Internal Affairs',
              value: config.internal_affairs_category_id 
                ? `Category: <#${config.internal_affairs_category_id}>\nRole: <@&${config.internal_affairs_role_id}>`
                : 'Not configured',
              inline: true
            },
            {
              name: '⚡ Escalation',
              value: config.escalation_category_id 
                ? `Category: <#${config.escalation_category_id}>`
                : 'Not configured',
              inline: true
            },
            {
              name: '📜 Transcript Channel',
              value: config.transcript_channel_id 
                ? `<#${config.transcript_channel_id}>`
                : 'Not configured',
              inline: true
            }
          ]
        };

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('Error viewing configuration:', error);
        return interaction.reply({ content: '❌ Error retrieving configuration.', ephemeral: true });
      }
    }
  },
};
