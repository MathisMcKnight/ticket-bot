module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Command error.', ephemeral: true });
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket-panel') {
      const choice = interaction.values[0];
      const db = require('../database');

      db.get(`SELECT * FROM configs WHERE guild_id = ?`, [interaction.guild.id], async (err, config) => {
        if (err || !config) {
          return interaction.reply({ content: '⚙️ Run `/setup` first.', ephemeral: true });
        }

        db.get(`SELECT * FROM blacklists WHERE user_id = ?`, [interaction.user.id], async (err, bl) => {
          if (bl) {
            return interaction.reply({ content: '🚫 You are blacklisted.', ephemeral: true });
          }

          const category = interaction.guild.channels.cache.get(config.category_id);
          const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 0,
            parent: category.id,
            permissionOverwrites: [
              { id: interaction.guild.id, deny: ['ViewChannel'] },
              { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] },
              { id: config.support_role_id, allow: ['ViewChannel', 'SendMessages'] },
            ],
          });

          db.run(`INSERT INTO tickets (user_id, channel_id, status) VALUES (?, ?, 'open')`, [
            interaction.user.id,
            channel.id,
          ]);

          const embed = new EmbedBuilder()
            .setTitle('🎫 New Ticket')
            .setDescription(`Type your issue below. A staff member will assist you shortly.`)
            .setColor('#0A235B');

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger)
          );

          await channel.send({ content: `<@&${config.support_role_id}>`, embeds: [embed], components: [row] });
          await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
        });
      });
    }

    if (interaction.isButton()) {
      const db = require('../database');

      if (interaction.customId === 'close_ticket') {
        db.run(`UPDATE tickets SET status = 'closed' WHERE channel_id = ?`, [interaction.channel.id]);
        await interaction.reply({ content: '✅ Ticket closed.', ephemeral: true });
        await interaction.channel.setLocked(true);
      }

      if (interaction.customId === 'claim_ticket') {
        await interaction.reply({ content: `🎟️ Ticket claimed by ${interaction.user.tag}`, ephemeral: false });
      }
    }
  },
};
