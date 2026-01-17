const { SlashCommandBuilder } = require('discord.js');
const { EmbedCreator } = require('../utils/embedBuilder');

module.exports = {
    category: '🎮 LSPDFR Info',
    data: new SlashCommandBuilder()
        .setName('requirements')
        .setDescription('Show LSPDFR system requirements and prerequisites'),
    
    async execute(interaction) {
        const embed = EmbedCreator.createRequirementsEmbed();
        await interaction.reply({ embeds: [embed] });
    }
};
