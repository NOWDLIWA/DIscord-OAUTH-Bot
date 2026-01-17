const { SlashCommandBuilder } = require('discord.js');
const { EmbedCreator } = require('../utils/embedBuilder');

module.exports = {
    category: '🔐 Authorization',
    data: new SlashCommandBuilder()
        .setName('authorize')
        .setDescription('Authorize the bot to access your files for log analysis'),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const db = interaction.client.database;

        // Check if already authorized
        const isAuthorized = db.isUserAuthorized(userId);
        
        if (isAuthorized) {
            const embed = EmbedCreator.createInfoEmbed(
                '✅ Already Authorized',
                'You have already authorized this bot. Use `/revoke` to remove authorization.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Authorize the user
        db.authorizeUser(userId);

        const embed = EmbedCreator.createSuccessEmbed(
            '✅ Authorization Granted',
            'You have successfully authorized the LSPDFR Helper Bot!\n\n' +
            '**What this means:**\n' +
            '• The bot can now analyze log files you upload\n' +
            '• Your uploaded logs are tracked for troubleshooting history\n' +
            '• You can use all bot features without restrictions\n\n' +
            'Use `/revoke` at any time to revoke this authorization.'
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
