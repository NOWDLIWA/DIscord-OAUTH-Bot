const { SlashCommandBuilder } = require('discord.js');
const { EmbedCreator } = require('../utils/embedBuilder');

module.exports = {
    category: '🔐 Authorization',
    data: new SlashCommandBuilder()
        .setName('revoke')
        .setDescription('Revoke bot access to your data'),
    
    async execute(interaction) {
        const userId = interaction.user.id;
        const db = interaction.client.database;

        // Check if authorized
        const isAuthorized = db.isUserAuthorized(userId);
        
        if (!isAuthorized) {
            const embed = EmbedCreator.createInfoEmbed(
                'ℹ️ Not Authorized',
                'You haven\'t authorized this bot yet. Use `/authorize` to grant access.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Revoke authorization
        db.revokeUser(userId);

        const embed = EmbedCreator.createSuccessEmbed(
            '✅ Authorization Revoked',
            'Your authorization has been successfully revoked.\n\n' +
            '**What this means:**\n' +
            '• The bot will no longer track your log uploads\n' +
            '• Previous upload history remains for troubleshooting purposes\n' +
            '• You can re-authorize at any time using `/authorize`'
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
