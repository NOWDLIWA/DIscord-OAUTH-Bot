const { SlashCommandBuilder } = require('discord.js');
const ErrorDatabase = require('../utils/errorDatabase');
const { EmbedCreator } = require('../utils/embedBuilder');

module.exports = {
    category: '🔍 Troubleshooting',
    data: new SlashCommandBuilder()
        .setName('fix')
        .setDescription('Get common fixes for LSPDFR issues')
        .addStringOption(option =>
            option.setName('issue')
                .setDescription('Issue type')
                .setRequired(true)
                .addChoices(
                    { name: 'Game Won\'t Start', value: 'game_wont_start' },
                    { name: 'Crash When Going On Duty', value: 'crash_on_duty' },
                    { name: 'Poor Performance/FPS', value: 'poor_performance' },
                    { name: 'Plugins Not Loading', value: 'plugins_not_loading' },
                    { name: 'Computer Not Working', value: 'computer_not_working' },
                    { name: 'Traffic Stops Not Working', value: 'traffic_stop_issues' },
                    { name: 'ELS Lights Not Working', value: 'els_not_working' },
                    { name: 'No Callouts Appearing', value: 'callouts_not_spawning' },
                    { name: 'Backup Not Arriving', value: 'backup_not_arriving' },
                    { name: 'RagePluginHook Freezing', value: 'rage_freezing' }
                )),
    
    async execute(interaction) {
        const issueKey = interaction.options.getString('issue');
        const db = new ErrorDatabase();

        const fix = db.getFix(issueKey);

        if (!fix) {
            const embed = EmbedCreator.createErrorEmbed(
                '❌ Fix Not Found',
                `No fix guide found for \`${issueKey}\`.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const embed = EmbedCreator.createFixGuideEmbed(fix);
        
        embed.addFields({
            name: '📚 Additional Help',
            value: '• Check `/error` for specific error codes\n' +
                   '• Use `/troubleshoot` for guided diagnosis\n' +
                   '• Upload logs with `/sendlogs` for analysis',
            inline: false
        });

        await interaction.reply({ embeds: [embed] });
    }
};
