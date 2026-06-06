import discord
from discord.ext import commands
import asyncio

# Bot setup with command prefix ;
intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix=';', intents=intents)

# ID of the user who should be tagged (replace with your Discord user ID)
YOUR_USER_ID = 123456789012345678  # <-- YEH ID BADLO

# Response text when someone tags you
TAG_RESPONSE = "Hello! Main yahan hoon, kya kaam hai?"

@bot.event
async def on_ready():
    print(f'Bot login ho gaya: {bot.user.name}')
    print(f'Bot ID: {bot.user.id}')
    print('------')

@bot.event
async def on_message(message):
    # Ignore bot's own messages
    if message.author == bot.user:
        return

    # Check if someone tagged you (mentioned your user ID)
    your_user = message.guild.get_member(YOUR_USER_ID) if message.guild else None

    # Check mentions in the message
    if bot.user in message.mentions:
        # Someone tagged the bot
        await message.channel.send("Hello! Main ek bot hoon, ;help se commands dekh sakte ho.")

    # Check if someone tagged you specifically (by ID or mention)
    if f'<@{YOUR_USER_ID}>' in message.content or f'<@!{YOUR_USER_ID}>' in message.content:
        await message.channel.send(TAG_RESPONSE)

    # Process commands
    await bot.process_commands(message)

# Custom command: ;setresponse <text>
@bot.command()
@commands.has_permissions(administrator=True)
async def setresponse(ctx, *, text: str):
    """Set the auto-response text when someone tags you"""
    global TAG_RESPONSE
    TAG_RESPONSE = text
    await ctx.send(f"Response update ho gayi: {text}")

# Custom command: ;setid <user_id>
@bot.command()
@commands.has_permissions(administrator=True)
async def setid(ctx, user_id: int):
    """Set the user ID who should be monitored for tags"""
    global YOUR_USER_ID
    YOUR_USER_ID = user_id
    await ctx.send(f"User ID update ho gayi: {user_id}")

# Custom command: ;status
@bot.command()
async def status(ctx):
    """Check bot status"""
    await ctx.send(f"Bot active hai!\nMonitored User ID: {YOUR_USER_ID}\nResponse: {TAG_RESPONSE}")

# Help command (override default)
@bot.command()
async def help(ctx):
    """Show all commands"""
    embed = discord.Embed(title="Bot Commands", color=discord.Color.blue())
    embed.add_field(name=";setresponse <text>", value="Tag response text set karo (Admin only)", inline=False)
    embed.add_field(name=";setid <user_id>", value="Monitored user ID set karo (Admin only)", inline=False)
    embed.add_field(name=";status", value="Current bot settings dekho", inline=False)
    embed.add_field(name=";help", value="Yeh help message", inline=False)
    embed.add_field(name="Auto-Response", value=f"Jab koi <@{YOUR_USER_ID}> ko tag karega, bot respond karega", inline=False)
    await ctx.send(embed=embed)

# Run the bot (replace with your bot token)
TOKEN = "YOUR_BOT_TOKEN_HERE"  # <-- YEH TOKEN BADLO
bot.run(TOKEN)
