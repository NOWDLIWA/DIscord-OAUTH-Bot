const { SlashCommandBuilder } = require('discord.js');
const ErrorDatabase = require('../utils/errorDatabase');
const { EmbedCreator } = require('../utils/embedBuilder');

module.exports = {
    category: '🎮 LSPDFR Info',
    data: new SlashCommandBuilder()
        .setName('plugins')
        .setDescription('List recommended LSPDFR plugins')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Filter by category')
                .setRequired(false)
                .addChoices(
                    { name: 'All Plugins', value: 'All' },
                    { name: 'Essential', value: 'Essential' },
                    { name: 'Recommended', value: 'Recommended' },
                    { name: 'Popular', value: 'Popular' },
                    { name: 'Callouts', value: 'Callouts' },
                    { name: 'Utilities', value: 'Utilities' }
                )),
    
    async execute(interaction) {
        const category = interaction.options.getString('category') || 'All';
        const db = new ErrorDatabase();

        const plugins = db.getPluginsByCategory(category);

        if (plugins.length === 0) {
            const embed = EmbedCreator.createWarningEmbed(
                '⚠️ No Plugins Found',
                `No plugins found in category: ${category}`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embed = EmbedCreator.createPluginListEmbed(plugins, category);
        
        if (plugins.length > 10) {
            embed.setFooter({ 
                text: `LSPDFR Helper Bot • Showing 10 of ${plugins.length} plugins` 
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
