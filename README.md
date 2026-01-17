# 🚔 LSPDFR Helper Bot

A feature-rich Discord bot designed to help LSPDFR (LSPD First Response for GTA V) users troubleshoot issues, analyze log files, and get instant support.

![Discord](https://img.shields.io/badge/Discord.js-v14-blue)
![Node](https://img.shields.io/badge/Node.js-16+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🔐 Authorization System
- User authorization for enhanced features
- Secure token-based access control
- Easy authorization management with `/authorize` and `/revoke`

### 📁 Automatic Log Analysis
- **Upload & Analyze**: Simply drag and drop your log files into Discord
- **Smart Detection**: Automatically identifies common LSPDFR errors
- **Instant Feedback**: Get immediate suggestions and solutions
- **Supported Files**: RagePluginHook.log, ScriptHookV.log, asiloader.log, ELS.log, LSPDFR.log, crash dumps

### 🔍 Comprehensive Error Database
- **10+ Error Codes**: Detailed information on common LSPDFR issues
- **Search by Keyword**: Find errors quickly with `/error` command
- **Solution Guides**: Step-by-step fixes for each error type
- **Error Categories**: Memory issues, version mismatches, plugin conflicts, and more

### 💡 Interactive Troubleshooting
- **Guided Wizard**: Step-by-step troubleshooting with `/troubleshoot`
- **Category-Based**: Game won't start, crashes, performance, plugins, features
- **Smart Questions**: Diagnostic questions to pinpoint issues
- **Instant Solutions**: Get relevant fixes based on your answers

### 📚 Knowledge Base
- **Plugin Directory**: Browse 15+ recommended LSPDFR plugins with `/plugins`
- **Version Information**: Check latest LSPDFR, RPH, and ScriptHookV versions with `/versions`
- **System Requirements**: View minimum and recommended specs with `/requirements`
- **Setup Guide**: Complete installation walkthrough with `/setup`
- **Compatibility Checker**: Check mod compatibility with `/compatibility`
- **Fix Guides**: 10+ detailed fix guides with `/fix`

### 🛡️ Server Management
- **Admin Controls**: Configure bot settings with `/config`
- **Log Channels**: Set dedicated channels for log analysis
- **Role Management**: Assign support and admin roles
- **Auto-Analysis Toggle**: Enable/disable automatic log scanning

### 🎨 Beautiful UI/UX
- **LSPDFR Themed**: Police blue color scheme throughout
- **Rich Embeds**: Clean, professional message formatting
- **Interactive Menus**: Buttons and select menus for easy navigation
- **Helpful Icons**: Visual indicators for errors, warnings, and success

## 🚀 Installation

### Prerequisites
- Node.js 16.9.0 or higher
- A Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- Discord Application with bot permissions

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/YoBoyCols/DIscord-OAUTH-Bot.git
cd DIscord-OAUTH-Bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
   
Create a `.env` file in the root directory:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id
GUILD_ID=your_test_server_id (optional, for faster command updates)

# Optional settings
LOG_CHANNEL_ID=
ADMIN_ROLE_ID=
SUPPORT_ROLE_ID=
ENABLE_AUTO_ANALYSIS=true
MAX_LOG_SIZE_MB=10
DATABASE_PATH=./data/bot.db
```

4. **Start the bot**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## 🎮 Commands

### 🔐 Authorization
| Command | Description |
|---------|-------------|
| `/authorize` | Grant bot access for enhanced features |
| `/revoke` | Revoke bot access |

### 📁 Log Management
| Command | Description |
|---------|-------------|
| `/sendlogs` | Get instructions for uploading log files |

### 🔍 Troubleshooting
| Command | Description |
|---------|-------------|
| `/troubleshoot` | Interactive troubleshooting wizard |
| `/error <code>` | Look up specific error codes (RPH001, SHV001, etc.) |
| `/fix <issue>` | Get fix guides for common issues |

### 🎮 LSPDFR Information
| Command | Description |
|---------|-------------|
| `/plugins [category]` | List recommended plugins (Essential, Callouts, etc.) |
| `/versions` | Show latest LSPDFR, RPH, ScriptHookV versions |
| `/requirements` | View system requirements |
| `/setup` | Complete LSPDFR installation guide |
| `/compatibility <item>` | Check mod compatibility |

### 🛡️ Administration
| Command | Description |
|---------|-------------|
| `/config logchannel <channel>` | Set log upload channel |
| `/config supportrole <role>` | Set support role |
| `/config adminrole <role>` | Set admin role |
| `/config autoanalysis <true/false>` | Toggle auto log analysis |
| `/config view` | View current server settings |

### 📚 General
| Command | Description |
|---------|-------------|
| `/help` | Show all commands and bot information |

## 📖 Usage Examples

### Analyzing Log Files
1. Simply drag and drop your log files into any channel
2. The bot automatically scans for errors and provides feedback
3. Get error codes and use `/error <code>` for detailed solutions

### Troubleshooting
1. Run `/troubleshoot`
2. Select your issue category from the menu
3. Answer the diagnostic questions
4. Get customized solutions instantly

### Finding Plugins
1. Use `/plugins` to see all plugins
2. Filter by category: `/plugins category:Callouts`
3. Get download links and descriptions

## 🗂️ Project Structure

```
/
├── src/
│   ├── index.js                 # Main bot entry point
│   ├── commands/                # Slash commands
│   │   ├── authorize.js
│   │   ├── revoke.js
│   │   ├── sendlogs.js
│   │   ├── troubleshoot.js
│   │   ├── error.js
│   │   ├── fix.js
│   │   ├── plugins.js
│   │   ├── versions.js
│   │   ├── setup.js
│   │   ├── requirements.js
│   │   ├── compatibility.js
│   │   ├── config.js
│   │   └── help.js
│   ├── events/                  # Discord event handlers
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   └── messageCreate.js
│   ├── utils/                   # Utility modules
│   │   ├── database.js          # SQLite database handler
│   │   ├── logParser.js         # Log file analysis
│   │   ├── errorDatabase.js     # Error/fix lookup
│   │   └── embedBuilder.js      # Embed creation helpers
│   └── data/                    # Static data files
│       ├── errors.json          # Error code database
│       ├── plugins.json         # Plugin information
│       └── fixes.json           # Common fix guides
├── data/                        # Runtime data (created automatically)
│   └── bot.db                   # SQLite database
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🔧 Configuration

### Bot Permissions Required
- Read Messages/View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Use Slash Commands

### Invite Link Template
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=412317240384&scope=bot%20applications.commands
```

## 🗄️ Database

The bot uses SQLite for data storage:
- **user_auth**: Tracks user authorizations
- **server_config**: Stores per-server settings
- **log_uploads**: Records log file analyses

Database is automatically created on first run at `./data/bot.db`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024 YoBoyCols

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- **LSPDFR Team** - For creating the amazing LSPD First Response mod
- **Discord.js** - For the excellent Discord API wrapper
- **LCPDFR Community** - For support and inspiration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YoBoyCols/DIscord-OAUTH-Bot/issues)
- **Discord**: Use `/help` in the bot for command help
- **LSPDFR**: Visit [LCPDFR.com](https://www.lcpdfr.com/) for LSPDFR support

## 🔮 Future Features

- [ ] Thread-based support ticket system
- [ ] Plugin update notifications
- [ ] Advanced log pattern recognition
- [ ] Multi-language support
- [ ] User statistics and analytics
- [ ] Integration with LCPDFR.com API
- [ ] Custom callout recommendations
- [ ] Automatic crash dump analysis

---

**Made with ❤️ for the LSPDFR community**
