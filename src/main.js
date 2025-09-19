// src/main.js - VERSÃO CORRIGIDA

// --- IMPORTAÇÕES DOS MÓDULOS ---
import { dom, updateState } from './state.js';
import { showScreen } from './navigation.js';
import { initializeLoginScreen } from './login.js';
import { initializeQuizScreen, startAssessmentFlow, finishAssessment } from './quiz.js';
import { setupModalListeners, setupSidebarListeners } from './ui.js';
import { initializeTeacherArea } from './teacher.js';
import './adaptation.js'; // Importa o módulo para que seja incluído no build offline

// ===================================================================================
// CONFIGURAÇÕES GLOBAIS
// ===================================================================================

// CORREÇÃO: Senha padronizada para todo o sistema
const ADMIN_PASSWORD = "admin123";

// ===================================================================================
// FUNÇÃO DE REINICIALIZAÇÃO E BLOQUEIO
// ===================================================================================

/**
 * Reseta o estado da aplicação para o início, mostrando a tela de login.
 */
function resetApp() {
    console.log('Resetando aplicação...');
    
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
    dom.login.yearSelect.value = '';
    dom.login.classSelect.innerHTML = '<option value="">-- Selecione o ano primeiro --</option>';
    dom.login.classSelect.disabled = true;
    dom.login.studentSelect.innerHTML = '<option value="">-- Selecione a turma primeiro --</option>';
    dom.login.studentSelect.disabled = true;
    dom.login.startBtn.disabled = true;
    dom.login.errorMessage.classList.add('hidden');
    
    // CORREÇÃO: Garante que a legenda seja escondida ao resetar
    if (dom.login.adaptationLegend) {
        dom.login.adaptationLegend.classList.add('hidden');
    }

    showScreen('login');
}

/**
 * CORRIGIDA: Função para desbloquear o dispositivo com senha padronizada.
 */
function unlockDevice() {
    const password = prompt("Para desbloquear, insira a senha do administrador:");
    
    // CORREÇÃO: Usa a mesma senha do sistema
    if (password === ADMIN_PASSWORD) {
        localStorage.removeItem('deviceLocked');
        alert("Dispositivo desbloqueado com sucesso!");
        resetApp();
    } else if (password !== null) { // Verifica se não foi cancelado
        alert("Senha incorreta.");
    }
}

// ===================================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ===================================================================================

/**
 * Função principal que configura e inicia a aplicação.
 */
function initializeApp() {
    console.log('Inicializando aplicação...');
    
    try {
        // Inicializa todos os módulos
        initializeLoginScreen(startAssessmentFlow);
        initializeQuizScreen();
        setupModalListeners(finishAssessment);
        setupSidebarListeners();
        initializeTeacherArea(resetApp, ADMIN_PASSWORD); // CORREÇÃO: Passa senha para teacher.js

        // Configura listeners dos botões
        dom.results.backToStartBtn.addEventListener('click', () => {
            showScreen('locked');
        });

        dom.locked.unlockBtn.addEventListener('click', unlockDevice);

        // CORREÇÃO: Verifica estado inicial do dispositivo
        const isDeviceLocked = localStorage.getItem('deviceLocked') === 'true';
        
        if (isDeviceLocked) {
            console.log('Dispositivo bloqueado, mostrando tela de desbloqueio');
            showScreen('locked');
        } else {
            console.log('Dispositivo livre, iniciando tela de login');
            resetApp();
        }
        
        console.log('Aplicação inicializada com sucesso');
        
    } catch (error) {
        console.error('Erro crítico na inicialização:', error);
        alert('Erro ao inicializar a aplicação. Recarregue a página.');
    }
}

// --- PONTO DE ENTRADA ---
document.addEventListener('DOMContentLoaded', initializeApp);