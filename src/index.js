const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DatabaseHandler = require('./utils/database');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Initialize command collection
client.commands = new Collection();

// Initialize database
client.database = new DatabaseHandler(process.env.DATABASE_PATH || './data/bot.db');

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
        console.log(`⚠️  Warning: Command at ${filePath} is missing required "data" or "execute" property.`);
    }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`✅ Loaded event: ${event.name}`);
}

// Register slash commands
async function registerCommands() {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        console.log('🔄 Started refreshing application (/) commands...');

        // Register commands globally or per guild
        if (process.env.GUILD_ID) {
            // Guild-specific (faster for testing)
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            console.log(`✅ Successfully registered ${commands.length} commands for guild ${process.env.GUILD_ID}`);
        } else {
            // Global commands (takes up to 1 hour to propagate)
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log(`✅ Successfully registered ${commands.length} global commands`);
        }
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    client.database.close();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    client.database.close();
    client.destroy();
    process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Login and register commands
async function start() {
    try {
        await registerCommands();
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

start();

// Export client for testing purposes
module.exports = client;
