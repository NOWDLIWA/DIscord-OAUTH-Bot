const { SlashCommandBuilder } = require('discord.js');
const ErrorDatabase = require('../utils/errorDatabase');
const { EmbedCreator } = require('../utils/embedBuilder');

module.exports = {
    category: '🔍 Troubleshooting',
    data: new SlashCommandBuilder()
        .setName('error')
        .setDescription('Look up information about a specific error code')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Error code (e.g., RPH001, SHV001)')
                .setRequired(true)),
    
    async execute(interaction) {
        const errorCode = interaction.options.getString('code');
        const db = new ErrorDatabase();

        const error = db.getError(errorCode);

        if (!error) {
            // Try searching for similar errors
            const similarErrors = db.searchErrors(errorCode);
            
            if (similarErrors.length > 0) {
                const embed = EmbedCreator.createWarningEmbed(
                    '🔍 Error Not Found',
                    `No exact match for error code \`${errorCode}\`. Did you mean one of these?`
                );

                const errorList = similarErrors.slice(0, 5).map(e => 
                    `**${e.code}** - ${e.name}`
                ).join('\n');

                embed.addFields({
                    name: 'Similar Errors',
                    value: errorList,
                    inline: false
                });

                return interaction.reply({ embeds: [embed] });
            }

            const embed = EmbedCreator.createErrorEmbed(
                '❌ Error Not Found',
                `No information found for error code \`${errorCode}\`.\n\n` +
                'Use `/error` with codes like:\n' +
                '• RPH001 - RagePluginHook issues\n' +
                '• SHV001 - ScriptHookV problems\n' +
                '• LSPDFR001 - LSPDFR errors\n' +
                '• MEM001 - Memory issues'
            );

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embed = EmbedCreator.createErrorInfoEmbed(error);
        await interaction.reply({ embeds: [embed] });
    }
};
