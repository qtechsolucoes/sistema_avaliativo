// src/adaptive/core/router.js
// Roteamento Inteligente para Sistema Adaptativo (VERSÃO ATUALIZADA)

import { showScreen } from '../../navigation.js';
import { state } from '../../state.js';
import { AdaptiveGameManager } from './gameManager.js';
import { dataService } from '../../services/dataService.js';
import { startStandardAssessment as startStandardAssessmentQuiz } from '../../quiz.js';
// NOVA IMPORTAÇÃO DO ARQUIVO DE UTILIDADES
import { parseAdaptationDetails, determineAdaptationType } from './adaptiveUtils.js';

/**
 * Roteamento principal do sistema adaptativo
 * Analisa as necessidades do estudante e direciona automaticamente
 */
export async function routeAssessment(assessmentData) {
    console.log('ADAPTIVE_ROUTER: Iniciando roteamento automático');

    // USA A FUNÇÃO CENTRALIZADA PARA PARSE
    const adaptationDetailsObject = parseAdaptationDetails(state.currentStudent.adaptationDetails);

    if (!adaptationDetailsObject) {
        console.log('ADAPTIVE_ROUTER: Estudante sem necessidades especiais, usando avaliação padrão');
        return startStandardAssessment(assessmentData);
    }

    console.log('ADAPTIVE_ROUTER: Estudante com necessidades especiais detectado:', adaptationDetailsObject);

    // USA A FUNÇÃO CENTRALIZADA PARA DETERMINAR O TIPO
    const adaptationType = determineAdaptationType(adaptationDetailsObject);
    const optimalActivityType = determineOptimalActivityType(adaptationDetailsObject, adaptationType);

    console.log('ADAPTIVE_ROUTER: Atividade ótima determinada:', optimalActivityType);

    // Inicia automaticamente a atividade adequada
    await startOptimalActivity(optimalActivityType, adaptationDetailsObject, assessmentData);
}

/**
 * Determina a atividade ótima baseada em pesquisa pedagógica
 * (Esta função permanece aqui, pois é específica do roteamento)
 */
export function determineOptimalActivityType(adaptationDetails, adaptationType) {
    console.log('SMART_ROUTING: Determinando atividade ótima para:', adaptationType);

    const activityPreferences = {
        'tea': {
            primary: 'adaptive_game',
            gameType: 'sequence_musical',
            reason: 'TEA: Sequência Musical Avançada - organiza períodos musicais cronologicamente'
        },
        'tdah': {
            primary: 'adaptive_game',
            gameType: 'rhythm_turbo',
            reason: 'TDAH: Ritmos PE Turbo Challenge - mantém atenção com atividade dinâmica'
        },
        'down': {
            primary: 'adaptive_game',
            gameType: 'cultural_organizer',
            reason: 'Síndrome de Down: Organizador Cultural Feliz - classificação com feedback positivo'
        },
        'intellectual': {
            primary: 'adaptive_game',
            gameType: 'memory_cultural',
            reason: 'Deficiência Intelectual: Memória Cultural Simples - desenvolvimento cognitivo gradual'
        },
        'visual': {
            primary: 'adaptive_game',
            gameType: 'audio_recognition',
            reason: 'Deficiência Visual: Reconhecimento de Ritmos - foca em habilidades auditivas'
        },
        'motor': {
            primary: 'adaptive_game',
            gameType: 'rhythm_builder',
            reason: 'Deficiência Motora: Construtor de Ritmos - interações simples e acessíveis'
        }
    };

    const preference = activityPreferences[adaptationType] || activityPreferences['intellectual'];
    console.log('SMART_ROUTING: Escolha baseada em pesquisa:', preference.reason);

    return {
        type: preference.primary,
        gameType: preference.gameType,
        reason: preference.reason
    };
}

/**
 * Inicia automaticamente a atividade ótima determinada
 */
async function startOptimalActivity(activityChoice, adaptationDetails, assessmentData) {
    console.log('ADAPTIVE_ROUTER: Iniciando atividade automática:', activityChoice);

    // Aplica customizações de interface baseadas na adaptação
    applyInterfaceCustomizations(adaptationDetails);

    if (activityChoice.type === 'adaptive_game') {
        await startAdaptiveGame(adaptationDetails, activityChoice.gameType);
    } else if (activityChoice.type === 'simple_quiz') {
        startSimpleQuizAssessmentFallback(assessmentData, adaptationDetails);
    } else if (activityChoice.type === 'drag_drop') {
        startDragDropAssessment(adaptationDetails);
    } else {
        console.warn('ADAPTIVE_ROUTER: Tipo de atividade não reconhecido, usando jogo padrão');
        await startAdaptiveGame(adaptationDetails, 'memory');
    }
}

/**
 * Inicia um jogo adaptativo
 */
export async function startAdaptiveGame(adaptationDetails, gameType = 'auto') {
    console.log('ADAPTIVE_GAMES: Iniciando jogo adaptativo:', gameType);

    try {
        // Carrega dados específicos do banco para o tipo de adaptação
        const adaptationType = determineAdaptationType(adaptationDetails);
        const gameData = await dataService.getAdaptiveGames(adaptationType, state.currentStudent?.grade) || [];

        console.log('ADAPTIVE_GAMES: Dados carregados do banco:', gameData.length, 'jogos');

        if (gameType === 'auto') {
            gameType = determineOptimalActivityType(adaptationDetails).gameType;
        }

        // Aplica estilos específicos do jogo
        applyGameStyles(gameType, adaptationDetails);

        // Cria manager do jogo com dados do banco
        const gameManager = new AdaptiveGameManager(adaptationDetails, gameData);

        // Mostra tela de jogos
        showGameScreen(gameType);

        // Cria e inicia o jogo específico
        const game = gameManager.createGame(gameType);
        game.start();

        console.log('ADAPTIVE_GAMES: Jogo iniciado com sucesso:', gameType);

    } catch (error) {
        console.error('ADAPTIVE_GAMES: Erro ao iniciar jogo, usando fallback:', error);
        startAdaptiveGameFallback(adaptationDetails, gameType);
    }
}

/**
 * Aplica estilos específicos para cada tipo de jogo
 */
function applyGameStyles(gameType, adaptationDetails) {
    // Remove classes anteriores do body
    document.body.className = document.body.className.replace(/adaptation-\w+/g, '');

    // Aplica classe CSS baseada no tipo de adaptação
    const adaptationType = determineAdaptationType(adaptationDetails);
    if (adaptationType) {
        document.body.classList.add(`adaptation-${adaptationType}`);
    }
}

/**
 * Mostra a tela do jogo
 */
function showGameScreen(gameType) {
    showScreen('adaptiveGames');
}

/**
 * Aplica customizações de interface baseadas na adaptação
 */
function applyInterfaceCustomizations(adaptationDetails) {
    const body = document.body;

    // Remove customizações anteriores
    body.classList.remove('adaptation-tea', 'adaptation-tdah', 'adaptation-down',
                         'adaptation-intellectual', 'adaptation-visual', 'adaptation-motor');

    const adaptationType = determineAdaptationType(adaptationDetails);
    if (adaptationType) {
        body.classList.add(`adaptation-${adaptationType}`);
        console.log('INTERFACE: Aplicando customizações para:', adaptationType);
    }
}

// Funções auxiliares (implementações simplificadas para compatibilidade)
function startStandardAssessment(assessmentData) {
    console.log('ADAPTIVE_ROUTER: Iniciando avaliação padrão para estudante sem necessidades especiais');

    // Chama a função correta do quiz.js
    startStandardAssessmentQuiz(assessmentData);
}

function startSimpleQuizAssessmentFallback(assessmentData, adaptationDetails) {
    // Implementação do quiz simples
    console.log('Iniciando quiz simples');
}

function startDragDropAssessment(adaptationDetails) {
    // Implementação do drag and drop
    console.log('Iniciando drag and drop');
}

function startAdaptiveGameFallback(adaptationDetails, gameType) {
    console.log('Usando fallback para jogo:', gameType);
}

// --- FUNÇÕES REMOVIDAS ---
// A função determineAdaptationType foi movida para adaptiveUtils.js
// A função parseAdaptationDetails foi movida para adaptiveUtils.js