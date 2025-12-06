import os
import threading
import asyncio
import sqlite3
import time
import json
from datetime import datetime
from urllib.parse import urlencode, quote

import requests
from dotenv import load_dotenv
from flask import Flask, redirect, request, render_template_string
import discord
from discord.ext import commands
from discord import app_commands

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN') or 'PLACEHOLDER_BOT_TOKEN'
CLIENT_ID = os.getenv('CLIENT_ID') or 'PLACEHOLDER_CLIENT_ID'
CLIENT_SECRET = os.getenv('CLIENT_SECRET') or 'PLACEHOLDER_CLIENT_SECRET'
REDIRECT_URI = os.getenv('REDIRECT_URI') or 'http://localhost:5000/callback'
GUILD_ID = os.getenv('GUILD_ID') or 'PLACEHOLDER_GUILD_ID'
ROLE_ID = os.getenv('ROLE_ID') or 'PLACEHOLDER_ROLE_ID'
AUTOGRANT_ID = os.getenv('AUTOGRANT_ID') or ''
RULES_ROLE_ID = os.getenv('RULES_ROLE_ID') or ''
RULES_CHANNEL_ID = os.getenv('RULES_CHANNEL_ID') or '1446650751865585694'
VERIFY_CHANNEL_ID = os.getenv('VERIFY_CHANNEL_ID') or '1446115772307996723'
MEMBER_ROLE_ID = os.getenv('MEMBER_ROLE_ID') or '1446133334068432936'

DB_PATH = os.path.join(os.path.dirname(__file__), 'tokens.db')

OAUTH_AUTHORIZE = 'https://discord.com/api/oauth2/authorize'
OAUTH_TOKEN_URL = 'https://discord.com/api/oauth2/token'
API_BASE = 'https://discord.com/api'

app = Flask(__name__)


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        access_token TEXT,
        token_type TEXT,
        scope TEXT,
        expires_at INTEGER
    )
    ''')
    cur.execute('''
    CREATE TABLE IF NOT EXISTS guild_config (
        guild_id TEXT PRIMARY KEY,
        verify_channel_id TEXT,
        unverified_role_id TEXT,
        rules_role_id TEXT
    )
    ''')
    conn.commit()
    conn.close()


def save_token(user_id, access_token, token_type, scope, expires_in):
    expires_at = int(time.time()) + int(expires_in)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('REPLACE INTO users (user_id, access_token, token_type, scope, expires_at) VALUES (?,?,?,?,?)',
                (str(user_id), access_token, token_type, scope, expires_at))
    conn.commit()
    conn.close()


def get_all_users():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT user_id, access_token FROM users')
    rows = cur.fetchall()
    conn.close()
    return rows


def save_guild_config(guild_id, verify_channel_id=None, unverified_role_id=None, rules_role_id=None):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('REPLACE INTO guild_config (guild_id, verify_channel_id, unverified_role_id, rules_role_id) VALUES (?,?,?,?)',
                (str(guild_id), verify_channel_id, unverified_role_id, rules_role_id))
    conn.commit()
    conn.close()


def get_guild_config(guild_id):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT verify_channel_id, unverified_role_id, rules_role_id FROM guild_config WHERE guild_id = ?', (str(guild_id),))
    row = cur.fetchone()
    conn.close()
    return row or (None, None, None)


def make_oauth_url(state=None):
    params = {
        'client_id': CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'response_type': 'code',
        'scope': 'identify guilds.join'
    }
    if state:
        params['state'] = state
    return f"{OAUTH_AUTHORIZE}?{urlencode(params)}"


@app.route('/')
def index():
    link = make_oauth_url()
    return render_template_string('<p>Discord OAuth Join Example</p><p><a href="{{link}}">Click to Authorize / Join</a></p>', link=link)


@app.route('/login')
def login():
    return redirect(make_oauth_url())


RULES_HTML = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Rules & Verification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 14px;
            opacity: 0.95;
        }
        .content {
            padding: 40px 30px;
            max-height: 400px;
            overflow-y: auto;
        }
        .rules-section {
            margin-bottom: 25px;
        }
        .rules-section h2 {
            font-size: 18px;
            color: #333;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .rules-section ul {
            list-style: none;
            padding-left: 20px;
        }
        .rules-section li {
            margin-bottom: 8px;
            color: #555;
            font-size: 14px;
            line-height: 1.5;
            position: relative;
            padding-left: 20px;
        }
        .rules-section li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
        }
        .footer {
            padding: 30px;
            text-align: center;
            border-top: 1px solid #eee;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: center;
        }
        .checkbox-group input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        .checkbox-group label {
            cursor: pointer;
            color: #555;
            font-size: 14px;
            user-select: none;
        }
        .verify-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 40px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            width: 100%;
        }
        .verify-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        .verify-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .success-message {
            color: #27ae60;
            font-weight: 600;
            text-align: center;
            padding: 20px;
            background: #d5f4e6;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        .error-message {
            color: #e74c3c;
            font-weight: 600;
            text-align: center;
            padding: 20px;
            background: #fadbd8;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Server Verification</h1>
            <p>Please read and agree to our server rules below</p>
        </div>
        <div class="content">
            <div class="rules-section">
                <h2>📋 Server Rules</h2>
                <ul>
                    <li>Be respectful to all members</li>
                    <li>No spam or excessive messaging</li>
                    <li>No hate speech or discriminatory language</li>
                    <li>Keep conversations appropriate and on-topic</li>
                    <li>No sharing of personal information</li>
                    <li>Follow Discord's Terms of Service</li>
                    <li>Listen to and respect moderator decisions</li>
                </ul>
            </div>
            <div class="rules-section">
                <h2>🎯 Our Community Values</h2>
                <ul>
                    <li>Inclusivity and diversity are welcomed</li>
                    <li>Help and support each other</li>
                    <li>Constructive feedback only</li>
                    <li>Have fun and enjoy the community!</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <div id="successMsg" class="success-message">✓ Verification successful! Enjoy the server.</div>
            <div id="errorMsg" class="error-message"></div>
            <div class="checkbox-group">
                <input type="checkbox" id="agreeCheckbox">
                <label for="agreeCheckbox">I have read and agree to the server rules</label>
            </div>
            <button id="verifyBtn" class="verify-btn" disabled>Verify & Join Server</button>
        </div>
    </div>
    <script>
        const checkbox = document.getElementById('agreeCheckbox');
        const btn = document.getElementById('verifyBtn');
        checkbox.addEventListener('change', function() {
            btn.disabled = !this.checked;
        });
        btn.addEventListener('click', function() {
            window.location.href = '{{ oauth_url }}';
        });
    </script>
</body>
</html>
'''


@app.route('/verify')
def verify():
    oauth_url = make_oauth_url()
    return render_template_string(RULES_HTML, oauth_url=oauth_url)


@app.route('/callback')
def callback():
    error = request.args.get('error')
    if error:
        return f"Error: {error}", 400

    code = request.args.get('code')
    if not code:
        return 'No code provided', 400

    # Exchange code for token
    data = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    r = requests.post(OAUTH_TOKEN_URL, data=data, headers=headers)
    if r.status_code != 200:
        return f"Token exchange failed: {r.text}", 400
    token_data = r.json()
    access_token = token_data.get('access_token')
    token_type = token_data.get('token_type')
    scope = token_data.get('scope')
    expires_in = token_data.get('expires_in', 0)

    # Get user identity
    me = requests.get(f'{API_BASE}/users/@me', headers={'Authorization': f'Bearer {access_token}'})
    if me.status_code != 200:
        return f"Failed to get user info: {me.text}", 400
    me_json = me.json()
    user_id = me_json['id']

    # Save token
    save_token(user_id, access_token, token_type, scope, expires_in)

    messages = []

    # Try to add user to guild using guilds.join scope
    add_url = f'{API_BASE}/guilds/{GUILD_ID}/members/{user_id}'
    add_payload = {'access_token': access_token}
    add_headers = {'Authorization': f'Bot {BOT_TOKEN}', 'Content-Type': 'application/json'}
    add_resp = requests.put(add_url, json=add_payload, headers=add_headers)
    if add_resp.status_code in (201, 204):
        messages.append('✓ You have joined the server!')

        # Assign member role (1446133334068432936)
        if MEMBER_ROLE_ID:
            role_url = f'{API_BASE}/guilds/{GUILD_ID}/members/{user_id}/roles/{MEMBER_ROLE_ID}'
            role_resp = requests.put(role_url, headers={'Authorization': f'Bot {BOT_TOKEN}'})
            if role_resp.status_code in (204,):
                messages.append('✓ Member role assigned.')
    else:
        messages.append(f'Error joining server: {add_resp.status_code} {add_resp.text}')

    success_html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Verification Successful</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
            }}
            .box {{
                background: white;
                padding: 40px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }}
            .box h1 {{
                color: #27ae60;
                margin: 0 0 20px 0;
            }}
            .box p {{
                color: #555;
                line-height: 1.6;
                margin: 10px 0;
            }}
            .checkmark {{
                font-size: 48px;
                color: #27ae60;
                margin-bottom: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="box">
            <div class="checkmark">✓</div>
            <h1>Verification Successful!</h1>
            {'<p>' + '</p><p>'.join(messages) + '</p>'}
            <p>You can now close this window and enjoy the server!</p>
        </div>
    </body>
    </html>
    '''
    return success_html


def run_flask():
    init_db()
    app.run(host='0.0.0.0', port=5000)


intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True
bot = commands.Bot(command_prefix='.', intents=intents)


@bot.event
async def on_ready():
    print(f'Bot ready. Logged in as {bot.user} (ID: {bot.user.id})')

    # Auto-setup verification system on first ready (if not already done)
    try:
        if not GUILD_ID or GUILD_ID.startswith('PLACEHOLDER'):
            print('Auto-setup skipped: GUILD_ID not configured.')
        else:
            guild = bot.get_guild(int(GUILD_ID))
            if guild:
                verify_ch, unverif_role, rules_role = get_guild_config(GUILD_ID)
                if not verify_ch:
                    print('Auto-setup: Creating verification system...')
                    try:
                        # Create unverified role
                        unverified_role = await guild.create_role(
                            name='Unverified',
                            color=discord.Color.greyple(),
                            reason='Auto-created for verification system'
                        )
                        
                        # Create verify channel
                        overwrites = {
                            guild.default_role: discord.PermissionOverwrite(read_messages=False),
                            unverified_role: discord.PermissionOverwrite(
                                read_messages=True,
                                send_messages=False,
                                add_reactions=False
                            )
                        }
                        verify_channel = await guild.create_text_channel(
                            'verify',
                            overwrites=overwrites,
                            reason='Auto-created for verification system'
                        )
                        
                        # Save config
                        save_guild_config(guild.id, verify_channel.id, unverified_role.id, rules_role)
                        
                        # Send simple verify button to verify channel
                        verify_url = 'http://localhost:5000/verify'
                        await verify_channel.send(
                            f'**[🔐 Click here to verify]({verify_url})**'
                        )
                        
                        print(f'✓ Auto-setup complete: Unverified role ({unverified_role.id}), verify channel ({verify_channel.id})')
                    except Exception as e:
                        print(f'Auto-setup failed: {e}')
    except Exception as e:
        print(f'Auto-setup error: {e}')

    # If AUTOGRANT_ID is set, attempt to automatically grant roles to that user in the configured guild
    if AUTOGRANT_ID:
        async def _auto_grant():
            try:
                if not GUILD_ID or GUILD_ID.startswith('PLACEHOLDER'):
                    print('Auto-grant skipped: GUILD_ID is not configured.')
                    return
                try:
                    guild = bot.get_guild(int(GUILD_ID))
                except Exception:
                    guild = None
                if guild is None:
                    print(f'Auto-grant: bot is not in guild {GUILD_ID} or cannot access it.')
                    return

                try:
                    member = guild.get_member(int(AUTOGRANT_ID)) or await guild.fetch_member(int(AUTOGRANT_ID))
                except Exception as e:
                    print(f'Auto-grant: failed to fetch member {AUTOGRANT_ID}: {e}')
                    return

                print(f'Auto-grant: attempting to restore roles for {member} (ID: {member.id})')
                summary = await assign_all_roles(member, f'auto-grant on startup')
                print('Auto-grant summary:', summary)
            except Exception as e:
                print('Auto-grant encountered an error:', e)

        bot.loop.create_task(_auto_grant())


# Slash Commands
@bot.tree.command(name="verify", description="Get the verification link")
async def verify_cmd(interaction: discord.Interaction):
    """Send the verification link to the user."""
    link = make_oauth_url()
    await interaction.response.send_message(f'Click here to verify and join: {link}', ephemeral=True)


@bot.tree.command(name="backup", description="Backup server data (roles, channels, permissions)")
@app_commands.default_permissions(administrator=True)
async def backup_server(interaction: discord.Interaction):
    """Backup all server roles, channels, and permissions to a JSON file."""
    await interaction.response.defer(thinking=True)
    
    try:
        guild = interaction.guild
        if not guild:
            await interaction.followup.send("This command can only be used in a server.", ephemeral=True)
            return
        
        backup_data = {
            "guild_name": guild.name,
            "guild_id": guild.id,
            "backup_date": datetime.now().isoformat(),
            "roles": [],
            "channels": []
        }
        
        # Backup roles
        for role in guild.roles:
            if role == guild.default_role:
                continue
            role_data = {
                "id": role.id,
                "name": role.name,
                "permissions": role.permissions.value,
                "color": role.color.value,
                "position": role.position,
                "hoist": role.hoist,
                "mentionable": role.mentionable
            }
            backup_data["roles"].append(role_data)
        
        # Backup channels and their permissions
        for channel in guild.channels:
            channel_data = {
                "id": channel.id,
                "name": channel.name,
                "type": str(channel.type),
                "position": channel.position,
                "permissions": {}
            }
            
            # Store permission overwrites
            for target, overwrite in channel.overwrites.items():
                target_type = "role" if isinstance(target, discord.Role) else "user"
                channel_data["permissions"][f"{target_type}_{target.id}"] = {
                    "allow": overwrite.pair()[0].value,
                    "deny": overwrite.pair()[1].value
                }
            
            backup_data["channels"].append(channel_data)
        
        # Save to file
        backup_filename = f"backup_{guild.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(backup_filename, 'w') as f:
            json.dump(backup_data, f, indent=2)
        
        await interaction.followup.send(
            f"✓ Backup created: {backup_filename}\n"
            f"- Roles backed up: {len(backup_data['roles'])}\n"
            f"- Channels backed up: {len(backup_data['channels'])}",
            ephemeral=True
        )
        print(f"Backup saved: {backup_filename}")
    except Exception as e:
        await interaction.followup.send(f"Backup failed: {e}", ephemeral=True)


@bot.tree.command(name="link", description="Get the OAuth join link")
async def link_cmd(interaction: discord.Interaction):
    """Send the OAuth join link via DM."""
    link = make_oauth_url()
    try:
        await interaction.user.send(f'Authorize here to join the server: {link}')
        await interaction.response.send_message('✓ I sent you the OAuth link via DM!', ephemeral=True)
    except Exception:
        await interaction.response.send_message(f'Here is your OAuth link: {link}', ephemeral=True)


@bot.tree.command(name="grantall", description="Assign all roles to a user")
@app_commands.describe(user="The user to grant roles to")
@app_commands.default_permissions(administrator=True)
async def grantall_cmd(interaction: discord.Interaction, user: discord.User):
    """Assign all roles the bot can manage to a user."""
    await interaction.response.defer(thinking=True)
    
    try:
        member = await interaction.guild.fetch_member(user.id)
    except:
        await interaction.followup.send("User not found in this server.", ephemeral=True)
        return
    
    summary = await assign_all_roles(member, f'admin grant by {interaction.user}')
    
    summary_lines = [
        f'Roles assigned to {member.display_name}:',
        f'✓ Added: {summary["added"]}',
        f'⊘ Skipped: {len(summary["skipped"])}',
        f'✗ Failures: {len(summary["failures"])}'
    ]
    if summary['failures']:
        summary_lines.append('Failures: ' + ', '.join([f'{n}' for n, _ in summary['failures']]))
    
    await interaction.followup.send('\n'.join(summary_lines), ephemeral=True)


@bot.tree.command(name="join_all", description="Add all authorized users to the server")
@app_commands.default_permissions(administrator=True)
async def join_all_cmd(interaction: discord.Interaction):
    """Attempt to add all previously-authorized users to the server."""
    await interaction.response.defer(thinking=True)
    
    rows = get_all_users()
    if not rows:
        await interaction.followup.send('No stored authorized users found.', ephemeral=True)
        return

    successes = 0
    failures = []
    for (user_id, access_token) in rows:
        add_url = f'{API_BASE}/guilds/{GUILD_ID}/members/{user_id}'
        payload = {'access_token': access_token}
        add_resp = requests.put(add_url, json=payload, headers={'Authorization': f'Bot {BOT_TOKEN}'})
        if add_resp.status_code in (201, 204):
            successes += 1
            # Try to add member role
            if MEMBER_ROLE_ID:
                role_url = f'{API_BASE}/guilds/{GUILD_ID}/members/{user_id}/roles/{MEMBER_ROLE_ID}'
                requests.put(role_url, headers={'Authorization': f'Bot {BOT_TOKEN}'})
        else:
            failures.append((user_id, add_resp.status_code))

    await interaction.followup.send(
        f'Attempted to add {len(rows)} users: ✓ {successes} succeeded, ✗ {len(failures)} failed',
        ephemeral=True
    )



async def assign_all_roles(member, actor_name='script'):
    """Helper used by auto-grant and grantall to assign all roles the bot can manage to `member`.

    Returns a dict summary.
    """
    guild = member.guild
    bot_member = guild.get_member(bot.user.id)
    if bot_member is None:
        return {'error': 'bot_not_in_guild'}

    bot_top = max((r.position for r in bot_member.roles), default=0)

    added = 0
    skipped = []
    failures = []
    for role in guild.roles:
        if role == guild.default_role:
            continue
        if role.managed:
            skipped.append((role.name, 'managed'))
            continue
        if role in member.roles:
            skipped.append((role.name, 'already_has'))
            continue
        if role.position >= bot_top:
            skipped.append((role.name, 'higher_or_equal_than_bot'))
            continue
        try:
            await member.add_roles(role, reason=f'Granted by {actor_name}')
            added += 1
        except Exception as e:
            failures.append((role.name, str(e)))

    return {
        'added': added,
        'skipped': skipped,
        'failures': failures,
    }


if __name__ == '__main__':
    # Start flask in background thread
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # quick guild visibility check to provide clearer diagnostics
    def check_guild_visibility():
        if not GUILD_ID or GUILD_ID.startswith('PLACEHOLDER'):
            print('Skipping guild check: GUILD_ID is a placeholder or missing in .env')
            return
        if not BOT_TOKEN or BOT_TOKEN.startswith('PLACEHOLDER'):
            print('Skipping guild check: BOT_TOKEN is a placeholder or missing in .env')
            return
        try:
            resp = requests.get(f'{API_BASE}/guilds/{GUILD_ID}', headers={'Authorization': f'Bot {BOT_TOKEN}'})
        except Exception as e:
            print(f'Guild check failed (network/error): {e}')
            return
        if resp.status_code == 200:
            print(f'Bot can access guild {GUILD_ID} — OK.')
        elif resp.status_code == 404:
            print('\nERROR: 404 Unknown Guild — the bot cannot see the configured guild id.')
            print('Possible causes:')
            print('- `GUILD_ID` is incorrect (copy the server ID using Developer Mode).')
            print('- The bot is not a member of that guild (invite the bot to the server).')
            print('- The `BOT_TOKEN` used belongs to a different application than the `CLIENT_ID` you used for OAuth. Use the bot token for the same application.')
            print('- The bot may have been removed from the server.')
            print('\nTo test manually, run:')
            print(f'  curl -H "Authorization: Bot <your bot token>" https://discord.com/api/guilds/{GUILD_ID}')
            print('If that returns 404, fix the bot/guild membership or GUILD_ID before retrying.')
        else:
            print(f'Guild check returned {resp.status_code}: {resp.text}')

    check_guild_visibility()

    # Start bot (blocking)
    if BOT_TOKEN == 'PLACEHOLDER_BOT_TOKEN':
        print('Warning: BOT_TOKEN is placeholder. Set your real token in .env')
    bot.run(BOT_TOKEN)
