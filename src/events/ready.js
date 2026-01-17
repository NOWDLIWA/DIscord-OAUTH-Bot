const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ Ready! Logged in as ${client.user.tag}`);
        console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
        console.log(`👥 Watching ${client.users.cache.size} user(s)`);
        
        // Set bot status
        client.user.setPresence({
            activities: [{ 
                name: '/help | LSPDFR Troubleshooting',
                type: 0 // Playing
            }],
            status: 'online'
        });
    }
};
