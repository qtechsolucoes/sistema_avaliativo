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
import './adaptation.js'; // Importa para garantir que seja incluído no bundle

// ===================================================================================
// CONFIGURAÇÕES GLOBAIS
// ===================================================================================

const APP_CONFIG = {
    ADMIN_PASSWORD: "admin123",
    UNLOCK_PASSWORD: "unlock123",
    VERSION: "2.0.0",
    DEBUG_MODE: localStorage.getItem('debugMode') === 'true',
    AUTO_SAVE: true,
    SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutos
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
        const warning = document.createElement('div');
        warning.id = 'session-warning';
        warning.className = 'fixed top-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg z-50';
        warning.innerHTML = `
            <div class="flex items-center">
                <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <div>
                    <p class="font-bold">Sessão expirando</p>
                    <p class="text-sm">Sua sessão expirará em 5 minutos devido à inatividade.</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-yellow-700 hover:text-yellow-900">
                    ✕
                </button>
            </div>
        `;
        document.body.appendChild(warning);
        
        setTimeout(() => {
            if (document.getElementById('session-warning')) {
                warning.remove();
            }
        }, 10000);
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
        const message = document.createElement('div');
        message.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        message.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md">
                <h3 class="text-lg font-bold mb-2">Sessão Expirada</h3>
                <p class="text-gray-600 mb-4">
                    Sua sessão foi encerrada devido à inatividade. 
                    Por favor, faça login novamente para continuar.
                </p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    OK
                </button>
            </div>
        `;
        document.body.appendChild(message);
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
 * Desbloqueia o dispositivo com verificação de senha
 */
function unlockDevice() {
    const maxAttempts = 3;
    const attemptsKey = 'unlock_attempts';
    const lockoutKey = 'unlock_lockout';
    
    // Verifica se está em lockout
    const lockoutTime = localStorage.getItem(lockoutKey);
    if (lockoutTime && Date.now() < parseInt(lockoutTime)) {
        const remainingTime = Math.ceil((parseInt(lockoutTime) - Date.now()) / 1000 / 60);
        alert(`Muitas tentativas falhas. Tente novamente em ${remainingTime} minutos.`);
        return;
    }
    
    const password = prompt("Para desbloquear, insira a senha do administrador:");
    
    if (password === null) return; // Usuário cancelou
    
    if (password === APP_CONFIG.ADMIN_PASSWORD || password === APP_CONFIG.UNLOCK_PASSWORD) {
        // Senha correta
        localStorage.removeItem('deviceLocked');
        localStorage.removeItem(attemptsKey);
        localStorage.removeItem(lockoutKey);
        
        logService.info('Dispositivo desbloqueado com sucesso');
        alert("Dispositivo desbloqueado com sucesso!");
        resetApp();
        
    } else {
        // Senha incorreta
        let attempts = parseInt(localStorage.getItem(attemptsKey) || '0') + 1;
        localStorage.setItem(attemptsKey, attempts.toString());
        
        if (attempts >= maxAttempts) {
            // Bloqueia por 15 minutos após 3 tentativas
            const lockoutDuration = 15 * 60 * 1000; // 15 minutos
            localStorage.setItem(lockoutKey, (Date.now() + lockoutDuration).toString());
            localStorage.removeItem(attemptsKey);
            
            logService.warn('Dispositivo bloqueado por tentativas excessivas');
            alert("Muitas tentativas incorretas. Dispositivo bloqueado por 15 minutos.");
        } else {
            const remaining = maxAttempts - attempts;
            alert(`Senha incorreta. ${remaining} tentativa(s) restante(s).`);
        }
    }
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
        this.isMonitoring = APP_CONFIG.DEBUG_MODE;
    }

    start() {
        if (!this.isMonitoring) return;
        
        // Monitora tempo de carregamento
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            logService.debug(`Tempo de carregamento: ${loadTime}ms`);
        });
        
        // Monitora memória (se disponível)
        if (performance.memory) {
            setInterval(() => {
                const memoryInfo = {
                    usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                    totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                    limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
                };
                logService.debug('Uso de memória', memoryInfo);
            }, 30000); // A cada 30 segundos
        }
    }

    measureOperation(operationName, fn) {
        if (!this.isMonitoring) return fn();
        
        const startTime = performance.now();
        const result = fn();
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        logService.debug(`${operationName}: ${duration.toFixed(2)}ms`);
        
        this.metrics.push({
            operation: operationName,
            duration,
            timestamp: Date.now()
        });
        
        return result;
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
        // Inicia monitoramento de performance
        performanceMonitor.start();
        
        // Inicializa todos os módulos principais
        performanceMonitor.measureOperation('Inicialização de módulos', () => {
            initializeLoginScreen(startAssessmentFlow);
            initializeQuizScreen();
            setupModalListeners(finishAssessment);
            setupSidebarListeners();
            
            // Inicializa módulo do professor
            teacherModule.initialize(resetApp, APP_CONFIG.ADMIN_PASSWORD);
        });
        
        // Configura listeners dos botões de navegação
        setupNavigationListeners();
        
        // Verifica progresso salvo
        const hasProgress = checkSavedProgress();
        
        // Verifica estado do dispositivo
        const isDeviceLocked = localStorage.getItem('deviceLocked') === 'true';
        
        if (isDeviceLocked) {
            logService.info('Dispositivo bloqueado detectado');
            showScreen('locked');
        } else if (hasProgress) {
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
            // Bloqueia o dispositivo após conclusão
            localStorage.setItem('deviceLocked', 'true');
            showScreen('locked');
        });
    }

    // Botão de desbloqueio
    if (dom.locked.unlockBtn) {
        dom.locked.unlockBtn.addEventListener('click', unlockDevice);
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
    window.debugApp = {
        state,
        config: APP_CONFIG,
        resetApp,
        unlockDevice,
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
        }
    };
    
    console.log('🐛 Debug Mode Ativo - Use window.debugApp para acessar ferramentas de debug');
}