// src/adaptive/index.js
// Módulo Principal do Sistema Adaptativo

// Exporta principais funções do roteador
export {
    routeAssessment,
    startAdaptiveGame,
    determineAdaptationType
} from './core/router.js';

// Exporta o gerenciador de jogos
export { AdaptiveGameManager } from './core/gameManager.js';

// Exporta todos os jogos individuais
export { MemoryGame } from './games/memoryGame.js';
export { SequenceGame } from './games/sequenceGame.js';
export { SpeedMatchingGame } from './games/speedMatching.js';
export { ClassificationGame } from './games/classification.js';
export { AudioMemoryGame } from './games/audioMemory.js';
export { ClickSequenceGame } from './games/clickSequence.js';
export { StoryAdventureGame } from './games/storyAdventure.js';
export { PatternRecognitionGame } from './games/patternRecognition.js';

// Configuração do sistema adaptativo
export const ADAPTIVE_CONFIG = {
    VERSION: '2.0.0',
    SUPPORTED_TYPES: ['tea', 'tdah', 'down', 'intellectual', 'visual', 'motor'],
    GAME_TYPES: [
        'memory', 'memory_enhanced', 'sequence', 'matching_speed',
        'classification', 'audio_memory', 'click_sequence',
        'story_adventure', 'pattern_recognition'
    ],
    MAX_LEVEL: 5,
    DEFAULT_GAME: 'memory'
};

console.log('🎯 Sistema Adaptativo v2.0.0 - Módulos carregados com sucesso!');