// src/teacher/dataSync.js - Sistema de sincronização de dados
import { saveSubmission } from '../database.js';
import { dom } from '../state.js';
import { logService } from '../services/logService.js';

export class DataSync {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (dom.teacher.importInput) {
            dom.teacher.importInput.addEventListener('change', (e) => {
                this.handleFileUpload(e);
            });
        }
    }

    exportResults() {
        try {
            const results = this.getLocalResults();
            
            if (results.length === 0) {
                alert("Não há resultados locais para exportar.");
                return;
            }

            const exportData = this.prepareExportData(results);
            this.downloadJSON(exportData, this.generateFileName());
            
            this.updateSyncStatus(`${results.length} resultados exportados!`, 'green');
            logService.info('Resultados exportados', { count: results.length });
            
        } catch (error) {
            logService.error('Erro na exportação', error);
            this.updateSyncStatus("Erro ao exportar resultados.", 'red');
        }
    }

    importResults() {
        dom.teacher.importInput.click();
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        event.target.value = ''; // Reset input
        this.updateSyncStatus("Processando arquivo...", '#64748b');

        try {
            const fileContent = await this.readFile(file);
            const data = JSON.parse(fileContent);
            
            const results = this.extractResultsFromImport(data);
            await this.processImportedResults(results);
            
        } catch (error) {
            logService.error('Erro na importação', error);
            this.updateSyncStatus(`Erro: ${error.message}`, 'red');
        }
    }

    getLocalResults() {
        const results = localStorage.getItem('pending_results');
        return results ? JSON.parse(results) : [];
    }

    prepareExportData(results) {
        return {
            metadata: {
                exportDate: new Date().toISOString(),
                totalResults: results.length,
                exportedBy: 'Sistema de Avaliações',
                version: '2.0'
            },
            results: results
        };
    }

    generateFileName() {
        const timestamp = new Date().toISOString().split('T')[0];
        return `resultados_${timestamp}.json`;
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json;charset=utf-8' 
        });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    extractResultsFromImport(data) {
        if (data.results && Array.isArray(data.results)) {
            return data.results;
        }
        if (Array.isArray(data)) {
            return data;
        }
        throw new Error("Formato de arquivo não reconhecido");
    }

    async processImportedResults(results) {
        if (results.length === 0) {
            throw new Error("Nenhum resultado encontrado no arquivo");
        }

        this.updateSyncStatus(`Importando ${results.length} resultados...`, '#64748b');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const result of results) {
            try {
                const saveResult = await saveSubmission(result);
                if (saveResult.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
                logService.warn('Erro ao importar resultado individual', error);
            }
        }
        
        const message = `Importação concluída: ${successCount} sucesso, ${errorCount} erros`;
        this.updateSyncStatus(message, successCount > 0 ? 'green' : 'red');
        
        logService.info('Importação concluída', { 
            total: results.length, 
            success: successCount, 
            errors: errorCount 
        });
    }

    updateSyncStatus(message, color) {
        if (dom.teacher.syncStatus) {
            dom.teacher.syncStatus.textContent = message;
            dom.teacher.syncStatus.style.color = color;
        }
    }
}