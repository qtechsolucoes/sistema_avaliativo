// src/teacher/teacherAuth.js - Sistema de autenticação do professor
import { showScreen } from '../navigation.js';
import { logService } from '../services/logService.js';

let adminPassword = "admin123";

export function initializeAuth(password) {
    if (password) {
        adminPassword = password;
        logService.info('Senha do administrador configurada');
    }
    return { adminPassword };
}

export function showTeacherArea() {
    const password = prompt("Digite a senha de acesso do professor:");
    
    if (password === adminPassword) {
        logService.info('Acesso autorizado à área do professor');
        showScreen('teacherArea');
        return true;
    } else if (password !== null) {
        logService.warn('Tentativa de acesso com senha incorreta');
        alert("Senha incorreta.");
        return false;
    }
    return false;
}

export function verifyTeacherPassword(password) {
    return password === adminPassword;
}