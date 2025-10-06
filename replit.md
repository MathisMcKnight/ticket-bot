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
1. **Multi-Type Ticket System** - Four distinct ticket types with dedicated categories and manager roles
2. **Ticket Types** - General Inquiry, Press Clearance request, Agency Directorate Hotline, White House Internal Affairs Hotline
3. **Escalation System** - Escalate any ticket to White House Chief of Staff with dedicated category
4. **Ticket Numbering** - Automatic sequential ticket numbers (#1, #2, #3, etc.) displayed in channels and embeds
5. **Smart Routing** - Tickets automatically route to correct category and ping appropriate manager role
6. **Web-Based Transcripts** - Transcripts hosted on Express server, viewable directly in browser
7. **One-Click Viewing** - Click "View Transcript" button to instantly open transcript in default browser
8. **Automatic DM Notifications** - Users receive clickable transcript links via DM when tickets close
9. **Public Transcript Channel** - Transcript links posted in designated channel with view buttons
10. **Advanced Blacklist Management** - Blacklist users with reasons, view all blacklisted users, and unblacklist
11. **Admin-Only Controls** - Close and Claim buttons require Administrator permissions (non-admins blocked)
12. **Required Close Reasons** - Modal popup requires 5-500 character reason for all ticket closures
13. **Ticket Management** - Close individual tickets, close all tickets at once, delete tickets with transcript
14. **Channel Deletion** - Closed tickets are automatically deleted after transcript archiving
15. **Transcript History** - View transcript metadata for any user with ticket numbers and close reasons
16. **Modal-Based Setup** - Interactive setup wizard with button-triggered modals for easy configuration

### Database Schema
- **tickets** - Stores ticket information (id, ticket_number, user_id, channel_id, status, ticket_type, created_at)
- **configs** - Server configurations with type-specific categories and roles:
  - guild_id (PRIMARY KEY)
  - general_inquiry_category_id, general_inquiry_role_id
  - press_clearance_category_id, press_clearance_role_id
  - agency_hotline_category_id, agency_hotline_role_id
  - internal_affairs_category_id, internal_affairs_role_id
  - escalation_category_id
  - transcript_channel_id
- **blacklists** - Blacklisted users (user_id, reason, blacklisted_at)
- **transcripts** - Transcript metadata (id, ticket_id, ticket_number, channel_id, user_id, user_tag, ticket_type, messages, close_reason, token, file_path, closed_at)

## Dependencies
- `discord.js` (^14.22.1) - Discord API wrapper
- `better-sqlite3` (^12.4.1) - SQLite database
- `discord-html-transcripts` (^3.2.0) - HTML transcript generation
- `express` (^4.x) - Web server for hosting transcripts
- `uuid` (^11.x) - Unique token generation
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
- `/setup` - Configure the ticket system (opens interactive setup wizard with buttons for each ticket type)
- `/panel` - Create ticket panel for users to open tickets
- `/help` - Display all available commands with descriptions

### Ticket Management Commands
- `/ticket admin` - List all open tickets with ticket numbers and types
- `/ticket escalate` - Escalate current ticket to White House Chief of Staff (moves to escalation category, pings role 1165786013730361437)
- `/ticket blacklist <user> <reason>` - Blacklist a user from creating tickets
- `/ticket unblacklist <user>` - Remove a user from the blacklist
- `/ticket list-blacklist` - Show all blacklisted users with reasons
- `/ticket delete <channel> <reason>` - Delete a ticket channel with reason and save complete transcript
- `/ticket close-all <reason>` - Close and lock all open tickets with reason
- `/ticket transcript <user>` - View saved transcripts for a user

## Recent Changes

### 2025-10-06 (Latest Update): Multi-Type Ticket System with Escalation
- **🎫 Four Ticket Types**
  - General Inquiry - For general questions
  - Press Clearance request - For press clearance requests
  - Agency Directorate Hotline - For agency directorate matters
  - White House Internal Affairs Hotline - For internal affairs reporting
  
- **🔀 Smart Routing System**
  - Each ticket type has dedicated category and manager role
  - Tickets automatically route to correct category based on type
  - Correct manager role automatically pinged when ticket created
  - Configuration stored per-type in database
  
- **⚡ Escalation System**
  - /ticket escalate command moves ticket to escalation category
  - Automatically pings White House Chief of Staff role (1165786013730361437)
  - Updates ticket type to "Escalation" in database
  - Only works on open tickets in ticket channels
  
- **🎨 Modal-Based Setup Wizard**
  - /setup command opens interactive wizard with 5 buttons
  - Each button opens modal for configuring that ticket type
  - Separate modals for General Inquiry, Press Clearance, Agency Hotline, Internal Affairs
  - Final modal configures escalation category and transcript channel
  - User-friendly: prompts admin to copy-paste category/role IDs
  
- **🔧 Database Schema Updates**
  - Added type-specific columns to configs table
  - Stores category_id and role_id for each of 4 ticket types
  - Stores escalation_category_id for escalation routing
  - Migrations run automatically on bot startup
  
- **🐛 Bug Fixes**
  - Fixed button handler flow control to prevent fall-through
  - All button handlers now properly return after responding
  - Setup modals now display correctly without errors

### 2025-10-06 (Previous Update): Web-Based Transcript System
- **🌐 Express Web Server**
  - Added Express server running on port 5000 to host transcripts
  - Transcripts accessible via secure token-based URLs
  - Routes: GET /transcripts/:token for serving HTML files
  
- **🔗 Clickable Link Buttons**
  - Replaced file attachments with ButtonStyle.Link buttons
  - "View Transcript" button opens transcript in user's default browser
  - Links work in DMs and transcript channel
  - One-click access to full conversation history
  
- **🔐 Token-Based Access Control**
  - UUID tokens generated for each transcript
  - Unique index ensures no duplicate tokens
  - Tokens stored in database with file paths
  - Access validation before serving files
  
- **💾 File Storage System**
  - HTML transcripts saved to /transcripts directory
  - Files named with UUID tokens for security
  - Database tracks token, file_path, and metadata
  - Transcripts persist on disk for long-term access
  
- **✨ User Experience Improvements**
  - Instant browser-based viewing (no downloads required)
  - Works seamlessly across all devices
  - Beautiful Discord Chat Exporter styling
  - All messages, embeds, and attachments preserved

### 2025-10-06 (Previous Update): HTML Transcript System with DM Notifications
- **📄 Discord Chat Exporter HTML Transcripts**
  - Replaced text-based transcripts with HTML transcripts using discord-html-transcripts package
  - Transcripts styled in Discord Chat Exporter format with embedded CSS
  - HTML files include all messages, attachments, embeds, and formatting
  - Filename format: `ticket-{number}-transcript.html` for easy identification
  
- **📧 Automatic DM Notifications**
  - Users automatically receive transcript file via DM when their ticket closes or is deleted
  - DM includes close/delete reason and who performed the action
  - Includes "Thanks for your communications with the White House!" footer
  - Graceful error handling if user has DMs disabled
  
- **🗑️ Channel Deletion Instead of Locking**
  - Closed tickets are now deleted after transcript is saved
  - /ticket delete command immediately deletes channel after archiving
  - /ticket close-all deletes channels with 3-second delay after archiving
  - Close button deletes channel immediately after transcript archiving
  
- **📂 Downloadable Transcript Files**
  - Transcript channel receives HTML files as direct attachments
  - Users can click to download and view full conversation history
  - Removed interactive "View Transcript" buttons (no longer needed)
  - Database stores filename reference for tracking
  
- **🔄 Updated Commands**
  - /ticket transcript now shows close reasons and references transcript channel
  - /help updated to reflect HTML transcript system
  - All close methods (button, delete, close-all) use consistent HTML export flow

### 2025-10-06 (Previous Update): Advanced Ticket System with Public Transcripts
- **🎫 Ticket Numbering System**
  - Added automatic sequential ticket numbering (#1, #2, #3, etc.)
  - Ticket numbers displayed in channel names (ticket-1, ticket-2, etc.)
  - Ticket numbers shown in all embeds and admin lists
  - Stored in database for permanent tracking
  
- **📜 Public Transcript Channel**
  - Added transcript_channel_id to server configuration
  - /setup now requires selecting a designated transcript channel
  - All closed/deleted tickets automatically post transcript embeds to public channel
  - Interactive "View Transcript" buttons allow users to view full transcripts
  - Transcripts show ticket number, user, type, closer, reason, and message count
  
- **🔒 Admin-Only Ticket Controls**
  - Close button now requires Administrator permission (blocks non-admins)
  - Claim button now requires Administrator permission (blocks non-admins)
  - Non-admins receive clear error message when attempting to use buttons
  
- **📝 Required Close Reasons**
  - Close button now shows modal requiring 5-500 character reason
  - /ticket delete requires reason parameter
  - /ticket close-all requires reason parameter
  - All reasons saved in transcripts table and displayed in embeds
  - Close reasons shown in ticket channels and transcript channel posts
  
- **🗄️ Database Schema Updates**
  - Added ticket_number column to tickets table with auto-increment
  - Added transcript_channel_id to configs table
  - Added ticket_number and close_reason columns to transcripts table
  - Updated all commands to use new schema

### 2025-10-06 (Previous Update): Complete Feature Overhaul
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

### 2025-10-06 (Initial): Import and Setup
  - Installed dependencies via npm
  - Configured workflow for bot execution
  - Verified bot connection and command registration
  - Fixed database API compatibility issues
  - Bot successfully logged in and operational
