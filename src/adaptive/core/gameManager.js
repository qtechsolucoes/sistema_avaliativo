// src/adaptive/core/gameManager.js
// Gerenciador Central de Jogos Adaptativos (VERSÃO ATUALIZADA)

import { updateState } from '../../state.js';
import { finishAssessment } from '../../quiz.js';
import { dataService } from '../../services/dataService.js';
// NOVA IMPORTAÇÃO DO ARQUIVO DE UTILIDADES
import { parseAdaptationDetails, determineAdaptationType } from './adaptiveUtils.js';

// Importa todos os jogos
import { MemoryGame } from '../games/memoryGame.js';
import { SequenceGame } from '../games/sequenceGame.js';
import { SpeedMatchingGame } from '../games/speedMatching.js';
import { ClassificationGame } from '../games/classification.js';
import { AudioMemoryGame } from '../games/audioMemory.js';
import { ClickSequenceGame } from '../games/clickSequence.js';
import { StoryAdventureGame } from '../games/storyAdventure.js';
import { PatternRecognitionGame } from '../games/patternRecognition.js';
import { SequenceMusicalGame } from '../games/sequenceMusical.js';
import { RhythmTurboGame } from '../games/rhythmTurbo.js';

/**
 * Gerenciador central para todos os jogos adaptativos
 * IMPORTANTE: Jogos são AVALIAÇÕES ADAPTADAS, não entretenimento
 */
export class AdaptiveGameManager {
    constructor(adaptationDetails, gameData = []) {
        this.adaptationDetails = adaptationDetails;
        this.gameData = gameData;
        this.gameContainer = null;

        // SISTEMA DE AVALIAÇÃO (não pontos de jogo)
        this.score = 0; // Número de acertos (como quiz padrão)
        this.totalQuestions = 10; // Total de questões da avaliação adaptada
        this.currentQuestion = 0; // Questão atual
        this.answerLog = []; // Log de respostas (como quiz padrão)
        this.assessmentStartTime = Date.now();
        this.questionStartTime = Date.now();

        // USA A FUNÇÃO CENTRALIZADA
        const adaptationDetailsObject = parseAdaptationDetails(this.adaptationDetails);
        this.adaptationType = determineAdaptationType(adaptationDetailsObject);
        
        this.setupGameContainer();

        console.log('ADAPTIVE_ASSESSMENT: Iniciando avaliação adaptada', {
            tipo: this.adaptationType,
            totalQuestoes: this.totalQuestions
        });
    }

    // --- FUNÇÃO REMOVIDA ---
    // A função determineAdaptationType foi removida deste arquivo e agora é importada.

    setupGameContainer() {
        // Usa os elementos que já existem no index.html
        const container = document.getElementById('adaptive-game-container');
        const title = document.getElementById('adaptive-game-title');
        const subtitle = document.getElementById('adaptive-game-subtitle');
        const score = document.getElementById('adaptive-game-score');
        const level = document.getElementById('adaptive-game-level');
        const feedback = document.getElementById('adaptive-game-feedback');

        // Configurações básicas (o restante do método continua igual)
        if (title) title.textContent = this.gameTitle || 'Jogo Adaptativo';
        if (subtitle) subtitle.textContent = this.gameSubtitle || 'Atividade Personalizada';
        if (score) score.textContent = `Pontos: ${this.score}`;
        if (level) level.textContent = `Nível: ${this.level}`;
        if (feedback) feedback.textContent = '';

        this.gameContainer = container;
    }

    createGame(gameType) {
        this.gameStartTime = Date.now();

        switch (gameType) {
            // Jogos originais
            case 'memory':
            case 'memory_enhanced':
                return new MemoryGame(this, gameType === 'memory_enhanced');
            case 'sequence':
                return new SequenceGame(this);
            case 'matching_speed':
                return new SpeedMatchingGame(this);
            case 'classification':
                return new ClassificationGame(this);
            case 'audio_memory':
                return new AudioMemoryGame(this);
            case 'click_sequence':
                return new ClickSequenceGame(this);
            case 'story_adventure':
                return new StoryAdventureGame(this);
            case 'pattern_recognition':
                return new PatternRecognitionGame(this);

            // Novos jogos baseados no demo
            case 'sequence_musical':
                return new SequenceMusicalGame(this);
            case 'rhythm_turbo':
                return new RhythmTurboGame(this);
            case 'cultural_organizer':
                return new ClassificationGame(this); // Reutiliza com tema cultural
            case 'memory_cultural':
                return new MemoryGame(this, true); // Memory enhanced com tema cultural
            case 'audio_recognition':
                return new AudioMemoryGame(this); // Reutiliza para reconhecimento auditivo
            case 'rhythm_builder':
                return new ClickSequenceGame(this); // Adaptado para construção de ritmos

            default:
                console.warn('Tipo de jogo não reconhecido:', gameType, '- usando MemoryGame como fallback');
                return new MemoryGame(this);
        }
    }

    /**
     * Registra uma resposta correta (como sistema de quiz)
     * @param {string} questionId - ID da questão/desafio
     * @param {boolean} isCorrect - Se a resposta está correta
     */
    recordAnswer(questionId, isCorrect) {
        const duration = Math.round((Date.now() - this.questionStartTime) / 1000);

        const answerEntry = {
            questionId: questionId,
            isCorrect: isCorrect,
            duration: Math.max(1, duration),
            questionIndex: this.currentQuestion,
            adaptationType: this.adaptationType
        };

        this.answerLog.push(answerEntry);

        if (isCorrect) {
            this.score++;
            this.showFeedback('✅ Resposta Correta!', 'success');
        } else {
            this.showFeedback('❌ Resposta Incorreta.', 'error');
        }

        this.currentQuestion++;
        this.updateDisplay();
        this.questionStartTime = Date.now();

        console.log('ADAPTIVE_ASSESSMENT: Resposta registrada', {
            questao: this.currentQuestion,
            acertos: this.score,
            total: this.totalQuestions,
            isCorrect
        });
    }

    updateDisplay() {
        const scoreEl = document.getElementById('adaptive-game-score');
        const levelEl = document.getElementById('adaptive-game-level');

        if (scoreEl) {
            scoreEl.textContent = `Acertos: ${this.score}/${this.totalQuestions}`;
        }

        if (levelEl) {
            const finalScore = this.totalQuestions > 0 ? (this.score * 10 / this.totalQuestions) : 0;
            levelEl.textContent = `Nota: ${finalScore.toFixed(1).replace('.', ',')}`;
        }
    }

    updateLevel() {
        if (this.level < this.maxLevel) {
            this.level++;
            document.getElementById('adaptive-game-level').textContent = `Nível: ${this.level}`;
            this.addAchievement('📈 Subiu de nível!');
        }
    }

    addAchievement(achievement) {
        this.achievements.push(achievement);
        this.showFeedback(achievement, 'achievement');
    }

    async showFeedback(message, type = 'info') {
        const feedback = document.getElementById('adaptive-game-feedback');
        
        try {
            const customFeedback = await dataService.getAdaptiveFeedback(this.adaptationType, type);
            if (customFeedback && customFeedback.length > 0) {
                const feedbackItem = customFeedback[Math.floor(Math.random() * customFeedback.length)];
                message = feedbackItem.content;
                if (feedbackItem.visual_style) feedback.setAttribute('data-visual-style', feedbackItem.visual_style);
                if (feedbackItem.animation_type) feedback.setAttribute('data-animation', feedbackItem.animation_type);
            }
        } catch (error) {
            console.warn('Erro ao carregar feedback personalizado, usando padrão:', error);
        }

        feedback.textContent = message;
        feedback.className = `game-feedback ${type}`;

        setTimeout(() => {
            feedback.textContent = '';
            feedback.className = 'game-feedback';
            feedback.removeAttribute('data-visual-style');
            feedback.removeAttribute('data-animation');
        }, 3000);
    }
    
    getGameDataFromBank(gameType) {
        if (!this.gameData || this.gameData.length === 0) {
            return null;
        }
        const gameTypeMapping = {
            'memory': 'memory', 'memory_enhanced': 'memory', 'sequence': 'sequence',
            'matching_speed': 'match', 'classification': 'drag_drop', 'audio_memory': 'audio',
            'click_sequence': 'click', 'story_adventure': 'story', 'pattern_recognition': 'pattern'
        };
        const bankGameType = gameTypeMapping[gameType] || gameType;
        return this.gameData.find(game => game.game_type === bankGameType) || null;
    }

    resetCombo() {
        this.comboCount = 0;
    }

    finishGame() {
        const totalDuration = Math.round((Date.now() - this.assessmentStartTime) / 1000);
        const finalScore = (this.score * 10 / this.totalQuestions);

        console.log('ADAPTIVE_ASSESSMENT: Finalizando avaliação adaptada', {
            acertos: this.score,
            totalQuestoes: this.totalQuestions,
            notaFinal: finalScore.toFixed(1),
            duracao: totalDuration
        });

        updateState({
            score: this.score,
            currentAssessment: {
                id: `adaptive-${this.adaptationType}`,
                questions: { length: this.totalQuestions },
                title: `Avaliação Adaptada - ${this.getAssessmentTitle()}`
            },
            answerLog: this.answerLog
        });

        finishAssessment();
    }

    getAssessmentTitle() {
        const titles = {
            'tea': 'TEA - Sequência Musical', 'tdah': 'TDAH - Ritmos Dinâmicos',
            'down': 'Síndrome de Down - Organização Cultural', 'intellectual': 'Deficiência Intelectual - Memória Cultural',
            'visual': 'Deficiência Visual - Reconhecimento Auditivo', 'motor': 'Deficiência Motora - Construção de Ritmos'
        };
        return titles[this.adaptationType] || 'Avaliação Adaptada';
    }

    createGameAnswerLog(duration) {
        // ... (o restante do método continua igual)
    }
}