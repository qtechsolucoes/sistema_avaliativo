// src/main.js - VERSÃO COMPLETA REFATORADA

// ===================================================================================
// IMPORTAÇÕES DOS MÓDULOS
// ===================================================================================

import { dom, state, updateState } from './state.js';
import { showScreen } from './navigation.js';
import { initializeLoginScreen } from './login.js';
import { initializeQuizScreen, startAssessmentFlow, finishAssessment } from './quiz.js';
import { setupModalListeners, setupSidebarListeners } from './ui.js';
import { teacherModule } from './teacher/index.js';
import { logService } from './services/logService.js';
import { errorHandler } from './utils/errorHandler.js';
import { verifyAdminPassword, isAuthLockedOut } from './utils/auth.js';
import { SafeNotification } from './utils/sanitizer.js';
import { initializeSupabase, testSupabaseConnection } from './services/supabaseClient.js';
import { validateConfig } from './config.js';
import './adaptive/index.js'; // Sistema adaptativo modularizado

// ===================================================================================
// CONFIGURAÇÕES GLOBAIS
// ===================================================================================

const APP_CONFIG = {
    VERSION: "2.0.1",
    DEBUG_MODE: localStorage.getItem('debugMode') === 'true',
    AUTO_SAVE: true,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
    PERFORMANCE_MONITORING: true
};

// ===================================================================================
// GERENCIAMENTO DE SESSÃO
// ===================================================================================

class SessionManager {
    constructor() {
        this.sessionTimer = null;
        this.lastActivity = Date.now();
        this.warningShown = false;
    }

    start() {
        this.lastActivity = Date.now();
        this.setupActivityListeners();
        this.startSessionTimer();
        logService.debug('Sessão iniciada');
    }

    setupActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => this.updateActivity(), true);
        });
    }

    updateActivity() {
        this.lastActivity = Date.now();
        this.warningShown = false;
    }

    startSessionTimer() {
        this.sessionTimer = setInterval(() => {
            const inactiveTime = Date.now() - this.lastActivity;
            
            // Aviso após 25 minutos de inatividade
            if (inactiveTime > 25 * 60 * 1000 && !this.warningShown) {
                this.showInactivityWarning();
                this.warningShown = true;
            }
            
            // Finaliza sessão após 30 minutos
            if (inactiveTime > APP_CONFIG.SESSION_TIMEOUT) {
                this.endSession();
            }
        }, 60000); // Verifica a cada minuto
    }

    showInactivityWarning() {
        // Remove aviso anterior se existir
        const existingWarning = document.getElementById('session-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        // Cria aviso seguro usando SafeNotification
        const warning = SafeNotification.createWarning(
            'Sessão expirando',
            'Sua sessão expirará em 5 minutos devido à inatividade.',
            10000
        );

        warning.id = 'session-warning';
    }

    endSession() {
        clearInterval(this.sessionTimer);
        logService.info('Sessão encerrada por inatividade');
        
        // Se estiver em uma avaliação, salva o progresso
        if (state.currentAssessment?.id && state.answerLog?.length > 0) {
            this.saveProgress();
        }
        
        resetApp();
        this.showSessionExpiredMessage();
    }

    saveProgress() {
        const progress = {
            studentId: state.currentStudent?.id,
            assessmentId: state.currentAssessment?.id,
            currentQuestionIndex: state.currentQuestionIndex,
            score: state.score,
            answerLog: state.answerLog,
            timestamp: Date.now()
        };
        
        localStorage.setItem('assessment_progress', JSON.stringify(progress));
        logService.info('Progresso da avaliação salvo');
    }

    showSessionExpiredMessage() {
        // Cria modal seguro para sessão expirada
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-lg p-6 max-w-md mx-4';

        const title = document.createElement('h3');
        title.className = 'text-lg font-bold mb-2';
        title.textContent = 'Sessão Expirada';

        const message = document.createElement('p');
        message.className = 'text-gray-600 mb-4';
        message.textContent = 'Sua sessão foi encerrada devido à inatividade. Por favor, faça login novamente para continuar.';

        const button = document.createElement('button');
        button.className = 'w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700';
        button.textContent = 'OK';
        button.onclick = () => overlay.remove();

        modal.appendChild(title);
        modal.appendChild(message);
        modal.appendChild(button);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    stop() {
        clearInterval(this.sessionTimer);
        logService.debug('Sessão finalizada');
    }
}

const sessionManager = new SessionManager();

// ===================================================================================
// FUNÇÕES DE REINICIALIZAÇÃO E BLOQUEIO
// ===================================================================================

/**
 * Reseta completamente o estado da aplicação
 */
function resetApp() {
    logService.info('Resetando aplicação');
    
    // Para a sessão atual
    sessionManager.stop();
    
    // Reseta o estado global
    updateState({
        currentStudent: {},
        currentAssessment: {},
        currentQuestionIndex: 0,
        score: 0,
        answerLog: [],
        questionStartTime: null,
        assessmentStartTime: null
    });
    
    // Reseta os campos do formulário de login
    if (dom.login.yearSelect) {
        dom.login.yearSelect.value = '';
    }
    
    if (dom.login.classSelect) {
        dom.login.classSelect.innerHTML = '<option value="">-- Selecione o ano primeiro --</option>';
        dom.login.classSelect.disabled = true;
    }
    
    if (dom.login.studentSelect) {
        dom.login.studentSelect.innerHTML = '<option value="">-- Selecione a turma primeiro --</option>';
        dom.login.studentSelect.disabled = true;
    }
    
    if (dom.login.startBtn) {
        dom.login.startBtn.disabled = true;
    }
    
    if (dom.login.errorMessage) {
        dom.login.errorMessage.classList.add('hidden');
    }
    
    if (dom.login.adaptationLegend) {
        dom.login.adaptationLegend.classList.add('hidden');
    }

    // Limpa notificações existentes
    clearAllNotifications();
    
    // Reinicia a sessão
    sessionManager.start();
    
    // Mostra a tela de login
    showScreen('login');
}

/**
 * Verifica e recupera progresso salvo
 */
function checkSavedProgress() {
    const savedProgress = localStorage.getItem('assessment_progress');
    
    if (!savedProgress) return false;
    
    try {
        const progress = JSON.parse(savedProgress);
        
        // Verifica se o progresso é recente (menos de 1 hora)
        if (Date.now() - progress.timestamp > 60 * 60 * 1000) {
            localStorage.removeItem('assessment_progress');
            return false;
        }
        
        if (confirm('Foi detectado progresso não salvo de uma avaliação anterior. Deseja recuperar?')) {
            updateState({
                currentStudent: { id: progress.studentId },
                currentAssessment: { id: progress.assessmentId },
                currentQuestionIndex: progress.currentQuestionIndex,
                score: progress.score,
                answerLog: progress.answerLog
            });
            
            logService.info('Progresso recuperado', progress);
            return true;
        } else {
            localStorage.removeItem('assessment_progress');
        }
    } catch (error) {
        logService.error('Erro ao recuperar progresso', error);
        localStorage.removeItem('assessment_progress');
    }
    
    return false;
}

/**
 * Limpa todas as notificações da tela
 */
function clearAllNotifications() {
    const notifications = document.querySelectorAll('[id$="-warning"], [id$="-notification"], [id$="-message"]');
    notifications.forEach(notification => {
        if (notification && notification.parentElement) {
            notification.remove();
        }
    });
}

// ===================================================================================
// MONITORAMENTO DE PERFORMANCE
// ===================================================================================

class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.isMonitoring = APP_CONFIG.PERFORMANCE_MONITORING && APP_CONFIG.DEBUG_MODE;
        this.memoryInterval = null;
        this.maxMetrics = 1000; // Limita número de métricas armazenadas
    }

    start() {
        if (!this.isMonitoring) return;

        // Monitora tempo de carregamento
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            logService.debug(`Tempo de carregamento: ${loadTime}ms`);
        });

        // Monitora memória (se disponível) com limpeza adequada
        if (performance.memory) {
            this.memoryInterval = setInterval(() => {
                if (!this.isMonitoring) {
                    this.stop();
                    return;
                }

                const memoryInfo = {
                    usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                    totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                    limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
                };
                logService.debug('Uso de memória', memoryInfo);
            }, 30000); // A cada 30 segundos
        }
    }

    stop() {
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
            this.memoryInterval = null;
        }

        // Limpa métricas antigas
        this.metrics = [];
        logService.debug('Performance Monitor parado e limpo');
    }

    measureOperation(operationName, fn) {
        if (!this.isMonitoring) return fn();

        const startTime = performance.now();
        const result = fn();
        const endTime = performance.now();

        const duration = endTime - startTime;
        logService.debug(`${operationName}: ${duration.toFixed(2)}ms`);

        // Adiciona métrica com limite
        this.metrics.push({
            operation: operationName,
            duration,
            timestamp: Date.now()
        });

        // Remove métricas antigas se exceder limite
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics * 0.8); // Remove 20% das mais antigas
        }

        return result;
    }

    getMetricsSummary() {
        if (!this.isMonitoring) return null;

        const summary = {};
        this.metrics.forEach(metric => {
            if (!summary[metric.operation]) {
                summary[metric.operation] = {
                    count: 0,
                    totalDuration: 0,
                    avgDuration: 0,
                    minDuration: Infinity,
                    maxDuration: 0
                };
            }

            const op = summary[metric.operation];
            op.count++;
            op.totalDuration += metric.duration;
            op.minDuration = Math.min(op.minDuration, metric.duration);
            op.maxDuration = Math.max(op.maxDuration, metric.duration);
            op.avgDuration = op.totalDuration / op.count;
        });

        return summary;
    }
}

const performanceMonitor = new PerformanceMonitor();

// ===================================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ===================================================================================

/**
 * Função principal de inicialização
 */
function initializeApp() {
    console.log(`
╔════════════════════════════════════════╗
║   PLATAFORMA DE AVALIAÇÕES v${APP_CONFIG.VERSION}    ║
╚════════════════════════════════════════╝
    `);
    
    logService.info('Iniciando aplicação', {
        version: APP_CONFIG.VERSION,
        debug: APP_CONFIG.DEBUG_MODE,
        userAgent: navigator.userAgent
    });
    
    try {
        // Valida configuração
        const configValidation = validateConfig();
        if (!configValidation.isValid) {
            console.warn('⚠️ Problemas de configuração detectados:', configValidation.errors);
        }

        // Inicializa Supabase
        console.log('🔌 Inicializando conexão com banco de dados...');
        const supabaseClient = initializeSupabase();

        if (supabaseClient) {
            // Testa conectividade em background
            testSupabaseConnection().then(isConnected => {
                if (isConnected) {
                    console.log('✅ Conexão com Supabase confirmada - dados reais disponíveis');
                } else {
                    console.log('⚠️ Problemas de conectividade - usando dados mock como fallback');
                }
            });
        } else {
            console.log('📴 Modo offline - usando dados mock');
        }

        // Inicia monitoramento de performance
        performanceMonitor.start();

        // Inicializa todos os módulos principais
        performanceMonitor.measureOperation('Inicialização de módulos', () => {
            initializeLoginScreen(startAssessmentFlow);
            initializeQuizScreen();
            setupModalListeners(finishAssessment);
            setupSidebarListeners();

            // Inicializa módulo do professor
            teacherModule.initialize(resetApp, verifyAdminPassword);
        });
        
        // Configura listeners dos botões de navegação
        setupNavigationListeners();
        
        // Verifica progresso salvo
        const hasProgress = checkSavedProgress();

        if (hasProgress) {
            // Se recuperou progresso, vai direto para a tela do quiz
            showScreen('quiz');
        } else {
            resetApp();
        }
        
        // Inicia gerenciamento de sessão
        sessionManager.start();
        
        // Adiciona informações de debug se habilitado
        if (APP_CONFIG.DEBUG_MODE) {
            addDebugInfo();
        }
        
        // Registra service worker para PWA (se disponível)
        registerServiceWorker();
        
        logService.info('✅ Aplicação inicializada com sucesso');
        
    } catch (error) {
        handleCriticalError(error);
    }
}

/**
 * Configura listeners de navegação
 */
function setupNavigationListeners() {
    // Botão de voltar ao início após resultados
    if (dom.results.backToStartBtn) {
        dom.results.backToStartBtn.addEventListener('click', () => {
            resetApp();
        });
    }

    // Previne navegação acidental
    window.addEventListener('beforeunload', (e) => {
        if (state.currentAssessment?.id && state.currentQuestionIndex > 0) {
            e.preventDefault();
            e.returnValue = 'Você tem uma avaliação em andamento. Deseja realmente sair?';
        }
    });

    // Detecta teclas de atalho (apenas em modo debug)
    if (APP_CONFIG.DEBUG_MODE) {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+D - Toggle Debug Mode
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                toggleDebugMode();
            }
            
            // Ctrl+Shift+L - Export Logs
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                logService.exportLogs();
            }
            
            // Ctrl+Shift+R - Force Reset
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                if (confirm('Forçar reset completo da aplicação?')) {
                    localStorage.clear();
                    location.reload();
                }
            }
        });
    }
}

/**
 * Adiciona informações de debug na tela
 */
function addDebugInfo() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.className = 'fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono z-50';
    debugPanel.innerHTML = `
        <div>DEBUG MODE</div>
        <div>v${APP_CONFIG.VERSION}</div>
        <div id="debug-info"></div>
    `;
    document.body.appendChild(debugPanel);
    
    // Atualiza informações de debug periodicamente
    setInterval(() => {
        const info = document.getElementById('debug-info');
        if (info) {
            info.innerHTML = `
                <div>Estado: ${state.currentStudent?.name || 'Não logado'}</div>
                <div>Tela: ${getCurrentScreen()}</div>
                <div>Sessão: ${Math.floor((Date.now() - sessionManager.lastActivity) / 1000)}s</div>
            `;
        }
    }, 1000);
}

/**
 * Retorna a tela atual
 */
function getCurrentScreen() {
    for (const [name, element] of Object.entries(dom.screens)) {
        if (element && !element.classList.contains('hidden')) {
            return name;
        }
    }
    return 'unknown';
}

/**
 * Alterna modo debug
 */
function toggleDebugMode() {
    APP_CONFIG.DEBUG_MODE = !APP_CONFIG.DEBUG_MODE;
    localStorage.setItem('debugMode', APP_CONFIG.DEBUG_MODE.toString());
    
    if (APP_CONFIG.DEBUG_MODE) {
        addDebugInfo();
        console.log('🐛 Modo Debug ATIVADO');
    } else {
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) debugPanel.remove();
        console.log('🐛 Modo Debug DESATIVADO');
    }
}

/**
 * Registra Service Worker para funcionalidade offline
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            logService.info('Service Worker registrado', {
                scope: registration.scope
            });
        } catch (error) {
            logService.warn('Service Worker não pôde ser registrado', error);
        }
    }
}

/**
 * Trata erros críticos na inicialização
 */
function handleCriticalError(error) {
    console.error('❌ ERRO CRÍTICO:', error);
    logService.critical('Erro crítico na inicialização', error);
    
    // Mostra tela de erro
    document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-red-50 p-4">
            <div class="max-w-md w-full bg-white rounded-lg shadow-xl p-6">
                <div class="flex items-center mb-4">
                    <svg class="w-12 h-12 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <h1 class="text-2xl font-bold text-red-600">Erro Crítico</h1>
                </div>
                <p class="text-gray-600 mb-4">
                    Ocorreu um erro ao inicializar a aplicação. Por favor, recarregue a página.
                </p>
                <details class="mb-4">
                    <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                        Detalhes técnicos
                    </summary>
                    <pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
${error.stack || error.message || 'Erro desconhecido'}
                    </pre>
                </details>
                <div class="flex gap-2">
                    <button onclick="location.reload()" 
                            class="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                        Recarregar
                    </button>
                    <button onclick="localStorage.clear(); location.reload()" 
                            class="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700">
                        Limpar e Recarregar
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===================================================================================
// PONTO DE ENTRADA
// ===================================================================================

// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM já está pronto
    initializeApp();
}

// Exporta funções úteis para debug no console
if (APP_CONFIG.DEBUG_MODE) {
    import('./services/supabaseClient.js').then(({ getSupabaseClient, testSupabaseConnection, reinitializeSupabase }) => {
        import('./services/dataService.js').then(({ dataService, recreateDataService }) => {
            window.debugApp = {
                state,
                config: APP_CONFIG,
                resetApp,
                sessionManager,
                performanceMonitor,
                logService,
                toggleDebugMode,
                exportLogs: () => logService.exportLogs(),
                clearStorage: () => {
                    if (confirm('Limpar todo o localStorage?')) {
                        localStorage.clear();
                        location.reload();
                    }
                },
                // Ferramentas de debug do Supabase
                supabase: {
                    client: getSupabaseClient(),
                    testConnection: testSupabaseConnection,
                    reinitialize: reinitializeSupabase,
                    status: () => {
                        const client = getSupabaseClient();
                        return {
                            hasClient: !!client,
                            url: client?.supabaseUrl || 'N/A',
                            mode: client ? 'online' : 'offline'
                        };
                    }
                },
                // Ferramentas de debug do dataService
                dataService: {
                    instance: dataService,
                    recreate: recreateDataService,
                    testClassesByGrade: (grade) => dataService.getClassesByGrade(grade),
                    testStudentsByClass: (classId) => dataService.getStudentsByClass(classId),
                    testAssessment: (grade) => dataService.getAssessmentData(grade)
                }
            };

            console.log('🐛 Debug Mode Ativo - Use window.debugApp para acessar ferramentas de debug');
            console.log('📋 Comandos úteis:');
            console.log('  window.debugApp.supabase.status() - Status da conexão');
            console.log('  window.debugApp.supabase.testConnection() - Testar conectividade');
            console.log('  window.debugApp.dataService.testClassesByGrade(6) - Testar busca de turmas');
        });
    });
}