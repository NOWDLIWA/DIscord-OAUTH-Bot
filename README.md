# Discord OAuth Join Bot with Verification System

A Discord bot with OAuth2 join flow + a beautiful verification system in a single `main.py`.

## Features

### Web/OAuth
- Flask web app with `/login`, `/verify`, and `/callback` routes.
- `/verify` — beautiful rules agreement page with checkbox + Verify button.
- OAuth2 scopes: `identify guilds.join`.
- User tokens stored in SQLite.

### Discord Bot
- **Setup commands** (admin-only):
  - `.setup` — Creates an Unverified role, verify channel with restricted perms, and sends webhook message with OAuth link.
  - `.rules_role_id <role_id>` — Sets the role to assign after a user verifies.
  
- **User commands**:
  - `.link` — DMs the user an OAuth join link.
  
- **Admin commands**:
  - `.join` — Attempts to add all stored authorized users to the guild.
  - `.grantall @user` or `.grantall <id>` — Assigns all roles the bot can manage to a user (useful for restoring permissions).

### Verification Flow
1. Unverified users join the guild and get the Unverified role (limited to verify channel + rules channel).
2. They click the Verify button → beautiful rules page.
3. They agree to rules → OAuth redirect → callback adds them to guild, removes Unverified role, and assigns Rules role.

## Quick Start

1. **Copy `.env.example` to `.env`** and fill in:
   - `BOT_TOKEN` — Your bot's token (Discord Developer Portal → Bot)
   - `CLIENT_ID`, `CLIENT_SECRET` — OAuth app credentials
   - `GUILD_ID` — Target server ID
   - `ROLE_ID` — Deprecated (kept for compatibility)
   - `RULES_ROLE_ID` — Role to assign after verification (e.g., `1446115772307996723`)
   - `AUTOGRANT_ID` — (optional) User ID to auto-restore roles on bot startup

2. **Install dependencies**:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```

3. **Run**:
```powershell
python main.py
```

4. **In Discord** (run these commands in a text channel where the bot is):
   - `.setup` — Creates verify channel, unverified role, and sends webhook.
   - `.rules_role_id 1446115772307996723` — Set the rules role ID.

## Web Routes

- `http://localhost:5000/` — Simple OAuth join link.
- `http://localhost:5000/login` — Redirect to OAuth authorize.
- `http://localhost:5000/verify` — Beautiful rules page with agreement + verify button.
- `http://localhost:5000/callback` — OAuth callback (handles token exchange, user join, role assignment).

## How It Works

### OAuth Flow
1. User clicks "Verify & Join" on `/verify` page.
2. Browser redirects to Discord OAuth → user grants `identify` and `guilds.join`.
3. Discord redirects back to `/callback` with authorization code.
4. Bot exchanges code for access token, gets user info, and:
   - Adds user to guild (using bot token + user access_token).
   - Assigns Unverified role (if configured).
   - Assigns Rules role (if `RULES_ROLE_ID` is set).

### Setup Command
`.setup` automatically:
- Creates an "Unverified" role (grey).
- Creates a "verify" text channel (visible only to Unverified users).
- Restricts permissions so Unverified users can only see verify + rules channels.
- Sends a webhook message with OAuth link.

### Grantall Command
`.grantall @username` or `.grantall <user_id>` assigns all roles the bot can manage to the user.
- Skips managed roles, roles the user already has, and roles above the bot's top role.
- Useful for restoring permissions if a user leaves/rejoin.

## GitHub

To push to GitHub:

```powershell
cd 'c:\Users\Colsen Hostler\Desktop\Code 2\Discord bots\Oauth Join'
git init
git add .
git commit -m "Initial commit: OAuth Join bot with verification system"
git remote add origin https://github.com/yourusername/yourrepo.git
git branch -M main
git push -u origin main
```

## Configuration Notes

- **Redirect URI** — Must match exactly in Discord Developer Portal (OAuth2 → Redirects).
- **Bot Permissions** — Bot needs: Manage Roles, Add Members (implicit via guilds.join).
- **Role Hierarchy** — The bot can only assign roles lower than its own top role.
- **Production** — Replace Flask dev server with gunicorn/uWSGI and use HTTPS for redirect URI.

## Commands Cheat Sheet

| Command | Usage | Notes |
|---------|-------|-------|
| `.setup` | Admin-only | Create verify channel, Unverified role, send webhook |
| `.rules_role_id <id>` | Admin-only | Set role to assign after verification |
| `.link` | Any user | DM OAuth link |
| `.join` | Admin-only | Add all stored authorized users to guild |
| `.grantall @user` | Admin-only | Assign all roles to user |

## Troubleshooting

- **404 Unknown Guild** — Make sure bot is in the guild and `GUILD_ID` is correct.
- **Invalid Scope** — Check that OAuth2 redirects URI matches exactly (including http/https and port).
- **Verification fails** — Ensure bot has Manage Roles permission and that `RULES_ROLE_ID` exists.
- **Users can't see verify channel** — Run `.setup` to create Unverified role and sync permissions.

