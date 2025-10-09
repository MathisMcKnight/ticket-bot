# Discord Ticket Bot

A comprehensive Discord ticket management system for the White House Systems server with multi-type tickets, web-based transcripts, and advanced management features.

## Features

- **Multi-Type Ticket System** - 4 ticket types with dedicated categories and roles
- **Web-Based Transcripts** - HTML transcripts accessible via browser links
- **Escalation System** - Escalate tickets to Chief of Staff
- **Transfer System** - Move tickets between departments
- **Blacklist Management** - Block users from creating tickets
- **Automatic Ticket Numbering** - Sequential tracking
- **DM Notifications** - Users receive transcript links when tickets close
- **Command Security** - All commands hidden from public (Manage Messages required)

## Quick Start

### Windows Server (Recommended for Home Servers)

See **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)** for complete Windows deployment guide.

**Quick steps:**
```cmd
# 1. Clone the repository
git clone <your-repo-url> ticket-bot
cd ticket-bot

# 2. Run setup
setup.bat

# 3. Configure environment
copy .env.example .env
# Edit .env with your credentials

# 4. Start the bot
start.bat
```

### Railway/Cloud Deployment

See **[replit.md](replit.md)** for Railway and cloud deployment instructions.

## Requirements

- **Node.js** v20 or higher
- **PostgreSQL** 15 or higher
- **Discord Bot** with proper permissions

## Environment Variables

Create a `.env` file with these variables:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_server_id
DATABASE_URL=postgresql://postgres:password@localhost:5432/ticketbot
DOMAIN=your-domain.com:5000
```

## Commands

All commands require "Manage Messages" permission to view.

### Setup (Chief of Staff only)
- `/setup` - Configure the bot with two-part wizard
- `/panel` - Deploy ticket creation panel
- `/config` - Quick adjustments to specific settings

### Ticket Management
- `/ticket admin` - List all open tickets
- `/ticket close` - Close a ticket with reason
- `/ticket delete` - Delete a ticket immediately
- `/ticket transfer` - Transfer ticket to another department
- `/ticket escalate` - Escalate to Chief of Staff
- `/ticket blacklist` - Block a user from tickets
- `/ticket unblacklist` - Remove user from blacklist
- `/ticket viewblacklist` - View all blacklisted users
- `/ticket history` - View user's ticket history

## Ticket Types

1. **General Inquiry** - Questions & Support
2. **Press Clearance** - Media Authorization
3. **Agency Directorate Hotline** - Agency Matters
4. **Internal Affairs Hotline** - Internal Reports

## File Structure

```
ticket-bot/
├── commands/          # Slash commands
├── events/           # Discord event handlers
├── transcripts/      # HTML transcript storage
├── database.js       # PostgreSQL connection
├── index.js          # Main entry point
├── setup.bat         # Windows installer
├── start.bat         # Windows launcher
├── .env.example      # Environment template
└── WINDOWS_SETUP.md  # Windows guide
```

## Support

For Windows deployment help, see [WINDOWS_SETUP.md](WINDOWS_SETUP.md)
For cloud deployment, see [replit.md](replit.md)

## Security

- Never commit `.env` file
- Keep Discord token secure
- Use strong PostgreSQL passwords
- Enable Windows Firewall rules
- Run as Windows Service for production

## Troubleshooting

**Bot won't start:**
- Check `.env` exists and has correct values
- Verify PostgreSQL is running
- Check Node.js version (`node --version`)

**Transcripts not loading:**
- Verify `DOMAIN` variable in `.env`
- Check port 5000 is not blocked
- Ensure port forwarding if accessing externally

**Commands not appearing:**
- Wait 1 hour for global commands
- Use `GUILD_ID` for instant testing
- Re-invite bot with correct permissions

## License

This project is licensed for use by White House Systems Discord server.
