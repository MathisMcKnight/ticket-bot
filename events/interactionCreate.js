const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

      const config = db.prepare(`SELECT * FROM configs WHERE guild_id = ?`).get(interaction.guild.id);
      
      if (!config) {
        return interaction.reply({ content: '⚙️ Run `/setup` first.', ephemeral: true });
      }

      const bl = db.prepare(`SELECT * FROM blacklists WHERE user_id = ?`).get(interaction.user.id);
      
      if (bl) {
        return interaction.reply({ 
          content: `🚫 You are blacklisted.\n**Reason:** ${bl.reason || 'No reason provided'}`, 
          ephemeral: true 
        });
      }

      const ticketTypes = {
        'general': 'General Inquiry',
        'support': 'Support Request',
        'escalate': 'Escalation'
      };

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

      db.prepare(`INSERT INTO tickets (user_id, channel_id, status, ticket_type) VALUES (?, ?, 'open', ?)`).run(
        interaction.user.id,
        channel.id,
        ticketTypes[choice] || choice
      );

      const embed = new EmbedBuilder()
        .setTitle('🎫 New Ticket')
        .setDescription(`**Type:** ${ticketTypes[choice] || choice}\n\nType your issue below. A staff member will assist you shortly.`)
        .setColor('#0A235B');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('claim_ticket').setLabel('Claim').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger)
      );

      await channel.send({ content: `<@&${config.support_role_id}>`, embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
    }

    if (interaction.isButton()) {
      const db = require('../database');

      if (interaction.customId === 'close_ticket') {
        const ticket = db.prepare(`SELECT * FROM tickets WHERE channel_id = ?`).get(interaction.channel.id);
        
        if (ticket) {
          await interaction.deferReply({ ephemeral: true });

          try {
            let allMessages = [];
            let lastId;

            while (true) {
              const options = { limit: 100 };
              if (lastId) options.before = lastId;

              const messages = await interaction.channel.messages.fetch(options);
              if (messages.size === 0) break;

              allMessages.push(...Array.from(messages.values()));
              lastId = messages.last().id;

              if (messages.size < 100) break;
            }

            allMessages.reverse();
            
            const transcriptText = allMessages.map(msg => 
              `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`
            ).join('\n');

            db.prepare(`
              INSERT INTO transcripts (ticket_id, channel_id, user_id, user_tag, ticket_type, messages)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              ticket.id,
              ticket.channel_id,
              ticket.user_id,
              interaction.user.tag,
              ticket.ticket_type || 'N/A',
              transcriptText
            );

            db.prepare(`UPDATE tickets SET status = 'closed' WHERE channel_id = ?`).run(interaction.channel.id);

            const config = db.prepare(`SELECT * FROM configs WHERE guild_id = ?`).get(interaction.guild.id);
            
            await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
              SendMessages: false
            });
            
            await interaction.channel.permissionOverwrites.edit(ticket.user_id, {
              SendMessages: false
            });
            
            if (config && config.support_role_id) {
              await interaction.channel.permissionOverwrites.edit(config.support_role_id, {
                SendMessages: false
              });
            }

            await interaction.channel.send('🔒 This ticket has been closed and locked. No one can send messages anymore.');
            await interaction.editReply({ content: `✅ Ticket closed and transcript saved (${allMessages.length} messages).` });
          } catch (error) {
            console.error('Error saving transcript:', error);
            
            try {
              const config = db.prepare(`SELECT * FROM configs WHERE guild_id = ?`).get(interaction.guild.id);
              
              await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: false
              });
              await interaction.channel.permissionOverwrites.edit(ticket.user_id, {
                SendMessages: false
              });
              
              if (config && config.support_role_id) {
                await interaction.channel.permissionOverwrites.edit(config.support_role_id, {
                  SendMessages: false
                });
              }
            } catch (lockError) {
              console.error('Error locking channel:', lockError);
            }
            
            await interaction.editReply({ content: '✅ Ticket closed (transcript save failed).' });
          }
        }
      }

      if (interaction.customId === 'claim_ticket') {
        await interaction.reply({ content: `🎟️ Ticket claimed by ${interaction.user.tag}` });
      }
    }
  },
};
