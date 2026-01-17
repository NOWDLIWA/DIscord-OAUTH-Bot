const { SlashCommandBuilder } = require('discord.js');
const { EmbedCreator } = require('../utils/embedBuilder');

module.exports = {
    category: '📁 Log Management',
    data: new SlashCommandBuilder()
        .setName('sendlogs')
        .setDescription('Get instructions for uploading and sharing your LSPDFR log files'),
    
    async execute(interaction) {
        const embed = EmbedCreator.createInfoEmbed(
            '📁 How to Upload Your Log Files',
            'Follow these steps to share your LSPDFR logs for analysis:'
        );

        embed.addFields(
            {
                name: '📍 Step 1: Locate Your Logs',
                value: 'Log files are typically found in:\n' +
                       '```Grand Theft Auto V/RagePluginHook.log\n' +
                       'Grand Theft Auto V/ScriptHookV.log\n' +
                       'Grand Theft Auto V/asiloader.log\n' +
                       'Grand Theft Auto V/Plugins/LSPDFR/LSPDFR.log```',
                inline: false
            },
            {
                name: '📤 Step 2: Upload to Discord',
                value: '• Simply drag and drop the log files into this channel\n' +
                       '• Or click the + button and select the files\n' +
                       '• The bot will automatically analyze them!',
                inline: false
            },
            {
                name: '📋 Common Log Files',
                value: '**Essential:**\n' +
                       '• `RagePluginHook.log` - Main LSPDFR log\n' +
                       '• `ScriptHookV.log` - ScriptHookV errors\n\n' +
                       '**Helpful:**\n' +
                       '• `asiloader.log` - ASI loading info\n' +
                       '• `ELS.log` - Emergency Lighting System\n' +
                       '• Crash dumps from `Grand Theft Auto V/` folder',
                inline: false
            },
            {
                name: '⚠️ Important Notes',
                value: '• Maximum file size: 10MB\n' +
                       '• Supported formats: .log, .txt, .dmp\n' +
                       '• For larger files, use https://pastebin.com or compress them\n' +
                       '• Use `/authorize` first for full tracking features',
                inline: false
            },
            {
                name: '🔍 What Happens Next?',
                value: 'Once uploaded, the bot will:\n' +
                       '✅ Automatically scan for errors\n' +
                       '✅ Detect common issues\n' +
                       '✅ Provide suggested solutions\n' +
                       '✅ Identify conflicting plugins',
                inline: false
            }
        );

        await interaction.reply({ embeds: [embed] });
    }
};
