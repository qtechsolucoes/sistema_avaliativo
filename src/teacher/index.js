// src/teacher/index.js - Exporta todas as funcionalidades do professor
import { initializeAuth, showTeacherArea } from './teacherAuth.js';
import { generateOfflineFile } from './offlineGenerator.js';
import { DataSync } from './dataSync.js';
import { DashboardManager } from './dashboard/index.js';
import { dom } from '../state.js';

class TeacherModule {
    constructor() {
        this.auth = null;
        this.dataSync = null;
        this.dashboard = null;
        this.isInitialized = false;
    }

    initialize(resetCallback, adminPassword = "admin123") {
        if (this.isInitialized) return;
        
        // Inicializa submódulos
        this.auth = initializeAuth(adminPassword);
        this.dataSync = new DataSync();
        this.dashboard = new DashboardManager();
        
        // Configura event listeners
        this.setupEventListeners(resetCallback);
        
        this.isInitialized = true;
        console.log('✅ Módulo do professor inicializado');
    }

    setupEventListeners(resetCallback) {
        // Autenticação
        if (dom.login.teacherLoginLink) {
            dom.login.teacherLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                showTeacherArea();
            });
        }

        // Navegação
        if (dom.teacher.backToStartFromAreaBtn) {
            dom.teacher.backToStartFromAreaBtn.addEventListener('click', resetCallback);
        }

        // Geração de arquivo offline
        if (dom.teacher.generateFileBtn) {
            dom.teacher.generateFileBtn.addEventListener('click', () => {
                generateOfflineFile(dom.teacher.syncStatus, dom.teacher.generateFileBtn);
            });
        }

        // Sincronização de dados
        if (dom.teacher.exportBtn) {
            dom.teacher.exportBtn.addEventListener('click', () => {
                this.dataSync.exportResults();
            });
        }

        if (dom.teacher.importBtn) {
            dom.teacher.importBtn.addEventListener('click', () => {
                this.dataSync.importResults();
            });
        }

        // Dashboard
        if (dom.teacher.viewDashboardBtn) {
            dom.teacher.viewDashboardBtn.addEventListener('click', () => {
                this.dashboard.show();
            });
        }
    }
}

// Exporta instância única
export const teacherModule = new TeacherModule();

// Função de inicialização para compatibilidade
export function initializeTeacherArea(resetCallback, adminPassword) {
    teacherModule.initialize(resetCallback, adminPassword);
}