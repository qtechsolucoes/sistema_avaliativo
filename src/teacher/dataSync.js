// src/teacher/dataSync.js - VERSÃO CORRIGIDA E COMPLETA

import { saveSubmission } from '../database.js';
import { dom } from '../state.js';
import { logService } from '../services/logService.js';

export class DataSync {
    constructor(dashboardManager) {
        // Armazena a referência ao dashboard para poder atualizá-lo após a importação
        this.dashboardManager = dashboardManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (dom.teacher.importInput) {
            dom.teacher.importInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
    }

    /**
     * Coleta os resultados pendentes do localStorage e inicia o download de um arquivo JSON.
     */
    exportResults() {
        try {
            const results = JSON.parse(localStorage.getItem('pending_results') || '[]');
            if (results.length === 0) {
                alert("Não há resultados locais pendentes para exportar.");
                return;
            }

            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    totalResults: results.length,
                    version: "2.0.0"
                },
                results: results
            };

            this.downloadJSON(exportData, `resultados_pendentes_${new Date().toISOString().split('T')[0]}.json`);
            this.updateSyncStatus(`${results.length} resultados exportados com sucesso!`, 'green');
            logService.info('Resultados pendentes exportados', { count: results.length });

        } catch (error) {
            logService.error('Erro na exportação de resultados.', error);
            this.updateSyncStatus("Erro ao exportar resultados.", 'red');
        }
    }

    /**
     * Dispara o clique no input de arquivo oculto para o usuário selecionar um arquivo.
     */
    importResults() {
        if (dom.teacher.importInput) {
            dom.teacher.importInput.click();
        }
    }

    /**
     * Lida com o arquivo selecionado pelo usuário, lê e processa os resultados.
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.updateSyncStatus("Processando arquivo...", '#64748b');

        try {
            const fileContent = await this.readFile(file);
            const data = JSON.parse(fileContent);

            const resultsToProcess = data.results || (Array.isArray(data) ? data : null);
            if (!resultsToProcess) {
                throw new Error("Formato de arquivo inválido. Nenhum resultado encontrado.");
            }

            await this.processImportedResults(resultsToProcess);

        } catch (error) {
            logService.error('Erro na importação', { message: error.message });
            this.updateSyncStatus(`Erro: ${error.message}`, 'red');
        } finally {
            event.target.value = ''; // Limpa o input
        }
    }

    /**
     * Itera sobre os resultados do arquivo importado e tenta salvá-los um a um.
     */
    async processImportedResults(results) {
        if (results.length === 0) {
            this.updateSyncStatus("Arquivo não contém resultados para importar.", 'orange');
            return;
        }

        this.updateSyncStatus(`Importando ${results.length} resultados...`, '#64748b');
        let successCount = 0, errorCount = 0, duplicateCount = 0;

        for (const result of results) {
            // Mapeia apenas os campos essenciais que a função saveSubmission espera.
            // Isso evita que campos extras do JSON (metadados) causem erros.
            const submissionData = {
                studentId: result.studentId,
                assessmentId: result.assessmentId,
                score: result.score,
                totalQuestions: result.totalQuestions,
                totalDuration: result.totalDuration,
                answerLog: result.answerLog || [],
                // Passa metadados que serão usados apenas no salvamento offline, se necessário
                studentName: result.studentName,
                assessmentTitle: result.assessmentTitle,
                grade: result.grade,
                classId: result.classId,
                className: result.className
            };

            const saveResult = await saveSubmission(submissionData);

            if (saveResult.success) {
                successCount++;
            } else if (saveResult.error === 'duplicate' || saveResult.error === 'duplicate_local') {
                duplicateCount++;
            } else {
                errorCount++;
                logService.warn('Erro ao importar resultado individual.', { error: saveResult.details, result });
            }
        }

        const message = `Concluído: ${successCount} salvos, ${duplicateCount} já existentes, ${errorCount} erros.`;
        this.updateSyncStatus(message, errorCount > 0 ? 'orange' : 'green');
        logService.info('Processo de importação finalizado.', { total: results.length, success: successCount, duplicates: duplicateCount, errors: errorCount });

        // Se algum resultado foi importado com sucesso, atualiza o dashboard
        if (this.dashboardManager && successCount > 0) {
            this.dashboardManager.show();
        }
    }
    
    // --- Funções Auxiliares ---

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error("Falha ao ler o arquivo."));
            reader.readAsText(file);
        });
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    updateSyncStatus(message, color) {
        if (dom.teacher.syncStatus) {
            dom.teacher.syncStatus.textContent = message;
            dom.teacher.syncStatus.style.color = color;
        }
    }
}