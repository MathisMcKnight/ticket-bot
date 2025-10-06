require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith(".js"));
const commands = [];
for (const file of commandFiles) {
  const command = require(path.join(__dirname, "commands", file));
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

// Register commands: use GUILD_ID for instant testing, otherwise global
(async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  try {
    if (process.env.GUILD_ID) {
      console.log("Registering guild commands...");
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
      console.log("Registered guild commands.");
    } else {
      console.log("Registering global commands (may take up to an hour to appear)...");
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
      console.log("Registered global commands.");
    }
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
})();

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, "events")).filter(f => f.endsWith(".js"));
for (const file of eventFiles) {
  const event = require(path.join(__dirname, "events", file));
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
}

client.login(process.env.DISCORD_TOKEN);

// Express server for serving transcripts
const express = require('express');
const db = require('./database');
const app = express();

app.get('/transcripts/:token', (req, res) => {
  const { token } = req.params;
  
  const transcript = db.prepare('SELECT * FROM transcripts WHERE token = ?').get(token);
  
  if (!transcript) {
    return res.status(404).send('<h1>404 - Transcript Not Found</h1><p>This transcript does not exist or has been deleted.</p>');
  }
  
  if (!transcript.file_path) {
    return res.status(404).send('<h1>404 - Transcript File Missing</h1><p>The transcript file could not be found.</p>');
  }
  
  res.sendFile(path.join(__dirname, transcript.file_path));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Transcript server running on port ${PORT}`);
  console.log(`📄 Transcripts accessible at: https://${process.env.REPLIT_DEV_DOMAIN}/transcripts/:token`);
});
