const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    category: '🔍 Troubleshooting',
    data: new SlashCommandBuilder()
        .setName('troubleshoot')
        .setDescription('Start an interactive troubleshooting wizard to diagnose issues'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🔧 LSPDFR Troubleshooting Wizard')
            .setDescription('Let\'s figure out what\'s wrong! Select the category that best describes your issue:')
            .setColor(COLORS.PRIMARY)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('troubleshoot_category')
            .setPlaceholder('Select an issue category')
            .addOptions([
                {
                    label: 'Game Won\'t Start',
                    description: 'LSPDFR or GTA V fails to launch',
                    value: 'wont_start',
                    emoji: '🚫'
                },
                {
                    label: 'Game Crashes',
                    description: 'Game crashes during play or loading',
                    value: 'crashes',
                    emoji: '💥'
                },
                {
                    label: 'Performance Issues',
                    description: 'Low FPS, stuttering, or lag',
                    value: 'performance',
                    emoji: '🐌'
                },
                {
                    label: 'Plugin Problems',
                    description: 'Plugins not loading or working',
                    value: 'plugins',
                    emoji: '🔌'
                },
                {
                    label: 'LSPDFR Features Not Working',
                    description: 'Computer, traffic stops, callouts, etc.',
                    value: 'features',
                    emoji: '⚙️'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            ephemeral: false 
        });
    },

    async handleSelectMenu(interaction) {
        const value = interaction.values[0];
        
        const troubleshootingPaths = {
            'wont_start': {
                title: '🚫 Game Won\'t Start',
                questions: [
                    {
                        question: 'Does GTA V launch without mods (via Steam/Rockstar Launcher)?',
                        yes: 'Good! The issue is with LSPDFR/mods. Continue...',
                        no: 'Your GTA V installation may be corrupted. Verify game files first!'
                    },
                    {
                        question: 'Are you running RAGEPluginHook.exe as Administrator?',
                        yes: 'Good practice! Continue...',
                        no: 'Try right-clicking RAGEPluginHook.exe → Run as Administrator'
                    },
                    {
                        question: 'Do you have ScriptHookV installed?',
                        yes: 'Check that your ScriptHookV version matches GTA V version',
                        no: 'Download ScriptHookV from dev-c.com and extract to GTA V folder'
                    }
                ],
                solutions: [
                    'Verify GTA V game files',
                    'Update RagePluginHook to latest version',
                    'Check Windows Event Viewer for crash details',
                    'Temporarily rename plugins folder to test'
                ]
            },
            'crashes': {
                title: '💥 Game Crashes',
                questions: [
                    {
                        question: 'When does the crash occur?',
                        options: ['During loading', 'When going on duty', 'During gameplay', 'Random']
                    },
                    {
                        question: 'Have you recently installed new plugins or vehicles?',
                        yes: 'Remove the latest additions and test',
                        no: 'Check if GTA V recently updated (may break mods)'
                    }
                ],
                solutions: [
                    'Disable plugins one by one to find the culprit',
                    'Install Heap Adjuster mod',
                    'Check crash logs in GTA V folder',
                    'Update all plugins to latest versions'
                ]
            },
            'performance': {
                title: '🐌 Performance Issues',
                questions: [
                    {
                        question: 'What\'s your average FPS?',
                        options: ['Below 30', '30-45', '45-60', 'Above 60 but stuttering']
                    },
                    {
                        question: 'How many plugins do you have active?',
                        options: ['1-5', '6-15', '16-30', 'More than 30']
                    }
                ],
                solutions: [
                    'Install Heap Adjuster and Packfile Limit Adjuster',
                    'Lower graphics settings (MSAA, Shadows, Reflections)',
                    'Reduce number of active plugins',
                    'Limit backup units and traffic density',
                    'Close background applications'
                ]
            },
            'plugins': {
                title: '🔌 Plugin Problems',
                questions: [
                    {
                        question: 'Are plugins in the correct folder? (GTA V/plugins/LSPDFR)',
                        yes: 'Good! Continue...',
                        no: 'Move plugins to the correct location'
                    },
                    {
                        question: 'Do you see plugin load messages in RPH console?',
                        yes: 'Plugins are loading. Check for errors in the console.',
                        no: 'Plugins aren\'t being detected. Check file locations.'
                    }
                ],
                solutions: [
                    'Check RagePluginHook.log for specific errors',
                    'Verify .NET Framework 4.8 is installed',
                    'Ensure all plugin dependencies are installed',
                    'Update plugins to latest versions',
                    'Check plugin compatibility with LSPDFR version'
                ]
            },
            'features': {
                title: '⚙️ LSPDFR Features Not Working',
                questions: [
                    {
                        question: 'Which feature isn\'t working?',
                        options: ['Computer', 'Traffic Stops', 'Callouts', 'Backup', 'Other']
                    },
                    {
                        question: 'Are you on duty? (F4 by default)',
                        yes: 'Good! You must be on duty for most features.',
                        no: 'Press F4 to go on duty first!'
                    }
                ],
                solutions: [
                    'Verify you\'re in a police vehicle',
                    'Check plugin keybinds haven\'t changed',
                    'Ensure required plugins are installed and loaded',
                    'Review RagePluginHook.log for errors',
                    'Try reinstalling the specific plugin'
                ]
            }
        };

        const path = troubleshootingPaths[value];
        
        const embed = new EmbedBuilder()
            .setTitle(path.title)
            .setDescription('Based on your selection, here\'s what to check:')
            .setColor(COLORS.INFO)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });

        // Add questions
        if (path.questions) {
            path.questions.forEach((q, index) => {
                let fieldValue = '';
                if (q.options) {
                    fieldValue = `Options: ${q.options.join(', ')}`;
                } else {
                    fieldValue = `**Yes:** ${q.yes || 'Continue'}\n**No:** ${q.no || 'Check this'}`;
                }
                
                embed.addFields({
                    name: `${index + 1}. ${q.question}`,
                    value: fieldValue,
                    inline: false
                });
            });
        }

        // Add solutions
        if (path.solutions) {
            const solutionsList = path.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n');
            embed.addFields({
                name: '✅ Recommended Solutions',
                value: solutionsList,
                inline: false
            });
        }

        // Add helpful commands
        embed.addFields({
            name: '📚 Additional Resources',
            value: '• Use `/sendlogs` to upload your log files for analysis\n' +
                   '• Use `/fix` to get detailed fix guides\n' +
                   '• Use `/error <code>` if you have specific error codes',
            inline: false
        });

        await interaction.update({ embeds: [embed], components: [] });
    }
};
