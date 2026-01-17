const { EmbedBuilder } = require('discord.js');

// LSPDFR themed colors
const COLORS = {
    PRIMARY: 0x2C5F9E,      // Police blue
    SUCCESS: 0x57F287,       // Green
    WARNING: 0xFEE75C,       // Yellow
    ERROR: 0xED4245,         // Red
    INFO: 0x5865F2,          // Blurple
    SECONDARY: 0x99AAB5      // Gray
};

class EmbedCreator {
    static createBasicEmbed(title, description, color = COLORS.PRIMARY) {
        return new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });
    }

    static createSuccessEmbed(title, description) {
        return this.createBasicEmbed(title, description, COLORS.SUCCESS)
            .setThumbnail('https://i.imgur.com/xVhVqQZ.png'); // Success checkmark
    }

    static createErrorEmbed(title, description) {
        return this.createBasicEmbed(title, description, COLORS.ERROR)
            .setThumbnail('https://i.imgur.com/3aW5zzP.png'); // Error icon
    }

    static createWarningEmbed(title, description) {
        return this.createBasicEmbed(title, description, COLORS.WARNING);
    }

    static createInfoEmbed(title, description) {
        return this.createBasicEmbed(title, description, COLORS.INFO);
    }

    static createLogAnalysisEmbed(fileName, errors, warnings) {
        const embed = new EmbedBuilder()
            .setTitle('📊 Log Analysis Results')
            .setDescription(`**File:** ${fileName}`)
            .setColor(errors.length > 0 ? COLORS.ERROR : warnings.length > 0 ? COLORS.WARNING : COLORS.SUCCESS)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });

        if (errors.length > 0) {
            const errorList = errors.slice(0, 5).map(e => `• ${e}`).join('\n');
            embed.addFields({
                name: `❌ Errors Found (${errors.length})`,
                value: errorList + (errors.length > 5 ? `\n*...and ${errors.length - 5} more*` : ''),
                inline: false
            });
        }

        if (warnings.length > 0) {
            const warningList = warnings.slice(0, 5).map(w => `• ${w}`).join('\n');
            embed.addFields({
                name: `⚠️ Warnings Found (${warnings.length})`,
                value: warningList + (warnings.length > 5 ? `\n*...and ${warnings.length - 5} more*` : ''),
                inline: false
            });
        }

        if (errors.length === 0 && warnings.length === 0) {
            embed.addFields({
                name: '✅ No Issues Found',
                value: 'Your log file looks good! No critical errors or warnings detected.',
                inline: false
            });
        }

        return embed;
    }

    static createPluginListEmbed(plugins, category = 'All') {
        const embed = new EmbedBuilder()
            .setTitle(`🎮 LSPDFR Plugins - ${category}`)
            .setDescription('Popular and recommended plugins for LSPDFR')
            .setColor(COLORS.PRIMARY)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });

        const filteredPlugins = category === 'All' 
            ? plugins 
            : plugins.filter(p => p.category === category);

        filteredPlugins.slice(0, 10).forEach(plugin => {
            const required = plugin.required ? '⚠️ **REQUIRED**' : '';
            embed.addFields({
                name: `${plugin.name} ${required}`,
                value: `${plugin.description}\n[Download](${plugin.url})`,
                inline: false
            });
        });

        return embed;
    }

    static createErrorInfoEmbed(error) {
        const embed = new EmbedBuilder()
            .setTitle(`🔍 Error: ${error.name}`)
            .setDescription(error.description)
            .setColor(COLORS.ERROR)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });

        embed.addFields({
            name: '📌 Error Code',
            value: error.code,
            inline: true
        });

        if (error.keywords && error.keywords.length > 0) {
            embed.addFields({
                name: '🔑 Keywords',
                value: error.keywords.join(', '),
                inline: true
            });
        }

        if (error.solutions && error.solutions.length > 0) {
            const solutions = error.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n');
            embed.addFields({
                name: '✅ Solutions',
                value: solutions,
                inline: false
            });
        }

        return embed;
    }

    static createFixGuideEmbed(fix) {
        const embed = new EmbedBuilder()
            .setTitle(`🔧 ${fix.title}`)
            .setDescription('Follow these steps to resolve the issue:')
            .setColor(COLORS.INFO)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });

        const steps = fix.steps.map((s, i) => `**${i + 1}.** ${s}`).join('\n\n');
        embed.addFields({
            name: '📋 Steps',
            value: steps,
            inline: false
        });

        return embed;
    }

    static createHelpEmbed(commands) {
        const embed = new EmbedBuilder()
            .setTitle('📚 LSPDFR Helper Bot - Commands')
            .setDescription('Here are all available commands:')
            .setColor(COLORS.PRIMARY)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' });

        // Group commands by category
        const categories = {};
        commands.forEach(cmd => {
            if (!categories[cmd.category]) {
                categories[cmd.category] = [];
            }
            categories[cmd.category].push(cmd);
        });

        Object.entries(categories).forEach(([category, cmds]) => {
            const cmdList = cmds.map(c => `\`/${c.name}\` - ${c.description}`).join('\n');
            embed.addFields({
                name: `${category}`,
                value: cmdList,
                inline: false
            });
        });

        return embed;
    }

    static createVersionsEmbed(versions) {
        const embed = new EmbedBuilder()
            .setTitle('📦 Latest LSPDFR Versions')
            .setDescription('Current versions of essential LSPDFR components')
            .setColor(COLORS.PRIMARY)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot • Last updated' });

        Object.entries(versions).forEach(([name, data]) => {
            embed.addFields({
                name: name,
                value: `**Version:** ${data.version}\n**Released:** ${data.releaseDate}\n[Download](${data.url})`,
                inline: true
            });
        });

        return embed;
    }

    static createRequirementsEmbed() {
        return new EmbedBuilder()
            .setTitle('💻 LSPDFR System Requirements')
            .setDescription('Minimum and recommended specifications for LSPDFR')
            .setColor(COLORS.PRIMARY)
            .setTimestamp()
            .setFooter({ text: 'LSPDFR Helper Bot' })
            .addFields(
                {
                    name: '🎮 GTA V Requirements',
                    value: '• **Game Version:** Latest Steam/Rockstar Games version\n• **Installation:** Legitimate copy of GTA V required',
                    inline: false
                },
                {
                    name: '💾 Minimum Specifications',
                    value: '• **OS:** Windows 10 (64-bit)\n• **RAM:** 8GB\n• **GPU:** NVIDIA GTX 660 / AMD HD 7870\n• **Storage:** 100GB+',
                    inline: true
                },
                {
                    name: '🚀 Recommended Specifications',
                    value: '• **OS:** Windows 10/11 (64-bit)\n• **RAM:** 16GB+\n• **GPU:** NVIDIA GTX 1060 / AMD RX 580\n• **Storage:** 150GB+ SSD',
                    inline: true
                },
                {
                    name: '📦 Required Software',
                    value: '• Visual C++ Redistributables (2013, 2015-2022)\n• .NET Framework 4.8\n• DirectX 11',
                    inline: false
                }
            );
    }
}

module.exports = { EmbedCreator, COLORS };
