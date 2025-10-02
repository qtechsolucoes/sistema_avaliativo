// src/utils/auth.js - SISTEMA DE AUTENTICAÇÃO SEGURO

import { logService } from '../services/logService.js';

/**
 * Sistema de autenticação seguro com proteção contra ataques
 */

class SecureAuth {
    constructor() {
        this.maxAttempts = 3;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutos
        this.attemptsKey = 'auth_attempts';
        this.lockoutKey = 'auth_lockout';

        // Hashes seguros das senhas (gerados com SHA-256)
        // Senhas atuais: admin123 / unlock123
        this.adminPasswordHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'; // 'admin123'
        this.unlockPasswordHash = '57c3403f84f921ade3dbc0c6059501c87c5d3b6b04fa6635c709c3a0c1c5e7d1'; // 'unlock123'

        // Rate limiting
        this.attempts = this.getAttempts();
        this.lockoutTime = this.getLockoutTime();
    }

    /**
     * Gera hash SHA-256 de uma string
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Verifica se o dispositivo está em lockout
     */
    isLockedOut() {
        if (this.lockoutTime && Date.now() < this.lockoutTime) {
            const remainingTime = Math.ceil((this.lockoutTime - Date.now()) / 1000 / 60);
            return {
                locked: true,
                remainingMinutes: remainingTime
            };
        }
        return { locked: false };
    }

    /**
     * Obtém número de tentativas falhadas
     */
    getAttempts() {
        return parseInt(localStorage.getItem(this.attemptsKey) || '0');
    }

    /**
     * Obtém tempo de lockout
     */
    getLockoutTime() {
        const lockout = localStorage.getItem(this.lockoutKey);
        return lockout ? parseInt(lockout) : null;
    }

    /**
     * Registra tentativa falhada
     */
    recordFailedAttempt() {
        this.attempts++;
        localStorage.setItem(this.attemptsKey, this.attempts.toString());

        if (this.attempts >= this.maxAttempts) {
            this.lockoutTime = Date.now() + this.lockoutDuration;
            localStorage.setItem(this.lockoutKey, this.lockoutTime.toString());
            localStorage.removeItem(this.attemptsKey);

            logService.warn('Dispositivo bloqueado por tentativas excessivas', {
                attempts: this.attempts,
                lockoutDuration: this.lockoutDuration
            });
        }
    }

    /**
     * Limpa tentativas após sucesso
     */
    clearAttempts() {
        localStorage.removeItem(this.attemptsKey);
        localStorage.removeItem(this.lockoutKey);
        this.attempts = 0;
        this.lockoutTime = null;
    }

    /**
     * Verifica senha de administrador
     */
    async verifyAdminPassword(password) {
        if (!password) return false;

        const lockStatus = this.isLockedOut();
        if (lockStatus.locked) {
            throw new Error(`Muitas tentativas falhas. Tente novamente em ${lockStatus.remainingMinutes} minutos.`);
        }

        try {
            const hashedInput = await this.hashPassword(password);
            const isValid = hashedInput === this.adminPasswordHash;

            if (isValid) {
                this.clearAttempts();
                logService.info('Autenticação de admin bem-sucedida');
                return true;
            } else {
                this.recordFailedAttempt();
                const remaining = this.maxAttempts - this.attempts;

                if (remaining > 0) {
                    logService.warn(`Tentativa de autenticação falhou. ${remaining} tentativas restantes`);
                    throw new Error(`Senha incorreta. ${remaining} tentativa(s) restante(s).`);
                } else {
                    throw new Error('Muitas tentativas incorretas. Dispositivo bloqueado por 15 minutos.');
                }
            }
        } catch (error) {
            if (error.message.includes('tentativas')) {
                throw error;
            }
            logService.error('Erro na verificação de senha', error);
            throw new Error('Erro interno na autenticação');
        }
    }

    /**
     * Verifica senha de desbloqueio
     */
    async verifyUnlockPassword(password) {
        if (!password) return false;

        try {
            const hashedInput = await this.hashPassword(password);
            const isValidAdmin = hashedInput === this.adminPasswordHash;
            const isValidUnlock = hashedInput === this.unlockPasswordHash;

            if (isValidAdmin || isValidUnlock) {
                this.clearAttempts();
                logService.info('Desbloqueio bem-sucedido');
                return true;
            }

            return false;
        } catch (error) {
            logService.error('Erro na verificação de desbloqueio', error);
            return false;
        }
    }

    /**
     * Gera token de sessão seguro
     */
    generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Valida token de sessão
     */
    validateSessionToken(token) {
        if (!token || typeof token !== 'string' || token.length !== 64) {
            return false;
        }

        // Verifica se é hexadecimal válido
        return /^[a-f0-9]{64}$/i.test(token);
    }

    /**
     * Define configuração de senhas para desenvolvimento
     */
    async setDevPasswords(adminPassword, unlockPassword) {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            this.adminPasswordHash = await this.hashPassword(adminPassword);
            this.unlockPasswordHash = await this.hashPassword(unlockPassword);
            console.warn('⚠️ Senhas de desenvolvimento definidas. NÃO USE EM PRODUÇÃO!');
            return true;
        }
        return false;
    }

    /**
     * Função de debug para testar hashes de senhas
     */
    async debugPasswordHash(password) {
        const hash = await this.hashPassword(password);
        console.log(`Senha: "${password}" → Hash: ${hash}`);
        console.log('Hash admin atual:', this.adminPasswordHash);
        console.log('Hash unlock atual:', this.unlockPasswordHash);
        return hash;
    }

    /**
     * Função para resetar lockout manualmente
     */
    resetLockout() {
        this.clearAttempts();
        console.log('✅ Lockout resetado. Tentativas de login liberadas.');
        return true;
    }
}

// Exporta instância singleton
export const secureAuth = new SecureAuth();

// Funções utilitárias para compatibilidade
export async function verifyAdminPassword(password) {
    return secureAuth.verifyAdminPassword(password);
}

export async function verifyUnlockPassword(password) {
    return secureAuth.verifyUnlockPassword(password);
}

export function isAuthLockedOut() {
    return secureAuth.isLockedOut();
}

export function generateSessionToken() {
    return secureAuth.generateSessionToken();
}

export function validateSessionToken(token) {
    return secureAuth.validateSessionToken(token);
}

// Funções de debug para desenvolvimento
export async function debugPasswordHash(password) {
    return secureAuth.debugPasswordHash(password);
}

export function resetAuthLockout() {
    return secureAuth.resetLockout();
}

// Disponibiliza globalmente para debug
if (typeof window !== 'undefined') {
    window.debugPasswordHash = debugPasswordHash;
    window.resetAuthLockout = resetAuthLockout;
}