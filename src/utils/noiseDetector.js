// src/utils/noiseDetector.js
// Detector de Ruído com Bloqueio Automático

import { logService } from '../services/logService.js';

/**
 * Detector de Ruído
 * - Monitora nível de ruído via microfone
 * - Bloqueia prova quando excede threshold
 * - Desbloqueia automaticamente quando silencia
 * - Adaptado para avaliações especiais (TEA, TDAH, etc.)
 */
export class NoiseDetector {
    constructor(config = {}) {
        // Configuração
        this.threshold = config.threshold || 65; // Decibéis (valor padrão)
        this.blockDuration = config.blockDuration || 2000; // Tempo mínimo de silêncio para desbloquear (ms)
        this.checkInterval = config.checkInterval || 100; // Intervalo de checagem (ms)
        this.isAdaptive = config.isAdaptive || false; // Se é avaliação adaptada
        this.adaptationType = config.adaptationType || 'standard';

        // Estado
        this.isActive = false;
        this.isBlocked = false;
        this.stream = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.checkIntervalId = null;
        this.silenceStartTime = null;
        this.noiseEvents = [];

        // Callbacks
        this.onBlock = config.onBlock || (() => {});
        this.onUnblock = config.onUnblock || (() => {});
        this.onNoiseLevel = config.onNoiseLevel || (() => {});

        // UI
        this.modal = null;
        this.levelIndicator = null;

        // Ajusta threshold baseado no tipo de adaptação
        this.adjustThresholdForAdaptationType();
    }

    /**
     * Ajusta threshold de ruído baseado no tipo de necessidade especial
     */
    adjustThresholdForAdaptationType() {
        if (!this.isAdaptive) return;

        const thresholdAdjustments = {
            'tea': 55,        // TEA: mais sensível (menor threshold)
            'tdah': 70,       // TDAH: menos sensível (maior threshold - mais movimento é esperado)
            'down': 60,       // Síndrome de Down: moderadamente sensível
            'auditory': 50,   // Deficiência Auditiva: muito sensível (compensa dificuldade auditiva)
            'standard': 65    // Padrão
        };

        const newThreshold = thresholdAdjustments[this.adaptationType] || 65;
        this.threshold = newThreshold;

        logService.info('Threshold de ruído ajustado para avaliação adaptada', {
            adaptationType: this.adaptationType,
            threshold: newThreshold
        });
    }

    /**
     * Inicia monitoramento de ruído
     */
    async start() {
        try {
            // Solicita permissão de microfone
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Configura análise de áudio
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.stream);

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            source.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            // Inicia checagem periódica
            this.isActive = true;
            this.checkIntervalId = setInterval(() => {
                this.checkNoiseLevel();
            }, this.checkInterval);

            // Cria UI do indicador de nível
            this.createLevelIndicator();

            logService.info('Detector de ruído iniciado', {
                threshold: this.threshold,
                isAdaptive: this.isAdaptive
            });

            return true;

        } catch (error) {
            logService.error('Erro ao iniciar detector de ruído', { error });

            // Avisa o usuário
            alert(`⚠️ Não foi possível acessar o microfone.\n\nO detector de ruído não funcionará.\n\nErro: ${error.message}`);

            return false;
        }
    }

    /**
     * Verifica nível de ruído atual
     */
    checkNoiseLevel() {
        if (!this.isActive || !this.analyser) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Calcula nível médio de volume
        const sum = this.dataArray.reduce((a, b) => a + b, 0);
        const average = sum / this.dataArray.length;

        // Converte para aproximação de decibéis (escala logarítmica)
        const decibels = Math.round(average * 0.5); // Aproximação simples

        // Atualiza indicador visual
        this.updateLevelIndicator(decibels);

        // Callback de nível
        this.onNoiseLevel(decibels);

        // Verifica se excedeu threshold
        if (decibels > this.threshold) {
            this.silenceStartTime = null;

            if (!this.isBlocked) {
                this.block(decibels);
            }

            // Registra evento de ruído
            this.noiseEvents.push({
                timestamp: Date.now(),
                level: decibels,
                threshold: this.threshold
            });

        } else {
            // Ruído abaixo do threshold
            if (this.isBlocked) {
                // Inicia contagem de silêncio
                if (!this.silenceStartTime) {
                    this.silenceStartTime = Date.now();
                }

                // Verifica se manteve silêncio pelo tempo necessário
                const silenceDuration = Date.now() - this.silenceStartTime;
                if (silenceDuration >= this.blockDuration) {
                    this.unblock();
                }
            }
        }
    }

    /**
     * Bloqueia a prova por ruído excessivo
     * @param {number} level - Nível de ruído detectado
     */
    block(level) {
        this.isBlocked = true;

        // Cria modal de bloqueio
        this.showBlockModal(level);

        // Callback
        this.onBlock(level);

        logService.warn('Prova bloqueada por ruído excessivo', {
            level,
            threshold: this.threshold,
            isAdaptive: this.isAdaptive
        });
    }

    /**
     * Desbloqueia a prova
     */
    unblock() {
        this.isBlocked = false;
        this.silenceStartTime = null;

        // Remove modal
        this.hideBlockModal();

        // Callback
        this.onUnblock();

        logService.info('Prova desbloqueada - silêncio restaurado');
    }

    /**
     * Cria modal de bloqueio
     * @param {number} level - Nível de ruído
     */
    showBlockModal(level) {
        // Remove modal anterior se existir
        this.hideBlockModal();

        // Cria overlay
        const overlay = document.createElement('div');
        overlay.id = 'noise-block-modal';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]';

        // Container do modal
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-red-600 text-white p-8 rounded-lg max-w-2xl mx-4 text-center';

        // Ícone
        const icon = document.createElement('div');
        icon.className = 'text-6xl mb-4 animate-pulse';
        icon.textContent = '🔇';

        // Título
        const title = document.createElement('h2');
        title.className = 'text-4xl font-bold mb-4';
        title.textContent = 'PROVA BLOQUEADA';

        // Mensagem principal
        const message = document.createElement('p');
        message.className = 'text-2xl mb-6';
        message.textContent = this.getBlockMessage();

        // Nível de ruído atual
        const levelDisplay = document.createElement('div');
        levelDisplay.id = 'modal-noise-level';
        levelDisplay.className = 'text-xl mb-4 font-mono';
        levelDisplay.textContent = `Ruído detectado: ${level} dB (limite: ${this.threshold} dB)`;

        // Instruções
        const instructions = document.createElement('p');
        instructions.className = 'text-lg opacity-90';
        instructions.textContent = 'A prova será desbloqueada automaticamente quando o silêncio for restaurado.';

        // Barra de progresso de silêncio
        const progressContainer = document.createElement('div');
        progressContainer.className = 'w-full bg-red-900 rounded-full h-4 mt-6 overflow-hidden';

        const progressBar = document.createElement('div');
        progressBar.id = 'silence-progress-bar';
        progressBar.className = 'h-full bg-green-400 transition-all duration-100';
        progressBar.style.width = '0%';

        progressContainer.appendChild(progressBar);

        // Monta estrutura
        modalContent.appendChild(icon);
        modalContent.appendChild(title);
        modalContent.appendChild(message);
        modalContent.appendChild(levelDisplay);
        modalContent.appendChild(instructions);
        modalContent.appendChild(progressContainer);

        overlay.appendChild(modalContent);
        document.body.appendChild(overlay);

        this.modal = overlay;

        // Atualiza barra de progresso
        this.updateSilenceProgress();
    }

    /**
     * Atualiza barra de progresso de silêncio
     */
    updateSilenceProgress() {
        if (!this.isBlocked || !this.modal) return;

        const progressBar = document.getElementById('silence-progress-bar');
        const levelDisplay = document.getElementById('modal-noise-level');

        if (!progressBar) return;

        const updateInterval = setInterval(() => {
            if (!this.isBlocked || !this.modal) {
                clearInterval(updateInterval);
                return;
            }

            // Atualiza nível exibido
            if (levelDisplay && this.analyser) {
                this.analyser.getByteFrequencyData(this.dataArray);
                const sum = this.dataArray.reduce((a, b) => a + b, 0);
                const average = sum / this.dataArray.length;
                const decibels = Math.round(average * 0.5);

                levelDisplay.textContent = `Ruído atual: ${decibels} dB (limite: ${this.threshold} dB)`;
            }

            // Atualiza barra de progresso
            if (this.silenceStartTime) {
                const elapsed = Date.now() - this.silenceStartTime;
                const progress = Math.min(100, (elapsed / this.blockDuration) * 100);
                progressBar.style.width = `${progress}%`;
            } else {
                progressBar.style.width = '0%';
            }
        }, 100);
    }

    /**
     * Remove modal de bloqueio
     */
    hideBlockModal() {
        const modal = document.getElementById('noise-block-modal');
        if (modal) {
            modal.remove();
        }
        this.modal = null;
    }

    /**
     * Obtém mensagem de bloqueio personalizada
     * @returns {string}
     */
    getBlockMessage() {
        if (this.isAdaptive) {
            const messages = {
                'tea': 'Por favor, mantenha o ambiente tranquilo para continuar.',
                'tdah': 'Tente manter a calma e o silêncio para desbloquear.',
                'down': 'Fique tranquilo(a), aguarde em silêncio.',
                'auditory': 'Ambiente com muito ruído detectado. Aguarde silêncio.',
                'standard': 'AGUARDANDO SILÊNCIO PARA DESBLOQUEAR'
            };

            return messages[this.adaptationType] || messages['standard'];
        }

        return 'AGUARDANDO SILÊNCIO PARA DESBLOQUEAR!!!';
    }

    /**
     * Cria indicador visual de nível de ruído
     */
    createLevelIndicator() {
        // Remove indicador antigo
        const oldIndicator = document.getElementById('noise-level-indicator');
        if (oldIndicator) oldIndicator.remove();

        // Container
        const container = document.createElement('div');
        container.id = 'noise-level-indicator';
        container.className = 'fixed bottom-4 left-4 z-40 bg-white rounded-lg shadow-lg p-3 border-2 border-gray-300';
        container.style.minWidth = '200px';

        // Ícone
        const icon = document.createElement('div');
        icon.className = 'text-2xl text-center mb-2';
        icon.textContent = '🎤';

        // Display de nível
        const levelText = document.createElement('div');
        levelText.id = 'noise-level-text';
        levelText.className = 'text-sm font-bold text-center mb-2';
        levelText.textContent = '0 dB';

        // Barra de nível
        const barContainer = document.createElement('div');
        barContainer.className = 'w-full bg-gray-200 rounded-full h-2 overflow-hidden';

        const bar = document.createElement('div');
        bar.id = 'noise-level-bar';
        bar.className = 'h-full bg-green-500 transition-all duration-100';
        bar.style.width = '0%';

        barContainer.appendChild(bar);

        // Limite visual
        const thresholdLabel = document.createElement('div');
        thresholdLabel.className = 'text-xs text-center mt-1 text-gray-500';
        thresholdLabel.textContent = `Limite: ${this.threshold} dB`;

        // Monta
        container.appendChild(icon);
        container.appendChild(levelText);
        container.appendChild(barContainer);
        container.appendChild(thresholdLabel);

        document.body.appendChild(container);

        this.levelIndicator = container;
    }

    /**
     * Atualiza indicador de nível
     * @param {number} level - Nível de ruído
     */
    updateLevelIndicator(level) {
        const levelText = document.getElementById('noise-level-text');
        const levelBar = document.getElementById('noise-level-bar');

        if (!levelText || !levelBar) return;

        levelText.textContent = `${level} dB`;

        // Calcula percentual (0-100 dB mapeado para 0-100%)
        const percentage = Math.min(100, (level / 100) * 100);
        levelBar.style.width = `${percentage}%`;

        // Muda cor baseado no nível
        levelBar.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500');

        if (level > this.threshold) {
            levelBar.classList.add('bg-red-500');
            levelText.classList.add('text-red-600');
        } else if (level > this.threshold * 0.8) {
            levelBar.classList.add('bg-yellow-500');
            levelText.classList.remove('text-red-600');
        } else {
            levelBar.classList.add('bg-green-500');
            levelText.classList.remove('text-red-600');
        }
    }

    /**
     * Para o detector
     */
    stop() {
        this.isActive = false;

        if (this.checkIntervalId) {
            clearInterval(this.checkIntervalId);
            this.checkIntervalId = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.hideBlockModal();

        const indicator = document.getElementById('noise-level-indicator');
        if (indicator) indicator.remove();

        logService.info('Detector de ruído parado', {
            totalNoiseEvents: this.noiseEvents.length
        });
    }

    /**
     * Obtém estatísticas de ruído
     * @returns {object}
     */
    getStatistics() {
        return {
            totalEvents: this.noiseEvents.length,
            isCurrentlyBlocked: this.isBlocked,
            threshold: this.threshold,
            isAdaptive: this.isAdaptive,
            adaptationType: this.adaptationType,
            events: this.noiseEvents
        };
    }
}

// Exporta instância única
export let currentNoiseDetector = null;

/**
 * Inicia detector de ruído
 * @param {object} config - Configuração
 * @returns {Promise<NoiseDetector>}
 */
export async function startNoiseDetector(config = {}) {
    // Para detector anterior se existir
    if (currentNoiseDetector) {
        currentNoiseDetector.stop();
    }

    currentNoiseDetector = new NoiseDetector(config);
    const started = await currentNoiseDetector.start();

    if (!started) {
        currentNoiseDetector = null;
        return null;
    }

    return currentNoiseDetector;
}

/**
 * Para detector de ruído
 */
export function stopNoiseDetector() {
    if (currentNoiseDetector) {
        currentNoiseDetector.stop();
        currentNoiseDetector = null;
    }
}
