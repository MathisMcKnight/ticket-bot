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
1. **Ticket Creation** - Users can create support tickets via interactive panel
2. **Ticket Type Tracking** - Tracks ticket types (General Inquiry, Support Request, Escalation)
3. **Complete Transcript System** - Saves full message history when tickets are closed or deleted
4. **Advanced Blacklist Management** - Blacklist users with reasons, view all blacklisted users, and unblacklist
5. **Admin-Only Commands** - All commands require Administrator permissions
6. **Ticket Management** - Close individual tickets, close all tickets at once, delete tickets with transcript
7. **Channel Locking** - Closed tickets prevent all users (including staff) from sending messages
8. **Transcript Viewing** - View saved transcripts for any user
9. **Server Configuration** - Admin command to set up ticket categories and roles

### Database Schema
- **tickets** - Stores ticket information (user_id, channel_id, status, ticket_type, created_at)
- **configs** - Server configurations (category_id, support_role_id)
- **blacklists** - Blacklisted users (user_id, reason, blacklisted_at)
- **transcripts** - Complete message history (ticket_id, channel_id, user_id, user_tag, ticket_type, messages, closed_at)

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
All commands require Administrator permissions:

### Setup Commands
- `/setup` - Configure the ticket system (category & support role)
- `/panel` - Create ticket panel for users to open tickets
- `/help` - Display all available commands with descriptions

### Ticket Management Commands
- `/ticket admin` - List all open tickets with types
- `/ticket blacklist <user> <reason>` - Blacklist a user from creating tickets
- `/ticket unblacklist <user>` - Remove a user from the blacklist
- `/ticket list-blacklist` - Show all blacklisted users with reasons
- `/ticket delete <channel>` - Delete a ticket channel and save complete transcript
- `/ticket close-all` - Close and lock all open tickets
- `/ticket transcript <user>` - View saved transcripts for a user

## Recent Changes

### 2025-10-06 (Latest Update): Complete Feature Overhaul
- **Transcript System**
  - Implemented complete message pagination (fetches ALL messages, not just 100)
  - Saves full conversation history when tickets are closed or deleted
  - View transcripts for any user with date and type information
  
- **Enhanced Blacklist System**
  - Added blacklist reasons and timestamps
  - Created unblacklist command to remove users from blacklist
  - Added list-blacklist command to view all blacklisted users with reasons
  - Blacklist reasons are shown to users when they attempt to create tickets
  
- **Admin Commands**
  - Made ALL commands admin-only (require Administrator permission)
  - Added /ticket delete command to delete channels with transcript saving
  - Added /ticket close-all command to close all open tickets at once
  - Updated /ticket admin to show ticket types
  - Enhanced /help command with comprehensive embed showing all features
  
- **Ticket System Improvements**
  - Added ticket type tracking (General Inquiry, Support Request, Escalation)
  - Implemented proper channel locking (denies SendMessages for everyone, ticket creator, and support role)
  - Added visual lock confirmation message when tickets are closed
  - Fixed database operations to use better-sqlite3 synchronous API
  
- **Database Schema Updates**
  - Added ticket_type and created_at to tickets table
  - Added reason and blacklisted_at to blacklists table
  - Created new transcripts table for message history storage

### 2025-10-06 (Initial): Import and Setup
  - Installed dependencies via npm
  - Configured workflow for bot execution
  - Verified bot connection and command registration
  - Fixed database API compatibility issues
  - Bot successfully logged in and operational
