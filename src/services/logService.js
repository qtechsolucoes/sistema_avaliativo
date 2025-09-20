// src/services/logService.js - Sistema de logs estruturado
class LogService {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevel = this.getLogLevel();
    }
    
    getLogLevel() {
        // Pode vir de config ou localStorage
        return localStorage.getItem('logLevel') || 'info';
    }
    
    log(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Adiciona ao array interno
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Console log baseado no nível
        if (this.shouldLog(level)) {
            const color = this.getLogColor(level);
            console.log(
                `%c[${level.toUpperCase()}] ${message}`,
                `color: ${color}; font-weight: bold`,
                data
            );
        }
        
        // Envia logs críticos para servidor (se configurado)
        if (level === 'error' || level === 'critical') {
            this.sendToServer(logEntry);
        }
    }
    
    shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error', 'critical'];
        const currentLevel = levels.indexOf(this.logLevel);
        const messageLevel = levels.indexOf(level);
        return messageLevel >= currentLevel;
    }
    
    getLogColor(level) {
        const colors = {
            debug: '#64748b',
            info: '#3b82f6',
            warn: '#eab308',
            error: '#ef4444',
            critical: '#991b1b'
        };
        return colors[level] || '#000000';
    }
    
    async sendToServer(logEntry) {
        // Implementar envio para servidor de logs se necessário
        try {
            // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) });
        } catch (error) {
            // Falha silenciosa para não criar loop
        }
    }
    
    debug(message, data) { this.log('debug', message, data); }
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    critical(message, data) { this.log('critical', message, data); }
    
    getLogs(level) {
        if (!level) return this.logs;
        return this.logs.filter(log => log.level === level);
    }
    
    exportLogs() {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

export const logService = new LogService();