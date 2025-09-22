// src/teacher/teacherAuth.js - Sistema de autenticação seguro do professor
import { showScreen } from '../navigation.js';
import { logService } from '../services/logService.js';
import { SafeNotification } from '../utils/sanitizer.js';

let verifyPasswordFunction = null;

export function initializeAuth(passwordVerifier) {
    if (typeof passwordVerifier === 'function') {
        verifyPasswordFunction = passwordVerifier;
        logService.info('Sistema de autenticação seguro configurado');
    } else {
        logService.error('Verificador de senha inválido fornecido');
    }
    return { configured: !!verifyPasswordFunction };
}

export async function showTeacherArea() {
    if (!verifyPasswordFunction) {
        SafeNotification.createError(
            'Erro de Configuração',
            'Sistema de autenticação não configurado corretamente.'
        );
        return false;
    }

    const password = prompt("Digite a senha de acesso do professor:");

    if (password === null) {
        return false; // Usuário cancelou
    }

    try {
        const isValid = await verifyPasswordFunction(password);

        if (isValid) {
            logService.info('Acesso autorizado à área do professor');
            SafeNotification.createSuccess(
                'Acesso Autorizado',
                'Bem-vindo à área do professor!'
            );
            showScreen('teacherArea');
            return true;
        }

    } catch (error) {
        SafeNotification.createError(
            'Erro de Autenticação',
            error.message
        );
        logService.warn('Tentativa de acesso falhou', { error: error.message });
    }

    return false;
}

export async function verifyTeacherPassword(password) {
    if (!verifyPasswordFunction) {
        throw new Error('Sistema de autenticação não configurado');
    }

    try {
        return await verifyPasswordFunction(password);
    } catch (error) {
        logService.error('Erro na verificação de senha do professor', error);
        throw error;
    }
}