const { Events, PermissionFlagsBits } = require('discord.js');
const LogParser = require('../utils/logParser');
const { EmbedCreator } = require('../utils/embedBuilder');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Check if message has attachments
        if (message.attachments.size > 0) {
            await handleLogAttachments(message);
        }
    }
};

async function handleLogAttachments(message) {
    const logParser = new LogParser();
    const validLogExtensions = ['.log', '.txt', '.dmp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const attachment of message.attachments.values()) {
        const fileName = attachment.name.toLowerCase();
        const isLogFile = validLogExtensions.some(ext => fileName.endsWith(ext));

        if (!isLogFile) continue;
        if (attachment.size > maxSize) {
            await message.reply('⚠️ Log file is too large (max 10MB). Please compress it or share via a file hosting service.');
            continue;
        }

        try {
            // Download and analyze the log file
            const response = await fetch(attachment.url);
            const logContent = await response.text();

            const analysis = logParser.analyzeLog(logContent, attachment.name);
            
            // Create analysis embed
            const embed = EmbedCreator.createLogAnalysisEmbed(
                attachment.name,
                analysis.errors,
                analysis.warnings
            );

            // Add suggestions if any
            if (analysis.suggestions.length > 0) {
                const suggestions = analysis.suggestions.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n');
                embed.addFields({
                    name: '💡 Suggestions',
                    value: suggestions,
                    inline: false
                });
            }

            // Add detected issues
            if (analysis.detectedIssues.length > 0) {
                embed.addFields({
                    name: '🔍 Detected Issues',
                    value: `Error codes: ${analysis.detectedIssues.join(', ')}\nUse \`/error <code>\` for more info`,
                    inline: false
                });
            }

            await message.reply({ embeds: [embed] });

            // Log to database if available
            if (message.client.database) {
                message.client.database.logUpload(
                    message.author.id,
                    message.guildId || 'DM',
                    attachment.name,
                    attachment.size,
                    JSON.stringify(analysis)
                );
            }
        } catch (error) {
            console.error('Error analyzing log file:', error);
            await message.reply('❌ Failed to analyze log file. Please ensure it\'s a valid text file.');
        }
    }
}
