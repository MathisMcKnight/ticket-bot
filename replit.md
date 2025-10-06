# Discord Ticket Bot

## Overview
This is a Discord bot designed to manage support tickets within Discord servers. It provides a comprehensive ticket system that allows users to create support tickets, and administrators to manage them efficiently.

## Current State
- **Status**: Fully operational and running
- **Bot Name**: White House Systems
- **Language**: JavaScript (Node.js)
- **Framework**: discord.js v14
- **Database**: SQLite (better-sqlite3)

## Project Architecture

### Core Files
- `index.js` - Main entry point, handles bot initialization, command registration, and event loading
- `database.js` - Database setup and initialization using better-sqlite3
- `package.json` - Project dependencies and scripts

### Directory Structure
```
.
├── commands/          # Slash commands
│   ├── help.js       # Help command
│   ├── panel.js      # Ticket panel command
│   ├── setup.js      # Server configuration
│   └── ticket.js     # Ticket management
├── events/           # Discord event handlers
│   ├── interactionCreate.js  # Command interactions
│   └── ready.js      # Bot ready event
├── index.js          # Main bot file
├── database.js       # Database initialization
├── data.db          # SQLite database (auto-created)
└── package.json     # Dependencies
```

### Features
1. **Ticket Creation** - Users can create support tickets
2. **Ticket Management** - Support staff can manage and respond to tickets
3. **Role-Based Access** - Configurable support roles
4. **Server Configuration** - Admin command to set up ticket categories and roles
5. **User Blacklist** - Ability to prevent certain users from creating tickets

### Database Schema
- **tickets** - Stores ticket information (user_id, channel_id, status)
- **configs** - Server configurations (category_id, support_role_id)
- **blacklists** - Blacklisted users

## Dependencies
- `discord.js` (^14.22.1) - Discord API wrapper
- `better-sqlite3` (^12.4.1) - SQLite database
- `dotenv` (^17.2.3) - Environment variable management
- `nodemon` (^3.1.10) - Development auto-reload

## Environment Variables
The bot requires the following secrets (configured in Replit Secrets):
- `DISCORD_TOKEN` - Discord bot authentication token
- `CLIENT_ID` - Discord application client ID
- `GUILD_ID` - (Optional) Discord server ID for faster command registration during development

## Running the Bot

### Start Command
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

## Workflow
The bot runs as a background workflow named "Discord Bot" that executes `npm start`. The workflow is configured for console output and starts automatically.

## Commands
The bot uses Discord slash commands:
- `/setup` - Configure the ticket system (Admin only)
- `/ticket` - Ticket management commands
- `/panel` - Create ticket panel
- `/help` - Display help information

## Recent Changes
- **2025-10-06**: Initial import and setup in Replit environment
  - Installed dependencies via npm
  - Configured workflow for bot execution
  - Verified bot connection and command registration
  - Bot successfully logged in and operational
