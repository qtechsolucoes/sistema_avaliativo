// src/utils/questionTimer.js
// Timer Visual e Bloqueio de 3 Minutos por Questão

import { logService } from '../services/logService.js';

/**
 * Gerenciador de Timer para Questões
 * - Mostra timer visual na tela
 * - Bloqueia botão "Próxima" por 3 minutos
 * - Emite avisos sonoros quando tempo está acabando
 */
export class QuestionTimer {
    constructor(config = {}) {
        this.minTime = config.minTime || 180; // 3 minutos em segundos
        this.warningTime = config.warningTime || 30; // Aviso aos 30s restantes
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isBlocked = true;
        this.onUnblock = config.onUnblock || (() => {});
        this.onTick = config.onTick || (() => {});

        // Elementos DOM
        this.timerDisplay = null;
        this.progressBar = null;
        this.statusIcon = null;

        // Estado de áudio
        this.audioContext = null;
        this.hasPlayedWarning = false;

        this.initialize();
    }

    /**
     * Inicializa o timer e cria elementos visuais
     */
    initialize() {
        this.createTimerUI();
        logService.info('QuestionTimer inicializado', { minTime: this.minTime });
    }

    /**
     * Cria interface visual do timer
     */
    createTimerUI() {
        // Remove timer antigo se existir
        const oldTimer = document.getElementById('question-timer-container');
        if (oldTimer) oldTimer.remove();

        // Container principal - canto superior direito, fora do conteúdo
        const container = document.createElement('div');
        container.id = 'question-timer-container';
        container.className = 'fixed top-4 right-4 z-50 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-xl p-3';
        container.style.minWidth = '160px';
        container.style.maxWidth = '180px';

        // Cabeçalho compacto com ícone e tempo na mesma linha
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-2';

        // Ícone de status menor
        const statusIcon = document.createElement('span');
        statusIcon.id = 'timer-status-icon';
        statusIcon.className = 'text-xl';
        statusIcon.textContent = '🔒';

        // Display do tempo menor
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'timer-display';
        timerDisplay.className = 'text-xl font-bold font-mono text-white';
        timerDisplay.textContent = this.formatTime(0);

        header.appendChild(statusIcon);
        header.appendChild(timerDisplay);

        // Mensagem de status compacta
        const statusMessage = document.createElement('div');
        statusMessage.id = 'timer-status-message';
        statusMessage.className = 'text-xs text-center text-blue-100 mb-2';
        statusMessage.textContent = 'Aguarde 3min';

        // Barra de progresso menor
        const progressContainer = document.createElement('div');
        progressContainer.className = 'w-full bg-blue-300 bg-opacity-30 rounded-full h-2 overflow-hidden';

        const progressBar = document.createElement('div');
        progressBar.id = 'timer-progress-bar';
        progressBar.className = 'h-full bg-white transition-all duration-1000 ease-linear';
        progressBar.style.width = '0%';

        progressContainer.appendChild(progressBar);

        // Monta estrutura
        container.appendChild(header);
        container.appendChild(statusMessage);
        container.appendChild(progressContainer);

        // Adiciona ao DOM
        document.body.appendChild(container);

        // Armazena referências
        this.timerDisplay = timerDisplay;
        this.progressBar = progressBar;
        this.statusIcon = statusIcon;
        this.statusMessage = statusMessage;
    }

    /**
     * Inicia o timer
     */
    start() {
        this.elapsedTime = 0;
        this.isBlocked = true;
        this.hasPlayedWarning = false;

        // Limpa interval anterior se existir
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Inicia novo interval
        this.timerInterval = setInterval(() => {
            this.elapsedTime++;
            this.update();

            // Callback de tick
            this.onTick(this.elapsedTime);

            // Verifica se atingiu tempo mínimo
            if (this.elapsedTime >= this.minTime && this.isBlocked) {
                this.unblock();
            }

            // Aviso sonoro faltando 30 segundos
            const remaining = this.minTime - this.elapsedTime;
            if (remaining === this.warningTime && !this.hasPlayedWarning) {
                this.playWarningSound();
                this.hasPlayedWarning = true;
            }

        }, 1000);

        logService.info('Timer iniciado para nova questão');
    }

    /**
     * Atualiza display visual do timer
     */
    update() {
        const remaining = Math.max(0, this.minTime - this.elapsedTime);
        const progress = Math.min(100, (this.elapsedTime / this.minTime) * 100);

        // Atualiza display de tempo
        this.timerDisplay.textContent = this.formatTime(remaining);

        // Atualiza barra de progresso
        this.progressBar.style.width = `${progress}%`;

        // Muda cor baseada no tempo restante
        if (remaining === 0) {
            this.progressBar.classList.remove('bg-red-500', 'bg-yellow-500');
            this.progressBar.classList.add('bg-green-500');
            this.timerDisplay.classList.remove('text-red-600', 'text-yellow-600');
            this.timerDisplay.classList.add('text-green-600');
        } else if (remaining <= this.warningTime) {
            this.progressBar.classList.remove('bg-red-500', 'bg-green-500');
            this.progressBar.classList.add('bg-yellow-500');
            this.timerDisplay.classList.remove('text-red-600', 'text-green-600');
            this.timerDisplay.classList.add('text-yellow-600');
        } else {
            this.progressBar.classList.remove('bg-yellow-500', 'bg-green-500');
            this.progressBar.classList.add('bg-red-500');
            this.timerDisplay.classList.remove('text-yellow-600', 'text-green-600');
            this.timerDisplay.classList.add('text-red-600');
        }
    }

    /**
     * Desbloqueia botão de próxima questão
     */
    unblock() {
        this.isBlocked = false;

        // Atualiza UI
        this.statusIcon.textContent = '✅';
        this.statusMessage.textContent = 'Pode avançar!';
        this.statusMessage.classList.remove('text-blue-100');
        this.statusMessage.classList.add('text-white', 'font-bold');

        // Muda o fundo para verde e adiciona efeito de pulso
        const container = document.getElementById('question-timer-container');
        if (container) {
            container.className = 'fixed top-4 right-4 z-50 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-xl p-3 animate-pulse';
            setTimeout(() => container.classList.remove('animate-pulse'), 2000);
        }

        // Toca som de desbloqueio
        this.playUnlockSound();

        // Callback de desbloqueio
        this.onUnblock();

        logService.info('Timer desbloqueado - aluno pode avançar');
    }

    /**
     * Para o timer
     */
    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        logService.debug('Timer parado', { elapsedTime: this.elapsedTime });
    }

    /**
     * Remove o timer da tela
     */
    destroy() {
        this.stop();

        const container = document.getElementById('question-timer-container');
        if (container) {
            container.remove();
        }

        logService.debug('Timer destruído');
    }

    /**
     * Formata segundos em MM:SS
     * @param {number} seconds - Segundos
     * @returns {string} - Tempo formatado
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Toca som de aviso (faltando 30 segundos)
     */
    playWarningSound() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = 800; // Hz
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);

            logService.debug('Som de aviso reproduzido');
        } catch (error) {
            logService.warn('Não foi possível reproduzir som de aviso', { error });
        }
    }

    /**
     * Toca som de desbloqueio
     */
    playUnlockSound() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Toca dois bips ascendentes
            [523.25, 659.25].forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.value = freq; // Hz (C5 e E5)
                oscillator.type = 'sine';

                const startTime = this.audioContext.currentTime + (index * 0.15);
                gainNode.gain.setValueAtTime(0.2, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.2);
            });

            logService.debug('Som de desbloqueio reproduzido');
        } catch (error) {
            logService.warn('Não foi possível reproduzir som de desbloqueio', { error });
        }
    }

    /**
     * Verifica se ainda está bloqueado
     * @returns {boolean}
     */
    isStillBlocked() {
        return this.isBlocked;
    }

    /**
     * Obtém tempo decorrido
     * @returns {number}
     */
    getElapsedTime() {
        return this.elapsedTime;
    }

    /**
     * Obtém tempo restante
     * @returns {number}
     */
    getRemainingTime() {
        return Math.max(0, this.minTime - this.elapsedTime);
    }
}

// Exporta instância única (opcional)
export let currentTimer = null;

/**
 * Cria e inicia um novo timer
 * @param {object} config - Configuração do timer
 * @returns {QuestionTimer}
 */
export function startQuestionTimer(config = {}) {
    // Destrói timer anterior se existir
    if (currentTimer) {
        currentTimer.destroy();
    }

    currentTimer = new QuestionTimer(config);
    currentTimer.start();

    return currentTimer;
}

/**
 * Para e destrói o timer atual
 */
export function stopQuestionTimer() {
    if (currentTimer) {
        currentTimer.destroy();
        currentTimer = null;
    }
}
