const errorsData = require('../data/errors.json');

class LogParser {
    constructor() {
        this.errors = errorsData.errors;
    }

    /**
     * Analyze a log file and detect common issues
     * @param {string} logContent - The content of the log file
     * @param {string} fileName - Name of the log file
     * @returns {Object} Analysis results with errors, warnings, and suggestions
     */
    analyzeLog(logContent, fileName) {
        const results = {
            fileName,
            errors: [],
            warnings: [],
            suggestions: [],
            detectedIssues: []
        };

        // Normalize log content
        const content = logContent.toLowerCase();

        // Detect file type
        const fileType = this.detectLogType(fileName);
        results.fileType = fileType;

        // Common error patterns
        this.detectCommonErrors(content, results);
        
        // Memory issues
        this.detectMemoryIssues(content, results);
        
        // Version mismatches
        this.detectVersionIssues(content, results);
        
        // Plugin conflicts
        this.detectPluginConflicts(content, results);
        
        // Missing dependencies
        this.detectMissingDependencies(content, results);

        // Crash indicators
        this.detectCrashes(content, results);

        // Match against known error database
        this.matchKnownErrors(content, results);

        // Generate suggestions based on findings
        this.generateSuggestions(results);

        return results;
    }

    detectLogType(fileName) {
        const name = fileName.toLowerCase();
        if (name.includes('ragepluginhook')) return 'RagePluginHook';
        if (name.includes('scripthookv')) return 'ScriptHookV';
        if (name.includes('asiloader')) return 'ASI Loader';
        if (name.includes('els')) return 'ELS';
        if (name.includes('lspdfr')) return 'LSPDFR';
        if (name.includes('crash')) return 'Crash Log';
        return 'Unknown';
    }

    detectCommonErrors(content, results) {
        // Exception patterns
        if (content.includes('exception') || content.includes('error')) {
            const exceptionMatches = content.match(/exception.*?[\r\n]/gi);
            if (exceptionMatches) {
                exceptionMatches.slice(0, 5).forEach(match => {
                    results.errors.push(match.trim());
                });
            }
        }

        // Failed to load patterns
        if (content.includes('failed to load') || content.includes('could not load')) {
            results.errors.push('Failed to load one or more components');
        }

        // Access violations
        if (content.includes('access violation') || content.includes('0xc0000005')) {
            results.errors.push('Access violation detected - possible memory corruption');
        }

        // DLL errors
        if (content.includes('dll not found') || content.includes('missing dll')) {
            results.errors.push('Missing DLL file(s) detected');
        }
    }

    detectMemoryIssues(content, results) {
        const memoryPatterns = [
            'out of memory',
            'memory allocation',
            'heap corruption',
            'insufficient memory',
            'err_mem'
        ];

        memoryPatterns.forEach(pattern => {
            if (content.includes(pattern)) {
                results.errors.push(`Memory issue detected: ${pattern}`);
                results.detectedIssues.push('MEM001');
            }
        });
    }

    detectVersionIssues(content, results) {
        const versionPatterns = [
            'version mismatch',
            'incompatible version',
            'outdated',
            'requires version',
            'wrong version'
        ];

        versionPatterns.forEach(pattern => {
            if (content.includes(pattern)) {
                results.warnings.push(`Version issue detected: ${pattern}`);
                results.detectedIssues.push('VER001');
            }
        });

        // Check for old GTA V version warnings
        if (content.includes('game version') || content.includes('build')) {
            results.warnings.push('Game version reference found - verify GTA V is up to date');
        }
    }

    detectPluginConflicts(content, results) {
        const conflictPatterns = [
            'conflict',
            'conflicting',
            'already loaded',
            'duplicate',
            'cannot load multiple'
        ];

        conflictPatterns.forEach(pattern => {
            if (content.includes(pattern)) {
                results.warnings.push(`Potential plugin conflict: ${pattern}`);
                results.detectedIssues.push('PLUGIN001');
            }
        });
    }

    detectMissingDependencies(content, results) {
        const depPatterns = [
            'dependency not found',
            'required file missing',
            'cannot find',
            'not installed',
            'prerequisite'
        ];

        depPatterns.forEach(pattern => {
            if (content.includes(pattern)) {
                results.errors.push(`Missing dependency: ${pattern}`);
                results.detectedIssues.push('DEP001');
            }
        });

        // Check for specific dependencies
        if (content.includes('scripthookv') && content.includes('not found')) {
            results.errors.push('ScriptHookV not found');
            results.detectedIssues.push('SHV001');
        }
    }

    detectCrashes(content, results) {
        const crashPatterns = [
            'crash',
            'fatal error',
            'stopped working',
            'terminated unexpectedly',
            'application error'
        ];

        crashPatterns.forEach(pattern => {
            if (content.includes(pattern)) {
                results.errors.push(`Crash indicator: ${pattern}`);
                results.detectedIssues.push('CRASH001');
            }
        });
    }

    matchKnownErrors(content, results) {
        this.errors.forEach(error => {
            const matched = error.keywords.some(keyword => 
                content.includes(keyword.toLowerCase())
            );

            if (matched && !results.detectedIssues.includes(error.code)) {
                results.detectedIssues.push(error.code);
            }
        });
    }

    generateSuggestions(results) {
        // Generate suggestions based on detected issues
        results.detectedIssues.forEach(issueCode => {
            const error = this.errors.find(e => e.code === issueCode);
            if (error && error.solutions) {
                error.solutions.forEach(solution => {
                    if (!results.suggestions.includes(solution)) {
                        results.suggestions.push(solution);
                    }
                });
            }
        });

        // Generic suggestions if no specific issues found
        if (results.errors.length > 0 && results.suggestions.length === 0) {
            results.suggestions.push(
                'Check RagePluginHook.log for more detailed error information',
                'Ensure all mods are updated to latest versions',
                'Try disabling plugins one by one to identify the problem'
            );
        }
    }

    /**
     * Get detailed information about a detected error
     * @param {string} errorCode - The error code (e.g., 'RPH001')
     * @returns {Object|null} Error details or null if not found
     */
    getErrorInfo(errorCode) {
        return this.errors.find(e => e.code === errorCode) || null;
    }

    /**
     * Search for errors by keyword
     * @param {string} keyword - Keyword to search for
     * @returns {Array} Matching errors
     */
    searchErrors(keyword) {
        const searchTerm = keyword.toLowerCase();
        return this.errors.filter(error => {
            return error.name.toLowerCase().includes(searchTerm) ||
                   error.description.toLowerCase().includes(searchTerm) ||
                   error.keywords.some(k => k.toLowerCase().includes(searchTerm));
        });
    }
}

module.exports = LogParser;
