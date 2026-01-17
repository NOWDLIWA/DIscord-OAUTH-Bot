const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    category: '🎮 LSPDFR Info',
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Get a complete guide for fresh LSPDFR installation'),
    
    async execute(interaction) {
        const embed1 = new EmbedBuilder()
            .setTitle('📦 LSPDFR Fresh Installation Guide - Part 1')
            .setDescription('Follow these steps carefully for a clean LSPDFR setup')
            .setColor(COLORS.PRIMARY)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' })
            .addFields(
                {
                    name: '1️⃣ Prerequisites',
                    value: '**Before you begin:**\n' +
                           '• Legitimate copy of GTA V (Steam or Rockstar Games)\n' +
                           '• GTA V updated to latest version\n' +
                           '• At least 100GB free disk space\n' +
                           '• Windows 10/11 (64-bit)',
                    inline: false
                },
                {
                    name: '2️⃣ Install Required Software',
                    value: '**Download and install:**\n' +
                           '• Visual C++ Redistributables 2013, 2015-2022\n' +
                           '• .NET Framework 4.8\n' +
                           '• DirectX Runtime (June 2010)\n' +
                           '[Get them all here](https://www.techpowerup.com/download/visual-c-redistributable-runtime-package-all-in-one/)',
                    inline: false
                },
                {
                    name: '3️⃣ Download ScriptHookV',
                    value: '**Important:**\n' +
                           '• Visit [dev-c.com](http://www.dev-c.com/gtav/scripthookv/)\n' +
                           '• Download the latest version\n' +
                           '• Extract `dinput8.dll` and `ScriptHookV.dll` to GTA V root folder\n' +
                           '• Do NOT use the ASI Manager (conflicts with RPH)',
                    inline: false
                }
            );

        const embed2 = new EmbedBuilder()
            .setTitle('📦 LSPDFR Fresh Installation Guide - Part 2')
            .setColor(COLORS.PRIMARY)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' })
            .addFields(
                {
                    name: '4️⃣ Install RagePluginHook',
                    value: '**Core requirement:**\n' +
                           '• Download from [ragepluginhook.net](https://ragepluginhook.net/)\n' +
                           '• Extract entire folder to `Grand Theft Auto V/`\n' +
                           '• Run `RAGEPluginHook.exe` as administrator\n' +
                           '• Let it create necessary folders',
                    inline: false
                },
                {
                    name: '5️⃣ Install LSPDFR',
                    value: '**The main mod:**\n' +
                           '• Download from [LCPDFR.com](https://www.lcpdfr.com/downloads/gta5mods/g17media/7792-lspd-first-response/)\n' +
                           '• Extract to `Grand Theft Auto V/` (merge folders)\n' +
                           '• LSPDFR files go in `Plugins/LSPDFR/` folder',
                    inline: false
                },
                {
                    name: '6️⃣ First Launch',
                    value: '**Testing your setup:**\n' +
                           '1. Launch `RAGEPluginHook.exe` as administrator\n' +
                           '2. Wait for GTA V to load\n' +
                           '3. Press F4 to go on duty\n' +
                           '4. If successful, you\'re ready for plugins!',
                    inline: false
                },
                {
                    name: '7️⃣ Optional: Install Plugins',
                    value: '**Enhance your experience:**\n' +
                           '• Use `/plugins` to see recommended plugins\n' +
                           '• Install ELS for better emergency lighting\n' +
                           '• Add ComputerPlus or CompuLite for police computer\n' +
                           '• Install callout packs for more variety',
                    inline: false
                }
            );

        const embed3 = new EmbedBuilder()
            .setTitle('⚠️ Common Setup Issues')
            .setColor(COLORS.WARNING)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' })
            .addFields(
                {
                    name: 'Game Won\'t Start',
                    value: '• Verify game files through Steam/Rockstar Launcher\n' +
                           '• Run RAGEPluginHook as administrator\n' +
                           '• Disable antivirus temporarily',
                    inline: false
                },
                {
                    name: 'LSPDFR Not Loading',
                    value: '• Check RagePluginHook.log for errors\n' +
                           '• Ensure files are in correct folders\n' +
                           '• Update to latest RPH version',
                    inline: false
                },
                {
                    name: 'ScriptHookV Errors',
                    value: '• Make sure GTA V version matches ScriptHookV version\n' +
                           '• Only one dinput8.dll should exist in GTA V folder\n' +
                           '• Download from official site only',
                    inline: false
                },
                {
                    name: '📚 Need More Help?',
                    value: '• Use `/sendlogs` to upload log files\n' +
                           '• Use `/troubleshoot` for guided help\n' +
                           '• Visit [LCPDFR Forums](https://www.lcpdfr.com/forums/)',
                    inline: false
                }
            );

        await interaction.reply({ embeds: [embed1, embed2, embed3] });
    }
};
