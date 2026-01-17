const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    category: '📚 Information',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands and bot information'),
    
    async execute(interaction) {
        // Gather all commands
        const commands = Array.from(interaction.client.commands.values());
        
        // Group by category
        const categories = {};
        commands.forEach(cmd => {
            const category = cmd.category || '📚 Other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({
                name: cmd.data.name,
                description: cmd.data.description
            });
        });

        const embed = new EmbedBuilder()
            .setTitle('📚 LSPDFR Helper Bot - Command List')
            .setDescription('A comprehensive Discord bot for LSPDFR troubleshooting, log analysis, and support')
            .setColor(COLORS.PRIMARY)
            .setThumbnail('https://i.imgur.com/xVhVqQZ.png')
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });

        // Add commands by category
        Object.entries(categories).forEach(([category, cmds]) => {
            const cmdList = cmds.map(c => `\`/${c.name}\` - ${c.description}`).join('\n');
            embed.addFields({
                name: category,
                value: cmdList,
                inline: false
            });
        });

        // Add quick start guide
        embed.addFields({
            name: '🚀 Quick Start',
            value: '1. Use `/authorize` to enable full features\n' +
                   '2. Upload log files or use `/sendlogs` for instructions\n' +
                   '3. Use `/troubleshoot` for interactive help\n' +
                   '4. Check `/setup` for installation guide',
            inline: false
        });

        // Add useful links
        embed.addFields({
            name: '🔗 Useful Links',
            value: '[LCPDFR.com](https://www.lcpdfr.com/) • [RagePluginHook](https://ragepluginhook.net/) • [ScriptHookV](http://www.dev-c.com/gtav/scripthookv/)',
            inline: false
        });

        await interaction.reply({ embeds: [embed] });
    }
};
