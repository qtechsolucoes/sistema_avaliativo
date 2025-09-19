// src/main.js

// --- IMPORTAÇÕES DOS MÓDULOS ---
import { dom, updateState } from './state.js';
import { showScreen } from './navigation.js';
import { initializeLoginScreen } from './login.js';
import { initializeQuizScreen, startAssessmentFlow, finishAssessment } from './quiz.js';
import { setupModalListeners, setupSidebarListeners } from './ui.js';
import { initializeTeacherArea } from './teacher.js';
import './adaptation.js'; // Importa o módulo para que seja incluído no build offline

// ===================================================================================
// FUNÇÃO DE REINICIALIZAÇÃO E BLOQUEIO
// ===================================================================================

/**
 * Reseta o estado da aplicação para o início, mostrando a tela de login.
 */
function resetApp() {
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
    // ADICIONADO: Garante que a legenda também seja escondida ao resetar
    dom.login.adaptationLegend.classList.add('hidden');

    showScreen('login');
}

/**
 * Função para desbloquear o dispositivo.
 */
function unlockDevice() {
    const password = prompt("Para desbloquear, insira a senha do administrador:");
    if (password === "admin123") {
        localStorage.removeItem('deviceLocked');
        alert("Dispositivo desbloqueado com sucesso!");
        resetApp();
    } else if (password) {
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
    initializeLoginScreen(startAssessmentFlow);
    initializeQuizScreen();
    setupModalListeners(finishAssessment);
    setupSidebarListeners();
    initializeTeacherArea(resetApp);

    dom.results.backToStartBtn.addEventListener('click', () => {
        showScreen('locked');
    });

    dom.locked.unlockBtn.addEventListener('click', unlockDevice);

    const isDeviceLocked = localStorage.getItem('deviceLocked') === 'true';
    if (isDeviceLocked) {
        showScreen('locked');
    } else {
        resetApp();
    }
}

// --- PONTO DE ENTRADA ---
document.addEventListener('DOMContentLoaded', initializeApp);

