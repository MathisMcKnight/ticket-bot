# Discord Ticket Bot

## Overview
This project is a Discord bot designed to provide a comprehensive support ticket system within Discord servers. It enables users to create various types of support tickets and administrators to manage them efficiently. The bot aims to streamline communication, improve support workflows, and maintain organized records of interactions.

**Business Vision:** To offer a robust, scalable, and user-friendly ticket management solution for Discord communities, reducing manual overhead for administrators and improving user satisfaction.
**Market Potential:** Applicable to any Discord server requiring structured support, community management, or internal communication systems.
**Project Ambition:** To be the go-to solution for Discord server ticket management, known for its advanced features, reliability, and ease of use.

## User Preferences
I prefer simple language and direct answers. I like iterative development where we tackle features one by one. Please ask before making major architectural changes or deleting significant portions of code. I prefer detailed explanations for complex logic. Do not make changes to the `data.db` file directly.

## System Architecture

### UI/UX Decisions
The bot utilizes Discord's native UI elements like slash commands, buttons, and modals for interactions. It features an interactive setup wizard for easy configuration. Transcripts are web-based, accessible via clickable links, offering a consistent and modern viewing experience without downloads.

### Technical Implementations
The bot is built on Node.js using `discord.js` v14. It uses `better-sqlite3` for local database management. Transcripts are generated as HTML files using `discord-html-transcripts` and served via an `Express` web server.

### Feature Specifications
1.  **Multi-Type Ticket System**: Supports four distinct ticket types (General Inquiry, Press Clearance, Agency Directorate Hotline, White House Internal Affairs Hotline) with dedicated categories and manager roles.
2.  **Escalation System**: Allows escalation of tickets to a designated "White House Chief of Staff" role and category.
3.  **Automatic Ticket Numbering**: Assigns sequential ticket numbers for easy tracking.
4.  **Smart Routing**: Tickets are automatically routed to the correct category and ping appropriate manager roles based on type.
5.  **Web-Based Transcripts**: Generates and hosts HTML transcripts viewable in browsers via unique, token-based URLs.
6.  **DM Notifications & Public Transcripts**: Users receive DM notifications with transcript links upon ticket closure, and transcript links are also posted in a designated public channel.
7.  **Blacklist Management**: Admins can blacklist/unblacklist users with reasons and view the blacklist.
8.  **Admin-Only Controls**: Key management actions (Close, Claim, Delete) are restricted to administrators and require specific permissions or roles.
9.  **Required Close Reasons**: All ticket closures necessitate a reason (5-500 characters) recorded in transcripts.
10. **Automated Channel Deletion**: Closed tickets result in automatic channel deletion after transcript archiving.
11. **Transcript History**: Admins can view transcript metadata for any user.
12. **Modal-Based Setup**: Interactive wizard for server configuration using modals.

### System Design Choices
-   **Core Files**: `index.js` (main entry), `database.js` (DB setup).
-   **Modularity**: Commands and events are organized into separate directories (`commands/`, `events/`).
-   **Database Schema**: Dedicated tables for `tickets`, `configs`, `blacklists`, and `transcripts` to ensure data integrity and efficient querying. Server configurations are stored to manage category and role IDs for different ticket types and transcript channels.
-   **Environment Variables**: Uses `.env` for sensitive information like `DISCORD_TOKEN`.

## External Dependencies
-   `discord.js`: Discord API wrapper.
-   `better-sqlite3`: SQLite database driver.
-   `discord-html-transcripts`: For generating HTML transcripts.
-   `express`: Web server for hosting transcripts.
-   `uuid`: For generating unique identifiers (e.g., transcript tokens).
-   `dotenv`: For managing environment variables.