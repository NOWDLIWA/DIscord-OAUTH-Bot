const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`❌ No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`❌ Error executing ${interaction.commandName}:`, error);
                
                const errorMessage = {
                    content: '❌ There was an error while executing this command!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        // Handle button interactions
        else if (interaction.isButton()) {
            const buttonId = interaction.customId;
            
            // Handle button interactions for troubleshooting wizard
            if (buttonId.startsWith('troubleshoot_')) {
                const command = interaction.client.commands.get('troubleshoot');
                if (command && command.handleButton) {
                    await command.handleButton(interaction);
                }
            }
        }
        // Handle select menu interactions
        else if (interaction.isStringSelectMenu()) {
            const menuId = interaction.customId;
            
            // Handle select menu for troubleshooting
            if (menuId.startsWith('troubleshoot_')) {
                const command = interaction.client.commands.get('troubleshoot');
                if (command && command.handleSelectMenu) {
                    await command.handleSelectMenu(interaction);
                }
            }
        }
    }
};
