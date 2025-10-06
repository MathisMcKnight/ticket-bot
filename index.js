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
