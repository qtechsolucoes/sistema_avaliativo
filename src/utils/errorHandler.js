// src/utils/errorHandler.js - Tratamento de erros centralizado e seguro
import { logService } from '../services/logService.js';
import { SafeNotification } from './sanitizer.js';

class ErrorHandler {
    constructor() {
        this.setupGlobalHandlers();
    }
    
    setupGlobalHandlers() {
        // Captura erros não tratados
        window.addEventListener('error', (event) => {
            this.handleError(event.error, 'Global Error');
            event.preventDefault();
        });
        
        // Captura rejeições de promises não tratadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Unhandled Promise Rejection');
            event.preventDefault();
        });
    }
    
    handleError(error, context = 'Unknown') {
        // Log do erro
        logService.error(`Erro em ${context}`, {
            message: error?.message || 'Erro desconhecido',
            stack: error?.stack,
            context
        });
        
        // Notificação ao usuário baseada no tipo de erro
        const userMessage = this.getUserMessage(error);
        this.notifyUser(userMessage);
        
        // Envia para servidor em produção
        if (this.isProduction()) {
            this.reportToServer(error, context);
        }
    }
    
    getUserMessage(error) {
        // Mapeamento de erros conhecidos para mensagens amigáveis
        const errorMap = {
            'NetworkError': 'Erro de conexão. Verifique sua internet.',
            'ValidationError': 'Dados inválidos. Verifique as informações.',
            'AuthError': 'Erro de autenticação. Faça login novamente.',
            'ServerError': 'Erro no servidor. Tente novamente mais tarde.',
            'NotFoundError': 'Recurso não encontrado.'
        };
        
        const errorType = error?.type || error?.name || 'Unknown';
        return errorMap[errorType] || 'Ocorreu um erro. Tente novamente.';
    }
    
    notifyUser(message) {
        // Usa SafeNotification para evitar XSS
        SafeNotification.createError('Erro', message, 5000);
    }
    
    async reportToServer(error, context) {
        try {
            // Implementar envio para servidor de erros
            // await fetch('/api/errors', { ... });
        } catch {
            // Falha silenciosa
        }
    }
    
    isProduction() {
        return window.location.hostname !== 'localhost' && 
               !window.location.hostname.startsWith('127.');
    }
}

export const errorHandler = new ErrorHandler();