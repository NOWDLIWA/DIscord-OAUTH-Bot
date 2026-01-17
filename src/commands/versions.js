const { SlashCommandBuilder } = require('discord.js');
const ErrorDatabase = require('../utils/errorDatabase');
const { EmbedCreator } = require('../utils/embedBuilder');

module.exports = {
    category: '🎮 LSPDFR Info',
    data: new SlashCommandBuilder()
        .setName('versions')
        .setDescription('Show latest versions of LSPDFR, RagePluginHook, and related software'),
    
    async execute(interaction) {
        const db = new ErrorDatabase();
        const versions = db.getVersionInfo();

        const embed = EmbedCreator.createVersionsEmbed(versions);
        
        embed.addFields({
            name: '⚠️ Important Notes',
            value: '• Always check LCPDFR.com for the most up-to-date versions\n' +
                   '• ScriptHookV must match your GTA V version\n' +
                   '• GTA V updates may temporarily break mods\n' +
                   '• Keep RagePluginHook updated for best compatibility',
            inline: false
        });

        await interaction.reply({ embeds: [embed] });
    }
};
