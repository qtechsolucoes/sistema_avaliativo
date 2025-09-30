// src/services/offlineSubmissionService.js
// Serviço para enviar resultados ao servidor local via rede

import { logService } from './logService.js';

/**
 * Serviço responsável por enviar resultados ao servidor local
 * quando operando em modo offline (HTML standalone nos Chromebooks)
 */
export class OfflineSubmissionService {
    constructor() {
        // Tenta carregar configuração do servidor se existir
        this.config = window.OFFLINE_SERVER_CONFIG || {
            serverIP: "192.168.137.1",
            serverPort: 3000,
            timeout: 5000,
            maxRetries: 3,
            retryDelay: 2000
        };
    }

    /**
     * Envia resultado ao servidor local via POST
     * @param {Object} submissionData - Dados da submissão
     * @returns {Promise<Object>} - Resultado do envio
     */
    async submitToServer(submissionData) {
        const url = `http://${this.config.serverIP}:${this.config.serverPort}/submit-result`;

        logService.info('Tentando enviar resultado ao servidor local', { url });

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submissionData),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Servidor retornou status ${response.status}`);
                }

                const result = await response.json();

                logService.info('Resultado enviado com sucesso ao servidor', {
                    filename: result.filename,
                    attempt
                });

                return {
                    success: true,
                    synced: true,
                    method: 'network',
                    details: `Enviado ao servidor: ${result.filename}`
                };

            } catch (error) {
                logService.warn(`Tentativa ${attempt} falhou`, {
                    error: error.message,
                    url
                });

                // Se não é a última tentativa, aguarda antes de tentar novamente
                if (attempt < this.config.maxRetries) {
                    await this.sleep(this.config.retryDelay);
                }
            }
        }

        // Se todas as tentativas falharam, salva localmente como fallback
        logService.error('Todas as tentativas de envio falharam. Salvando localmente.');
        return this.saveToLocalStorage(submissionData);
    }

    /**
     * Salva resultado no localStorage como fallback
     * @param {Object} submissionData - Dados da submissão
     * @returns {Object} - Resultado do salvamento
     */
    saveToLocalStorage(submissionData) {
        try {
            const localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');

            // Verifica duplicatas
            const isDuplicate = localResults.some(r =>
                r.studentId === submissionData.studentId &&
                r.assessmentId === submissionData.assessmentId
            );

            if (isDuplicate) {
                return {
                    success: false,
                    synced: false,
                    error: 'duplicate_local',
                    details: 'Resultado já existe localmente'
                };
            }

            const dataWithTimestamp = {
                ...submissionData,
                localTimestamp: new Date().toISOString()
            };

            localResults.push(dataWithTimestamp);
            localStorage.setItem('pending_results', JSON.stringify(localResults));

            logService.info('Resultado salvo no localStorage como fallback');

            return {
                success: true,
                synced: false,
                error: 'offline',
                details: 'Salvo localmente (servidor inacessível)'
            };

        } catch (error) {
            logService.critical('Falha ao salvar no localStorage', { error });
            return {
                success: false,
                synced: false,
                error: 'storage_failed',
                details: error.message
            };
        }
    }

    /**
     * Verifica se o servidor está acessível
     * @returns {Promise<boolean>}
     */
    async checkServerStatus() {
        const url = `http://${this.config.serverIP}:${this.config.serverPort}/status`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                logService.info('Servidor acessível', data);
                return true;
            }

            return false;

        } catch (error) {
            logService.warn('Servidor não acessível', { error: error.message });
            return false;
        }
    }

    /**
     * Helper para aguardar
     * @param {number} ms - Milissegundos
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Exporta instância única
export const offlineSubmissionService = new OfflineSubmissionService();
