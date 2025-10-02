// src/services/connectivityService.js
// Serviço de Detecção de Conectividade e Auto-Download de JSON

import { logService } from './logService.js';

/**
 * Serviço responsável por:
 * 1. Detectar se o usuário está online ou offline
 * 2. Quando offline, salvar automaticamente no localStorage
 * 3. Gerar e fazer download automático de arquivo JSON com os dados da prova
 */
export class ConnectivityService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.listeners = [];
        this.setupEventListeners();
    }

    /**
     * Configura listeners para mudanças de conectividade
     */
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            logService.info('Conectividade restaurada - sistema online');
            this.notifyListeners('online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            logService.warn('Conectividade perdida - sistema offline');
            this.notifyListeners('offline');
        });
    }

    /**
     * Adiciona listener para mudanças de conectividade
     * @param {Function} callback - Função a ser chamada quando conectividade mudar
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove listener
     * @param {Function} callback - Função a ser removida
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    /**
     * Notifica todos os listeners sobre mudança de conectividade
     * @param {string} status - 'online' ou 'offline'
     */
    notifyListeners(status) {
        this.listeners.forEach(callback => {
            try {
                callback(status, this.isOnline);
            } catch (error) {
                logService.error('Erro ao notificar listener de conectividade', { error });
            }
        });
    }

    /**
     * Verifica se está online
     * @returns {boolean}
     */
    checkOnline() {
        return navigator.onLine;
    }

    /**
     * Tenta fazer ping em um endpoint para confirmar conectividade real
     * @param {string} url - URL para testar (opcional)
     * @param {number} timeout - Timeout em ms (padrão: 5000)
     * @returns {Promise<boolean>}
     */
    async testConnectivity(url = null, timeout = 5000) {
        // Se não há URL específica, usa uma URL confiável
        const testUrl = url || 'https://www.google.com/favicon.ico';

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(testUrl, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            logService.debug('Teste de conectividade bem-sucedido');
            return true;

        } catch (error) {
            logService.debug('Teste de conectividade falhou', { error: error.message });
            return false;
        }
    }

    /**
     * Salva dados da submissão com detecção automática de conectividade
     * Se offline: salva no localStorage E faz download automático de JSON
     * Se online: retorna indicação para salvar no banco de dados
     *
     * @param {Object} submissionData - Dados da submissão
     * @returns {Promise<Object>} - Resultado do salvamento
     */
    async saveWithConnectivityDetection(submissionData) {
        const isReallyOnline = await this.testConnectivity();

        if (isReallyOnline) {
            logService.info('Sistema online - dados serão salvos no banco de dados');
            return {
                success: true,
                mode: 'online',
                shouldSaveToDatabase: true
            };
        } else {
            logService.warn('Sistema offline - salvando localmente e gerando arquivo JSON');

            // Salva no localStorage
            const localSaveResult = this.saveToLocalStorage(submissionData);

            // Gera e faz download do JSON automaticamente
            const downloadResult = this.downloadSubmissionJSON(submissionData);

            return {
                success: localSaveResult.success && downloadResult.success,
                mode: 'offline',
                shouldSaveToDatabase: false,
                localSave: localSaveResult,
                download: downloadResult
            };
        }
    }

    /**
     * Salva submissão no localStorage
     * @param {Object} submissionData - Dados da submissão
     * @returns {Object} - Resultado do salvamento
     */
    saveToLocalStorage(submissionData) {
        try {
            const localResults = JSON.parse(localStorage.getItem('offline_submissions') || '[]');

            // Verifica duplicatas
            const isDuplicate = localResults.some(r =>
                r.studentName === submissionData.studentName &&
                r.grade === submissionData.grade &&
                r.className === submissionData.className &&
                r.assessmentTitle === submissionData.assessmentTitle
            );

            if (isDuplicate) {
                logService.warn('Submissão duplicada detectada no localStorage');
                return {
                    success: false,
                    error: 'duplicate',
                    message: 'Esta prova já foi salva anteriormente'
                };
            }

            const dataWithTimestamp = {
                ...submissionData,
                savedAt: new Date().toISOString(),
                savedMode: 'offline'
            };

            localResults.push(dataWithTimestamp);
            localStorage.setItem('offline_submissions', JSON.stringify(localResults));

            logService.info('Submissão salva no localStorage', {
                studentName: submissionData.studentName,
                grade: submissionData.grade
            });

            return {
                success: true,
                message: 'Dados salvos no navegador com sucesso'
            };

        } catch (error) {
            logService.error('Erro ao salvar no localStorage', { error });
            return {
                success: false,
                error: 'storage_error',
                message: error.message
            };
        }
    }

    /**
     * Gera e faz download automático de arquivo JSON com os dados da submissão
     * @param {Object} submissionData - Dados da submissão
     * @returns {Object} - Resultado do download
     */
    downloadSubmissionJSON(submissionData) {
        try {
            // Prepara dados para o JSON
            const jsonData = {
                studentName: submissionData.studentName,
                grade: submissionData.grade,
                className: submissionData.className,
                assessmentTitle: submissionData.assessmentTitle || 'Avaliação',
                score: submissionData.score,
                totalQuestions: submissionData.totalQuestions,
                totalDuration: submissionData.totalDuration,
                answerLog: submissionData.answerLog || [],
                savedAt: new Date().toISOString(),
                savedMode: 'offline-auto-download',
                studentId: submissionData.studentId,
                assessmentId: submissionData.assessmentId,
                classId: submissionData.classId
            };

            // Converte para JSON formatado
            const jsonString = JSON.stringify(jsonData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Gera nome do arquivo
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const safeName = this.sanitizeFileName(submissionData.studentName || 'Aluno');
            const fileName = `prova_${safeName}_${submissionData.grade}${submissionData.className}_${timestamp}.json`;

            // Cria link temporário e faz download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;

            // Adiciona ao DOM temporariamente (necessário em alguns navegadores)
            document.body.appendChild(link);
            link.click();

            // Remove do DOM e libera memória
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

            logService.info('Arquivo JSON baixado automaticamente', { fileName });

            return {
                success: true,
                fileName,
                message: `Arquivo ${fileName} foi baixado automaticamente`
            };

        } catch (error) {
            logService.error('Erro ao fazer download do JSON', { error });
            return {
                success: false,
                error: 'download_error',
                message: error.message
            };
        }
    }

    /**
     * Remove caracteres especiais do nome do arquivo
     * @param {string} name - Nome a ser sanitizado
     * @returns {string} - Nome sanitizado
     */
    sanitizeFileName(name) {
        return name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-zA-Z0-9]/g, '_') // Substitui caracteres especiais por _
            .replace(/_+/g, '_') // Remove underscores duplicados
            .toLowerCase();
    }

    /**
     * Obtém todas as submissões salvas localmente
     * @returns {Array} - Array de submissões
     */
    getLocalSubmissions() {
        try {
            return JSON.parse(localStorage.getItem('offline_submissions') || '[]');
        } catch (error) {
            logService.error('Erro ao recuperar submissões locais', { error });
            return [];
        }
    }

    /**
     * Limpa submissões locais (após sincronização, por exemplo)
     * @param {Function} filterFn - Função de filtro (opcional)
     */
    clearLocalSubmissions(filterFn = null) {
        try {
            if (filterFn) {
                const submissions = this.getLocalSubmissions();
                const filtered = submissions.filter(filterFn);
                localStorage.setItem('offline_submissions', JSON.stringify(filtered));
                logService.info('Submissões locais filtradas', {
                    before: submissions.length,
                    after: filtered.length
                });
            } else {
                localStorage.removeItem('offline_submissions');
                logService.info('Todas as submissões locais foram removidas');
            }
        } catch (error) {
            logService.error('Erro ao limpar submissões locais', { error });
        }
    }

    /**
     * Retorna status da conectividade
     * @returns {Object}
     */
    getStatus() {
        return {
            isOnline: this.isOnline,
            browserOnline: navigator.onLine,
            timestamp: new Date().toISOString()
        };
    }
}

// Exporta instância única
export const connectivityService = new ConnectivityService();

// Log de inicialização
logService.info('ConnectivityService inicializado', {
    isOnline: connectivityService.isOnline
});
