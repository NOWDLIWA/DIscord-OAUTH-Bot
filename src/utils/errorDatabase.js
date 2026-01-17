const errorsData = require('../data/errors.json');
const pluginsData = require('../data/plugins.json');
const fixesData = require('../data/fixes.json');

class ErrorDatabase {
    constructor() {
        this.errors = errorsData.errors;
        this.plugins = pluginsData.plugins;
        this.fixes = fixesData.fixes;
    }

    /**
     * Get error by code
     * @param {string} code - Error code (e.g., 'RPH001')
     * @returns {Object|null} Error object or null
     */
    getError(code) {
        return this.errors.find(e => e.code.toLowerCase() === code.toLowerCase());
    }

    /**
     * Search errors by keyword
     * @param {string} query - Search query
     * @returns {Array} Matching errors
     */
    searchErrors(query) {
        const searchTerm = query.toLowerCase();
        return this.errors.filter(error => {
            return error.name.toLowerCase().includes(searchTerm) ||
                   error.description.toLowerCase().includes(searchTerm) ||
                   error.code.toLowerCase().includes(searchTerm) ||
                   error.keywords.some(k => k.toLowerCase().includes(searchTerm));
        });
    }

    /**
     * Get all errors
     * @returns {Array} All errors
     */
    getAllErrors() {
        return this.errors;
    }

    /**
     * Get fix by issue key
     * @param {string} issueKey - Issue identifier
     * @returns {Object|null} Fix object or null
     */
    getFix(issueKey) {
        return this.fixes.find(f => f.issue === issueKey);
    }

    /**
     * Search fixes by keyword
     * @param {string} query - Search query
     * @returns {Array} Matching fixes
     */
    searchFixes(query) {
        const searchTerm = query.toLowerCase();
        return this.fixes.filter(fix => {
            return fix.title.toLowerCase().includes(searchTerm) ||
                   fix.issue.toLowerCase().includes(searchTerm) ||
                   fix.steps.some(s => s.toLowerCase().includes(searchTerm));
        });
    }

    /**
     * Get all fixes
     * @returns {Array} All fixes
     */
    getAllFixes() {
        return this.fixes;
    }

    /**
     * Get plugin by name
     * @param {string} name - Plugin name
     * @returns {Object|null} Plugin object or null
     */
    getPlugin(name) {
        return this.plugins.find(p => 
            p.name.toLowerCase() === name.toLowerCase()
        );
    }

    /**
     * Get plugins by category
     * @param {string} category - Category name
     * @returns {Array} Plugins in category
     */
    getPluginsByCategory(category) {
        if (category.toLowerCase() === 'all') {
            return this.plugins;
        }
        return this.plugins.filter(p => 
            p.category.toLowerCase() === category.toLowerCase()
        );
    }

    /**
     * Get all plugin categories
     * @returns {Array} Unique categories
     */
    getCategories() {
        return [...new Set(this.plugins.map(p => p.category))];
    }

    /**
     * Get essential plugins
     * @returns {Array} Required plugins
     */
    getEssentialPlugins() {
        return this.plugins.filter(p => p.required);
    }

    /**
     * Search plugins by name or description
     * @param {string} query - Search query
     * @returns {Array} Matching plugins
     */
    searchPlugins(query) {
        const searchTerm = query.toLowerCase();
        return this.plugins.filter(plugin => {
            return plugin.name.toLowerCase().includes(searchTerm) ||
                   plugin.description.toLowerCase().includes(searchTerm) ||
                   plugin.category.toLowerCase().includes(searchTerm);
        });
    }

    /**
     * Get compatibility information
     * @param {string} item - Item to check compatibility for
     * @returns {Object} Compatibility info
     */
    getCompatibilityInfo(item) {
        // This is a simplified version - in production, you'd have a more comprehensive database
        const compatibilityData = {
            'lspdfr': {
                requires: ['RagePluginHook', 'ScriptHookV', 'GTA V (latest version)'],
                compatibleWith: ['ELS', 'ComputerPlus', 'Stop The Ped'],
                incompatibleWith: ['FiveM (cannot run simultaneously)'],
                notes: 'LSPDFR requires RagePluginHook to function. Ensure GTA V is up to date.'
            },
            'els': {
                requires: ['RagePluginHook', 'LSPDFR'],
                compatibleWith: ['Most vehicle mods with ELS support'],
                incompatibleWith: ['Vanilla siren mods', 'Other lighting systems'],
                notes: 'ELS requires properly configured XML files for each vehicle.'
            },
            'computerplus': {
                requires: ['RagePluginHook', 'LSPDFR'],
                compatibleWith: ['Most callout packs'],
                incompatibleWith: ['Other computer plugins like CompuLite (choose one)'],
                notes: 'ComputerPlus and CompuLite serve similar purposes. Use only one.'
            }
        };

        const key = item.toLowerCase();
        return compatibilityData[key] || {
            requires: ['Unknown'],
            compatibleWith: ['Check plugin documentation'],
            incompatibleWith: ['Unknown'],
            notes: 'Compatibility information not available for this item.'
        };
    }

    /**
     * Get LSPDFR version information
     * @returns {Object} Version information
     */
    getVersionInfo() {
        return {
            'LSPDFR': {
                version: '0.4.9',
                releaseDate: '2023',
                url: 'https://www.lcpdfr.com/downloads/gta5mods/g17media/7792-lspd-first-response/',
                notes: 'Check LCPDFR.com for the latest version'
            },
            'RagePluginHook': {
                version: '1.98+',
                releaseDate: '2023',
                url: 'https://ragepluginhook.net/',
                notes: 'Always use the latest version of RPH'
            },
            'ScriptHookV': {
                version: 'Varies',
                releaseDate: 'Updated regularly',
                url: 'http://www.dev-c.com/gtav/scripthookv/',
                notes: 'Must match your GTA V game version'
            },
            'GTA V': {
                version: 'Latest',
                releaseDate: 'Updated regularly',
                url: 'https://store.steampowered.com/app/271590/Grand_Theft_Auto_V/',
                notes: 'Keep GTA V updated, but note that updates may break mods temporarily'
            }
        };
    }
}

module.exports = ErrorDatabase;
