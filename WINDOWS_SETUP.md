# Discord Ticket Bot - Windows Server Setup Guide

Complete guide for deploying the Discord Ticket Bot on a Windows server.

## Prerequisites

### 1. Install Node.js
- Download from: https://nodejs.org/
- Recommended: LTS version (v20.x or higher)
- During installation, check "Add to PATH"
- Verify installation: Open Command Prompt and run `node --version`

### 2. Install PostgreSQL
- Download from: https://www.postgresql.org/download/windows/
- During installation:
  - Remember your postgres user password
  - Default port: 5432
  - Install pgAdmin (recommended for database management)
- Add PostgreSQL bin folder to PATH (usually `C:\Program Files\PostgreSQL\16\bin`)

### 3. Install Git (Optional but recommended)
- Download from: https://git-scm.com/download/windows
- Use default settings during installation

## Installation Steps

### Step 1: Clone or Download the Project

**Option A: Using Git**
```cmd
cd C:\
git clone <your-repository-url> ticket-bot
cd ticket-bot
```

**Option B: Download ZIP**
1. Download the project as ZIP
2. Extract to `C:\ticket-bot`
3. Open Command Prompt in that folder

### Step 2: Create PostgreSQL Database

Open Command Prompt or PowerShell:

```cmd
# Connect to PostgreSQL (enter your postgres password when prompted)
psql -U postgres

# Create database
CREATE DATABASE ticketbot;

# Exit psql
\q
```

Or use pgAdmin:
1. Open pgAdmin
2. Right-click "Databases" → Create → Database
3. Name: `ticketbot`
4. Save

### Step 3: Configure Environment Variables

1. Run the setup script:
   ```cmd
   setup.bat
   ```

2. Create `.env` file from template:
   ```cmd
   copy .env.example .env
   ```

3. Edit `.env` file with your values:
   ```env
   DISCORD_TOKEN=your_bot_token_from_discord_developer_portal
   CLIENT_ID=your_application_client_id
   GUILD_ID=your_discord_server_id
   DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/ticketbot
   DOMAIN=localhost:5000
   ```

### Step 4: Get Discord Credentials

1. Go to https://discord.com/developers/applications
2. Create a new application or select existing
3. Get `CLIENT_ID` from "General Information" → Application ID
4. Go to "Bot" section:
   - Get `DISCORD_TOKEN` (click Reset Token if needed)
   - Enable these Privileged Gateway Intents:
     - SERVER MEMBERS INTENT
     - MESSAGE CONTENT INTENT
5. Go to "OAuth2" → URL Generator:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Administrator` (or specific permissions needed)
   - Copy the generated URL and invite bot to your server
6. Get `GUILD_ID`:
   - Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
   - Right-click your server → Copy Server ID

### Step 5: Start the Bot

Simply run:
```cmd
start.bat
```

The bot will:
- Connect to Discord
- Initialize PostgreSQL database tables
- Start the transcript web server on port 5000
- Register slash commands

## Port Forwarding (For Public Access)

If you want transcript links to work from outside your network:

### Option 1: Port Forwarding on Router
1. Find your server's local IP: `ipconfig` (look for IPv4 Address)
2. Log into your router admin panel
3. Forward external port 5000 → internal IP:5000
4. Update `.env`: `DOMAIN=your_public_ip:5000`

### Option 2: Use a Reverse Proxy (Recommended)
1. Install nginx for Windows or use IIS
2. Configure reverse proxy to forward to localhost:5000
3. Set up SSL certificate (Let's Encrypt)
4. Update `.env`: `DOMAIN=yourdomain.com`

### Option 3: Use Cloudflare Tunnel (Easiest)
1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Run: `cloudflared tunnel --url http://localhost:5000`
3. Copy the generated URL
4. Update `.env`: `DOMAIN=your-tunnel-url.trycloudflare.com`

## Running as Windows Service (Production)

To keep the bot running even when you log out:

### Using NSSM (Non-Sucking Service Manager)

1. Download NSSM: https://nssm.cc/download
2. Extract to `C:\nssm`
3. Open Command Prompt as Administrator:

```cmd
cd C:\nssm\win64
nssm install DiscordTicketBot "C:\Program Files\nodejs\node.exe" "C:\ticket-bot\index.js"
nssm set DiscordTicketBot AppDirectory "C:\ticket-bot"
nssm set DiscordTicketBot DisplayName "Discord Ticket Bot"
nssm set DiscordTicketBot Description "White House Systems Ticket Bot"
nssm set DiscordTicketBot Start SERVICE_AUTO_START
nssm start DiscordTicketBot
```

**Service Management:**
- Start: `nssm start DiscordTicketBot`
- Stop: `nssm stop DiscordTicketBot`
- Restart: `nssm restart DiscordTicketBot`
- Remove: `nssm remove DiscordTicketBot confirm`

## Firewall Configuration

Allow Node.js through Windows Firewall:

```cmd
netsh advfirewall firewall add rule name="Discord Bot Port 5000" dir=in action=allow protocol=TCP localport=5000
```

Or use Windows Defender Firewall GUI:
1. Open "Windows Defender Firewall with Advanced Security"
2. Inbound Rules → New Rule
3. Port → TCP → 5000
4. Allow the connection
5. Name: "Discord Ticket Bot"

## Troubleshooting

### Bot Won't Start
- Check `.env` file exists and has correct values
- Verify PostgreSQL is running: `pg_isadmin -U postgres`
- Check Node.js version: `node --version` (should be v20+)
- View logs in Command Prompt for error details

### Database Connection Errors
- Verify PostgreSQL service is running (Services → postgresql-x64-16)
- Test connection: `psql -U postgres -d ticketbot`
- Check DATABASE_URL format in `.env`
- Ensure password doesn't contain special characters or wrap in quotes

### Transcripts Don't Load
- Check DOMAIN variable in `.env`
- Verify port 5000 is not blocked by firewall
- Test locally: Open browser → http://localhost:5000/transcripts/test
- For external access, ensure port forwarding is configured

### Commands Not Appearing
- Wait 1 hour for global commands (or use GUILD_ID for instant)
- Verify bot has `applications.commands` scope
- Re-invite bot with correct permissions

## Maintenance

### Update the Bot
```cmd
cd C:\ticket-bot
git pull
npm install
# Restart the service or press Ctrl+C and run start.bat
```

### Backup Database
```cmd
pg_dump -U postgres ticketbot > backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
```

### Restore Database
```cmd
psql -U postgres ticketbot < backup_20250106.sql
```

### View Logs (if running as service)
- Event Viewer → Windows Logs → Application
- Or check NSSM logs: `C:\ticket-bot\logs\`

## Performance Tips

1. **Use SSD for Database** - Store PostgreSQL data on SSD
2. **Increase PostgreSQL Memory** - Edit `postgresql.conf`:
   ```
   shared_buffers = 256MB
   effective_cache_size = 1GB
   ```
3. **Monitor Resources** - Task Manager → Performance
4. **Regular Backups** - Schedule daily database backups
5. **Keep Updated** - Update Node.js and PostgreSQL regularly

## Security Recommendations

1. **Change Default PostgreSQL Password**
2. **Use Strong .env Passwords**
3. **Don't Expose .env File** - Add to .gitignore
4. **Use SSL for PostgreSQL** - Set `NODE_ENV=production`
5. **Keep Windows Updated**
6. **Use Firewall Rules** - Only allow necessary ports
7. **Regular Security Audits** - `npm audit`

## Support

For issues specific to this bot, check:
- Bot logs in Command Prompt
- PostgreSQL logs: `C:\Program Files\PostgreSQL\16\data\log\`
- Windows Event Viewer

Common issues and solutions are in the main README.md
