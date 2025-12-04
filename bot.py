import asyncio
import os
from typing import Optional
from urllib.parse import quote_plus

import aiosqlite
import aiohttp
from aiohttp import web
import discord
from discord import app_commands
from discord.ext import commands

# -----------------------------
# CONFIG - LOAD FROM ENV
# -----------------------------
BOT_TOKEN = os.getenv("TOKEN")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI") or "http://localhost:8080/oauth/callback"
GUILD_ID = int(os.getenv("GUILD_ID"))
VERIFY_ROLE_ID = int(os.getenv("VERIFY_ROLE_ID"))
UNVERIFIED_ROLE_ID = int(os.getenv("UNVERIFIED_ROLE_ID"))
RULES_WEBHOOK_URL = os.getenv("RULES_WEBHOOK_URL")
OAUTH_SCOPES = ["identify", "guilds.join"]

# OAuth endpoints
TOKEN_URL = "https://discord.com/api/oauth2/token"
USER_URL = "https://discord.com/api/users/@me"
JOIN_MEMBER_URL_TEMPLATE = "https://discord.com/api/guilds/{guild_id}/members/{user_id}"

# Database
DB_PATH = "linked_users.db"

# -----------------------------
# BOT SETUP
# -----------------------------
intents = discord.Intents.default()
intents.members = True
bot = commands.Bot(command_prefix="!", intents=intents)
tree = bot.tree

# ---------- OAuth URL generator ----------
def make_oauth_url(redirect_uri: str = REDIRECT_URI, client_id: str = CLIENT_ID, scopes: Optional[list] = None, state: str = None) -> str:
    scopes = scopes or OAUTH_SCOPES
    scope_str = "%20".join(scopes)
    url = f"https://discord.com/api/oauth2/authorize?response_type=code&client_id={client_id}&scope={scope_str}&redirect_uri={quote_plus(redirect_uri)}"
    if state:
        url += f"&state={quote_plus(state)}"
    return url

# ---------- Webserver ----------
async def handle_root(request):
    html = f"""<html><body style="font-family: Arial; padding:24px;">
<h2>Dev Discord OAuth</h2>
<p><a href="{make_oauth_url()}">Link Discord (OAuth)</a></p>
</body></html>"""
    return web.Response(text=html, content_type="text/html")

async def handle_oauth_callback(request):
    params = request.rel_url.query
    code = params.get("code")
    if not code:
        return web.Response(text="Missing code", status=400)

    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    async with aiohttp.ClientSession() as sess:
        async with sess.post(TOKEN_URL, data=data, headers=headers) as resp:
            if resp.status != 200:
                return web.Response(text=f"Failed to get token: {await resp.text()}", status=500)
            token_json = await resp.json()
        access_token = token_json.get("access_token")
        token_type = token_json.get("token_type", "Bearer")
        if not access_token:
            return web.Response(text="No access token", status=500)

        auth_headers = {"Authorization": f"{token_type} {access_token}"}
        async with sess.get(USER_URL, headers=auth_headers) as user_resp:
            user_json = await user_resp.json()
        user_id = int(user_json.get("id"))

        # Add user to guild
        join_url = JOIN_MEMBER_URL_TEMPLATE.format(guild_id=GUILD_ID, user_id=user_id)
        join_body = {"access_token": access_token}
        join_headers = {"Authorization": f"Bot {BOT_TOKEN}", "Content-Type": "application/json"}
        async with sess.put(join_url, json=join_body, headers=join_headers) as join_resp:
            if join_resp.status in (201, 204):
                async with aiosqlite.connect(DB_PATH) as db:
                    await db.execute("CREATE TABLE IF NOT EXISTS oauth_links (discord_id INTEGER PRIMARY KEY, username TEXT)")
                    await db.execute("INSERT OR REPLACE INTO oauth_links (discord_id, username) VALUES (?, ?)",
                                     (user_id, f"{user_json.get('username')}#{user_json.get('discriminator')}"))
                    await db.commit()
                return web.Response(text=f"Success! {user_json.get('username')} added.", content_type="text/html")
            else:
                return web.Response(text=f"Failed to join guild: {join_resp.status}", status=500)

def make_web_app():
    app = web.Application()
    app.add_routes([web.get("/", handle_root), web.get("/oauth/callback", handle_oauth_callback)])
    return app

# ---------- Verify Button ----------
class VerifyView(discord.ui.View):
    @discord.ui.button(label="Verify", style=discord.ButtonStyle.primary)
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        guild = interaction.guild
        member = interaction.user
        give_role = guild.get_role(VERIFY_ROLE_ID)
        remove_role = guild.get_role(UNVERIFIED_ROLE_ID)
        try:
            if give_role: await member.add_roles(give_role)
            if remove_role and remove_role in member.roles: await member.remove_roles(remove_role)
        except Exception:
            await interaction.response.send_message("Role assignment failed", ephemeral=True)
            return
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("CREATE TABLE IF NOT EXISTS verified (discord_id INTEGER PRIMARY KEY, verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
            await db.execute("INSERT OR REPLACE INTO verified (discord_id) VALUES (?)", (member.id,))
            await db.commit()
        await interaction.response.send_message("✅ Verified!", ephemeral=True)

# ---------- Slash Commands ----------
@tree.command(name="post_rules", description="Post rules with verify button")
@app_commands.guilds(discord.Object(id=GUILD_ID))
async def post_rules(interaction: discord.Interaction):
    if not interaction.user.guild_permissions.manage_guild:
        await interaction.response.send_message("You need Manage Server perms.", ephemeral=True)
        return
    embed = discord.Embed(title="📜 SERVER RULES", description="Click Verify to get access.", color=0xFF69B4)
    view = VerifyView()
    await interaction.response.send_message(embed=embed, view=view)

@tree.command(name="link_oauth", description="Get OAuth link")
@app_commands.guilds(discord.Object(id=GUILD_ID))
async def link_oauth(interaction: discord.Interaction):
    await interaction.response.send_message(make_oauth_url(), ephemeral=True)

# ---------- Startup ----------
async def start_web_app():
    app = make_web_app()
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.getenv("PORT") or 8080)
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    print(f"Webserver listening on 0.0.0.0:{port}")

@bot.event
async def on_ready():
    print(f"Bot logged in as {bot.user} ({bot.user.id})")
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("CREATE TABLE IF NOT EXISTS verified (discord_id INTEGER PRIMARY KEY)")
        await db.execute("CREATE TABLE IF NOT EXISTS oauth_links (discord_id INTEGER PRIMARY KEY, username TEXT)")
        await db.commit()
    try: await tree.sync(guild=discord.Object(id=GUILD_ID)); print("Commands synced")
    except Exception as e: print(e)

async def main():
    await start_web_app()
    await bot.start(BOT_TOKEN)

if __name__ == "__main__":
    asyncio.run(main())
