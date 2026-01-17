const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseHandler {
    constructor(dbPath = './data/bot.db') {
        // Ensure data directory exists
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new Database(dbPath);
        this.initTables();
    }

    initTables() {
        // User authorization table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS user_auth (
                user_id TEXT PRIMARY KEY,
                authorized INTEGER DEFAULT 0,
                authorized_at DATETIME,
                revoked_at DATETIME
            )
        `);

        // Server configuration table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS server_config (
                guild_id TEXT PRIMARY KEY,
                log_channel_id TEXT,
                support_role_id TEXT,
                admin_role_id TEXT,
                auto_analysis INTEGER DEFAULT 1,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Log uploads tracking
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS log_uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_size INTEGER,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                analysis_result TEXT
            )
        `);
    }

    // User Authorization Methods
    authorizeUser(userId) {
        const stmt = this.db.prepare(`
            INSERT INTO user_auth (user_id, authorized, authorized_at)
            VALUES (?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                authorized = 1,
                authorized_at = CURRENT_TIMESTAMP,
                revoked_at = NULL
        `);
        return stmt.run(userId);
    }

    revokeUser(userId) {
        const stmt = this.db.prepare(`
            UPDATE user_auth
            SET authorized = 0, revoked_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `);
        return stmt.run(userId);
    }

    isUserAuthorized(userId) {
        const stmt = this.db.prepare('SELECT authorized FROM user_auth WHERE user_id = ?');
        const result = stmt.get(userId);
        return result ? result.authorized === 1 : false;
    }

    // Server Configuration Methods
    setServerConfig(guildId, config) {
        const stmt = this.db.prepare(`
            INSERT INTO server_config (guild_id, log_channel_id, support_role_id, admin_role_id, auto_analysis)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET
                log_channel_id = COALESCE(excluded.log_channel_id, log_channel_id),
                support_role_id = COALESCE(excluded.support_role_id, support_role_id),
                admin_role_id = COALESCE(excluded.admin_role_id, admin_role_id),
                auto_analysis = COALESCE(excluded.auto_analysis, auto_analysis),
                updated_at = CURRENT_TIMESTAMP
        `);
        return stmt.run(
            guildId,
            config.logChannelId || null,
            config.supportRoleId || null,
            config.adminRoleId || null,
            config.autoAnalysis !== undefined ? (config.autoAnalysis ? 1 : 0) : null
        );
    }

    getServerConfig(guildId) {
        const stmt = this.db.prepare('SELECT * FROM server_config WHERE guild_id = ?');
        return stmt.get(guildId);
    }

    // Log Upload Tracking
    logUpload(userId, guildId, fileName, fileSize, analysisResult = null) {
        const stmt = this.db.prepare(`
            INSERT INTO log_uploads (user_id, guild_id, file_name, file_size, analysis_result)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(userId, guildId, fileName, fileSize, analysisResult);
    }

    getUserUploads(userId, limit = 10) {
        const stmt = this.db.prepare(`
            SELECT * FROM log_uploads
            WHERE user_id = ?
            ORDER BY uploaded_at DESC
            LIMIT ?
        `);
        return stmt.all(userId, limit);
    }

    close() {
        this.db.close();
    }
}

module.exports = DatabaseHandler;
