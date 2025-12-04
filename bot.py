import asyncio
import os
import secrets
from typing import Optional
from urllib.parse import urlencode

import aiosqlite
import aiohttp
from aiohttp import web
import discord
from discord import app_commands
from discord.ext import commands

# -----------------------------
# CONFIG - REPLACE THESE VALUES or set environment variables
# -----------------------------
TOKEN = os.getenv("TOKEN") or "MTQ0NjI0MDYyMzEwMjM5ODQ4Ng.GlyObt.MvMIxsXbitfvfZZuk91WdrQldweVs-AtVVyJSQ"
CLIENT_ID = os.getenv("CLIENT_ID") or "1446240623102398486"
CLIENT_SECRET = os.getenv("CLIENT_SECRET") or "4EL4Oe9jQmp7ozabhivpkMiwjxkFg8ip"
REDIRECT_URI = os.getenv("REDIRECT_URI") or "http://localhost:8080/oauth/callback"  # Must match Discord Developer Portal redirect
GUILD_ID = int(os.getenv("GUILD_ID") or 1446112569109778454)  # The guild id where you want to add the user
VERIFY_ROLE_ID = int(os.getenv("VERIFY_ROLE_ID") or 1446133334068432936)  # Role to GIVE on verify (placeholder)
UNVERIFIED_ROLE_ID = int(os.getenv("UNVERIFIED_ROLE_ID") or 222222222222222222)  # Role to REMOVE on verify (placeholder)
RULES_WEBHOOK_URL = os.getenv("RULES_WEBHOOK_URL") or "https://discord.com/api/webhooks/1446252140317249669/xoc_R91bgV1YdrZ5IJiPSix4xnOXpYrJDsaCq-odgT8gwAbF9yEcsusDeKiPX3TuLCuj"  # Optional: set to a webhook URL if you want webhook posting
OAUTH_SCOPES = ["identify", "guilds.join"]  # scopes to request

# OAuth endpoints
TOKEN_URL = "https://discord.com/api/oauth2/token"
USER_URL = "https://discord.com/api/users/@me"
JOIN_MEMBER_URL_TEMPLATE = "https://discord.com/api/guilds/{guild_id}/members/{user_id}"

# Database location
DB_PATH = "linked_users.db"

# -----------------------------
# END CONFIG
# -----------------------------

intents = discord.Intents.default()
intents.members = True
intents.message_content = False

bot = commands.Bot(command_prefix="!", intents=intents)
tree = bot.tree

# ---------- Utility: OAuth URL generator ----------
def make_oauth_url(redirect_uri: str = REDIRECT_URI, client_id: str = CLIENT_ID, scopes: Optional[list] = None, state: str = None) -> str:
    """
    Build a properly encoded Discord OAuth2 URL.
    """
    scopes = scopes or OAUTH_SCOPES
    scope_str = "%20".join(scopes)
    enc_redirect = quote_plus(redirect_uri)
    base = f"https://discord.com/api/oauth2/authorize?response_type=code&client_id={client_id}&scope={scope_str}&redirect_uri={enc_redirect}"
    if state:
        base += f"&state={quote_plus(state)}"
    return base

# ---------- aiohttp web app for OAuth callback ----------
async def handle_root(request):
    # simple landing page showing a link to the OAuth start
    oauth_url = make_oauth_url()
    html = f"""
    <html><body style="font-family: Arial, Helvetica, sans-serif; padding: 24px;">
    <h2>Dev Discord OAuth</h2>
    <p>Click to link & join the server: <a href="{oauth_url}">Link Discord (OAuth)</a></p>
    <p>If the bot fails to add you to the server automatically, copy the invite link provided by staff.</p>
    </body></html>"""
    return web.Response(text=html, content_type="text/html")

async def handle_oauth_callback(request):
    """
    Handles the OAuth2 redirect from Discord.
    Exchanges code for access token, gets user id, then attempts to add the user to the server
    using the guilds.join pattern (PUT /guilds/{guild.id}/members/{user.id} with { access_token } body).
    """
    params = request.rel_url.query
    code = params.get("code")
    if not code:
        return web.Response(text="Missing code in callback.", status=400)

    # exchange code for token
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
                text = await resp.text()
                return web.Response(text=f"Failed to get token: {resp.status} {text}", status=500)
            token_json = await resp.json()

        access_token = token_json.get("access_token")
        token_type = token_json.get("token_type", "Bearer")
        if not access_token:
            return web.Response(text="No access token returned.", status=500)

        # get user info
        auth_headers = {"Authorization": f"{token_type} {access_token}"}
        async with sess.get(USER_URL, headers=auth_headers) as user_resp:
            if user_resp.status != 200:
                text = await user_resp.text()
                return web.Response(text=f"Failed to fetch user info: {user_resp.status} {text}", status=500)
            user_json = await user_resp.json()
        user_id = int(user_json.get("id"))

        # attempt to add user to guild using the bot token
        join_url = JOIN_MEMBER_URL_TEMPLATE.format(guild_id=GUILD_ID, user_id=user_id)
        join_body = {"access_token": access_token}
        join_headers = {"Authorization": f"Bot {TOKEN}", "Content-Type": "application/json"}

        async with sess.put(join_url, json=join_body, headers=join_headers) as join_resp:
            if join_resp.status in (201, 204):
                # success
                # Optionally store in DB who linked
                async with aiosqlite.connect(DB_PATH) as db:
                    await db.execute(
                        "CREATE TABLE IF NOT EXISTS oauth_links (discord_id INTEGER PRIMARY KEY, username TEXT)")
                    await db.execute(
                        "INSERT OR REPLACE INTO oauth_links (discord_id, username) VALUES (?, ?)",
                        (user_id, f"{user_json.get('username')}#{user_json.get('discriminator')}")
                    )
                    await db.commit()

                return web.Response(text=f"Success! {user_json.get('username')} added to the server. You may close this page.", content_type="text/html")
            else:
                text = await join_resp.text()
                return web.Response(text=f"Failed to join guild: {join_resp.status} {text}", status=500)

# create aiohttp web app
def make_web_app():
    app = web.Application()
    app.add_routes([
        web.get("/", handle_root),
        web.get("/oauth/callback", handle_oauth_callback),
    ])
    return app

# ----------
# Discord bot UI: Verify button view
# ----------
class VerifyView(discord.ui.View):
    def __init__(self, timeout: Optional[float] = None):
        super().__init__(timeout=timeout)

    @discord.ui.button(label="Verify", style=discord.ButtonStyle.primary, custom_id="verify_button")
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        guild = interaction.guild
        member = interaction.user

        if guild is None:
            await interaction.response.send_message("This command must be used in the server.", ephemeral=True)
            return

        # fetch roles (use placeholders)
        give_role = guild.get_role(VERIFY_ROLE_ID)
        remove_role = guild.get_role(UNVERIFIED_ROLE_ID)

        # Attempt role changes
        try:
            if give_role:
                await member.add_roles(give_role, reason="User clicked Verify button")
            if remove_role and remove_role in member.roles:
                await member.remove_roles(remove_role, reason="User clicked Verify button")
        except discord.Forbidden:
            await interaction.response.send_message("I don't have permission to change your roles. Contact staff.", ephemeral=True)
            return
        except Exception as e:
            await interaction.response.send_message(f"Error assigning role: {e}", ephemeral=True)
            return

        # Optionally log to DB
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("CREATE TABLE IF NOT EXISTS verified (discord_id INTEGER PRIMARY KEY, verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
            await db.execute("INSERT OR REPLACE INTO verified (discord_id) VALUES (?)", (member.id,))
            await db.commit()

        await interaction.response.send_message("✅ Verified! Roles updated.", ephemeral=True)
        # you might also DM the user, or log in a staff channel

# Slash command to post rules embed with Verify button
@tree.command(name="post_rules", description="Post the rules embed with verify button (staff only)")
@app_commands.guilds(discord.Object(id=GUILD_ID))
async def post_rules(interaction: discord.Interaction):
    if not interaction.user.guild_permissions.manage_guild:
        await interaction.response.send_message("You need Manage Server perms to run this.", ephemeral=True)
        return

    embed = discord.Embed(
        title="📜 SERVER RULES — READ BEFORE TALKING",
        description="Welcome to Dev's official server. Click Verify to get access.",
        color=0xFF69B4
    )
    embed.add_field(name="1. Be Respectful", value="No hate, doxxing, threats, or harassment.", inline=False)
    embed.add_field(name="2. No Spam / Self-Promo", value="No ads or invites without permission.", inline=False)
    embed.add_field(name="3. Keep It Clean", value="No NSFW or graphic content.", inline=False)
    embed.add_field(name="4. Use Correct Channels", value="Tickets in #create-ticket, reports in #reports.", inline=False)
    embed.set_footer(text="Dev • Fashion & Fortnite Community")

    view = VerifyView()
    await interaction.response.send_message(embed=embed, view=view)
    # Optionally post via webhook as well (if RULES_WEBHOOK_URL is set)
    if RULES_WEBHOOK_URL and RULES_WEBHOOK_URL != "PLACEHOLDER_WEBHOOK_URL":
        # fire-and-forget: don't block the response
        asyncio.create_task(post_rules_via_webhook(embed))

async def post_rules_via_webhook(embed: discord.Embed):
    if not RULES_WEBHOOK_URL or RULES_WEBHOOK_URL == "PLACEHOLDER_WEBHOOK_URL":
        return
    payload = {
        "username": "Dev Rules",
        "avatar_url": "",
        "embeds": [embed.to_dict()]
    }
    async with aiohttp.ClientSession() as sess:
        try:
            await sess.post(RULES_WEBHOOK_URL, json=payload)
        except Exception as e:
            print("Webhook post failed:", e)

# Slash to provide OAuth link to user (ephemeral)
@tree.command(name="link_oauth", description="Get the OAuth link to link your Discord and join the server")
@app_commands.guilds(discord.Object(id=GUILD_ID))
async def link_oauth(interaction: discord.Interaction):
    oauth_url = make_oauth_url()
    await interaction.response.send_message(f"Click to link your Discord account and (optionally) join the server: {oauth_url}", ephemeral=True)

# Simple admin command to open the oauth landing page link
@bot.command(name="oauth_url")
@commands.has_guild_permissions(manage_guild=True)
async def cmd_oauth_url(ctx):
    await ctx.send(f"OAuth link: `{make_oauth_url()}`")

# ---------- bot startup + web server runner ----------
async def start_web_app():
    app = make_web_app()
    runner = web.AppRunner(app)
    await runner.setup()
    # change port if needed or use environment variable
    port = int(os.getenv("PORT") or 8080)
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    print(f"OAuth webserver listening on http://0.0.0.0:{port}/")

@bot.event
async def on_ready():
    print(f"Bot logged in as {bot.user} (ID: {bot.user.id})")
    # Create DB tables
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("CREATE TABLE IF NOT EXISTS verified (discord_id INTEGER PRIMARY KEY, verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
        await db.execute("CREATE TABLE IF NOT EXISTS oauth_links (discord_id INTEGER PRIMARY KEY, username TEXT)")
        await db.commit()

    # Sync commands for the guild (helps development)
    try:
        guild = discord.Object(id=GUILD_ID)
        await tree.sync(guild=guild)
        print("Synced commands for guild.")
    except Exception as e:
        print("Failed to sync commands:", e)

# Run both bot and web app
async def main():
    # start web server before bot
    await start_web_app()
    await bot.start(TOKEN)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Shutting down.")
