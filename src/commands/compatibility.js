const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ErrorDatabase = require('../utils/errorDatabase');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    category: '🎮 LSPDFR Info',
    data: new SlashCommandBuilder()
        .setName('compatibility')
        .setDescription('Check mod compatibility information')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('Plugin or mod name to check')
                .setRequired(true)
                .addChoices(
                    { name: 'LSPDFR', value: 'lspdfr' },
                    { name: 'ELS (Emergency Lighting System)', value: 'els' },
                    { name: 'ComputerPlus', value: 'computerplus' }
                )),
    
    async execute(interaction) {
        const item = interaction.options.getString('item');
        const db = new ErrorDatabase();
        
        const compatInfo = db.getCompatibilityInfo(item);

        const embed = new EmbedBuilder()
            .setTitle(`🔍 Compatibility: ${item.toUpperCase()}`)
            .setDescription(compatInfo.notes)
            .setColor(COLORS.INFO)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });

        if (compatInfo.requires && compatInfo.requires.length > 0) {
            embed.addFields({
                name: '✅ Requires',
                value: compatInfo.requires.map(r => `• ${r}`).join('\n'),
                inline: false
            });
        }

        if (compatInfo.compatibleWith && compatInfo.compatibleWith.length > 0) {
            embed.addFields({
                name: '🤝 Compatible With',
                value: compatInfo.compatibleWith.map(c => `• ${c}`).join('\n'),
                inline: true
            });
        }

        if (compatInfo.incompatibleWith && compatInfo.incompatibleWith.length > 0) {
            embed.addFields({
                name: '⚠️ Incompatible With',
                value: compatInfo.incompatibleWith.map(i => `• ${i}`).join('\n'),
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
