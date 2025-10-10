# Discord Ticket Bot

## Overview
This project is a Discord bot designed to provide a comprehensive support ticket system within Discord servers. It enables users to create various types of support tickets and administrators to manage them efficiently. The bot aims to streamline communication, improve support workflows, and maintain organized records of interactions.

**Business Vision:** To offer a robust, scalable, and user-friendly ticket management solution for Discord communities, reducing manual overhead for administrators and improving user satisfaction.
**Market Potential:** Applicable to any Discord server requiring structured support, community management, or internal communication systems.
**Project Ambition:** To be the go-to solution for Discord server ticket management, known for its advanced features, reliability, and ease of use.

## User Preferences
I prefer simple language and direct answers. I like iterative development where we tackle features one by one. Please ask before making major architectural changes or deleting significant portions of code. I prefer detailed explanations for complex logic.

## System Architecture

### UI/UX Decisions
The bot utilizes Discord's native UI elements like slash commands, buttons, and modals for interactions. It features an interactive setup wizard for easy configuration. Transcripts are web-based, accessible via clickable links, offering a consistent and modern viewing experience without downloads.

### Technical Implementations
The bot is built on Node.js using `discord.js` v14. It uses `PostgreSQL` with connection pooling via the `pg` driver for production-grade database management. Transcripts are generated as HTML files using `discord-html-transcripts` and served via an `Express` web server.

### Feature Specifications
1.  **Multi-Type Ticket System**: Supports four distinct ticket types (General Inquiry, Press Clearance, Agency Directorate Hotline, White House Internal Affairs Hotline) with dedicated categories and manager roles.
2.  **Escalation System**: Allows escalation of tickets to a designated "White House Chief of Staff" role and category.
3.  **Transfer System**: Allows ticket managers to transfer tickets between four predefined categories (General Inquires, Internal Affairs, Agency Affairs, Comms Dept) with automatic permission updates.
4.  **Automatic Ticket Numbering**: Assigns sequential ticket numbers for easy tracking.
5.  **Smart Routing**: Tickets are automatically routed to the correct category and ping appropriate manager roles based on type.
6.  **Web-Based Transcripts**: Generates and hosts HTML transcripts viewable in browsers via unique, token-based URLs.
7.  **DM Notifications & Public Transcripts**: Users receive DM notifications with transcript links upon ticket closure, and transcript links are also posted in a designated public channel.
8.  **Blacklist Management**: Admins can blacklist/unblacklist users with reasons and view the blacklist.
9.  **Enhanced Command Security**: All commands require "Manage Messages" permission to view, completely hidden from general public. Setup commands restricted to White House Chief of Staff role only.
10. **Required Close Reasons**: All ticket closures necessitate a reason (5-500 characters) recorded in transcripts.
11. **Automated Channel Deletion**: Closed tickets result in automatic channel deletion after transcript archiving.
12. **Transcript History**: Admins can view transcript metadata for any user.
13. **Ticket Template**: Every new ticket includes an automatic embed prompting users to provide their Roblox Username and Purpose for Opening Ticket.
14. **Enhanced Panel**: Ticket panel includes concise 1-2 word descriptions for each ticket type (Questions & Support, Media Authorization, Agency Matters, Internal Reports).
15. **Streamlined Setup**: Two-part modal setup wizard that collects all configuration in one flow - Part 1 (General Inquiry, Press Clearance, Agency Hotline Category) and Part 2 (Agency Hotline Role, Internal Affairs, Escalation, Transcript Channel).
16. **Quick Config Commands**: Individual `/config` subcommands for fast adjustments using Discord's native role/channel selectors, restricted to Chief of Staff role only.

### System Design Choices
-   **Core Files**: `index.js` (main entry), `database.js` (DB setup).
-   **Modularity**: Commands and events are organized into separate directories (`commands/`, `events/`).
-   **Database Schema**: Dedicated tables for `tickets`, `configs`, `blacklists`, and `transcripts` to ensure data integrity and efficient querying. Server configurations are stored to manage category and role IDs for different ticket types and transcript channels.
-   **Environment Variables**: Uses `.env` for sensitive information like `DISCORD_TOKEN`.

## External Dependencies
-   `discord.js`: Discord API wrapper.
-   `pg`: PostgreSQL database driver with connection pooling.
-   `discord-html-transcripts`: For generating HTML transcripts.
-   `express`: Web server for hosting transcripts.
-   `uuid`: For generating unique identifiers (e.g., transcript tokens).
-   `dotenv`: For managing environment variables.

## Deployment

### Railway Deployment (Recommended)
The bot is optimized for Railway deployment with PostgreSQL:

1. **Create a new Railway project**
2. **Add PostgreSQL database:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway automatically creates a `DATABASE_URL` environment variable
3. **Deploy the bot:**
   - Connect your GitHub repository
   - Railway auto-detects the Dockerfile
4. **Set environment variables:**
   - `DISCORD_TOKEN` - Your Discord bot token
   - `CLIENT_ID` - Your Discord application client ID
   - `GUILD_ID` - Your Discord server (guild) ID
   - `DOMAIN` - Your Railway app's public domain (e.g., `your-app.up.railway.app`)
   - `DATABASE_URL` - Auto-set by Railway PostgreSQL addon
5. **Deploy and monitor** - Bot will auto-deploy on push

### Docker Deployment (Alternative)
The project is fully Dockerized for self-hosted deployment:

**Using Docker Compose:**
```bash
docker-compose up -d
```

**Using Docker directly:**
```bash
# Build the image
docker build -t ticket-bot .

# Run the container
docker run -d \
  -p 5000:5000 \
  -v $(pwd)/transcripts:/app/transcripts \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  --env-file .env \
  --name ticket-bot \
  ticket-bot
```

**Required Environment Variables:**
- `DISCORD_TOKEN` - Discord bot token
- `CLIENT_ID` - Discord application client ID
- `GUILD_ID` - Discord server ID
- `DOMAIN` - Public domain for transcript URLs
- `DATABASE_URL` - PostgreSQL connection string

**Files:**
- `Dockerfile` - Container build configuration
- `docker-compose.yml` - Multi-container orchestration
- `.dockerignore` - Excludes unnecessary files from build

**Volumes:**
- `transcripts/` - Persisted HTML transcripts

**Port:** 5000 (transcript server)