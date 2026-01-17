const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    category: '🛡️ Administration',
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure bot settings for this server (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('logchannel')
                .setDescription('Set the channel for log file uploads')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to use for logs')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('supportrole')
                .setDescription('Set the support role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The support role')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('adminrole')
                .setDescription('Set the admin role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The admin role')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('autoanalysis')
                .setDescription('Enable or disable automatic log analysis')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable auto-analysis?')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current server configuration')),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const db = interaction.client.database;
        const guildId = interaction.guildId;

        if (subcommand === 'view') {
            const config = db.getServerConfig(guildId);
            
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Server Configuration')
                .setDescription('Current bot settings for this server')
                .setColor(COLORS.PRIMARY)
                .setTimestamp()
                .setFooter({ text: 'LSPDFR Helper Bot' });

            if (!config) {
                embed.addFields({
                    name: 'Status',
                    value: 'No configuration set. Use `/config` commands to set up the bot.',
                    inline: false
                });
            } else {
                embed.addFields(
                    {
                        name: '📁 Log Channel',
                        value: config.log_channel_id ? `<#${config.log_channel_id}>` : 'Not set',
                        inline: true
                    },
                    {
                        name: '🎫 Support Role',
                        value: config.support_role_id ? `<@&${config.support_role_id}>` : 'Not set',
                        inline: true
                    },
                    {
                        name: '🛡️ Admin Role',
                        value: config.admin_role_id ? `<@&${config.admin_role_id}>` : 'Not set',
                        inline: true
                    },
                    {
                        name: '🤖 Auto Analysis',
                        value: config.auto_analysis ? '✅ Enabled' : '❌ Disabled',
                        inline: true
                    },
                    {
                        name: '🕐 Last Updated',
                        value: config.updated_at || 'Never',
                        inline: true
                    }
                );
            }

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Handle configuration updates
        let updateConfig = {};
        let successMessage = '';

        switch (subcommand) {
            case 'logchannel':
                const channel = interaction.options.getChannel('channel');
                updateConfig.logChannelId = channel.id;
                successMessage = `Log channel set to ${channel}`;
                break;

            case 'supportrole':
                const supportRole = interaction.options.getRole('role');
                updateConfig.supportRoleId = supportRole.id;
                successMessage = `Support role set to ${supportRole}`;
                break;

            case 'adminrole':
                const adminRole = interaction.options.getRole('role');
                updateConfig.adminRoleId = adminRole.id;
                successMessage = `Admin role set to ${adminRole}`;
                break;

            case 'autoanalysis':
                const enabled = interaction.options.getBoolean('enabled');
                updateConfig.autoAnalysis = enabled;
                successMessage = `Auto-analysis ${enabled ? 'enabled' : 'disabled'}`;
                break;
        }

        // Save to database
        db.setServerConfig(guildId, updateConfig);

        const embed = new EmbedBuilder()
            .setTitle('✅ Configuration Updated')
            .setDescription(successMessage)
            .setColor(COLORS.SUCCESS)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
