// src/adaptation.js - VERSÃO CORRIGIDA

import { state, dom, updateState } from './state.js';
import { startStandardAssessment, finishAssessment } from './quiz.js';
import { showScreen } from './navigation.js';

// --- Variáveis de estado para a atividade de arrastar e soltar ---
let dragDropLevels;
let currentDragDropLevelIndex;
let scoreDragDrop;
let draggedItem = null;
let adaptedAssessmentId = null;
let totalItemsInAssessment = 0; // CORREÇÃO: Rastrear total de itens para cálculo correto

// ===================================================================================
// ROTEADOR PRINCIPAL DE ADAPTAÇÕES
// ===================================================================================

export function routeAssessment(assessmentData) {
    const adaptationDetails = parseAdaptationDetails(state.currentStudent.adaptationDetails);

    console.log('ADAPTATION_ROUTER: Avaliando aluno:', state.currentStudent.name);

    if (!adaptationDetails || !adaptationDetails.needs || adaptationDetails.needs.length === 0) {
        console.log('ADAPTATION_ROUTER: Nenhuma necessidade de adaptação encontrada. Iniciando prova padrão.');
        startStandardAssessment(assessmentData);
        return;
    }

    console.log('ADAPTATION_ROUTER: Necessidades encontradas:', adaptationDetails.needs);
    adaptedAssessmentId = assessmentData.id;
    const needs = adaptationDetails.needs;

    // Aplica customizações visuais e de interface baseadas nas necessidades
    applyInterfaceCustomizations(adaptationDetails);

    // CORREÇÃO: Lógica mais robusta para determinar o tipo de adaptação
    if (needs.includes('coordenacao_motora') || needs.includes('pareamento')) {
        console.log('ADAPTATION_ROUTER: Encaminhando para atividade de Arrastar e Soltar.');
        startDragDropAssessment(adaptationDetails);
    } else if (needs.includes('textos_curtos') || needs.includes('poucas_alternativas')) {
        console.log('ADAPTATION_ROUTER: Encaminhando para Quiz Simplificado.');
        startSimpleQuizAssessment(assessmentData, adaptationDetails);
    } else {
        console.warn('ADAPTATION_ROUTER: Necessidades não reconhecidas. Usando prova padrão como fallback.');
        startStandardAssessment(assessmentData);
    }
}

// ===================================================================================
// GERENCIADOR DE CUSTOMIZAÇÕES DE INTERFACE
// ===================================================================================

/**
 * Aplica customizações visuais e de interface baseadas nas necessidades do estudante
 * @param {Object} adaptationDetails - Detalhes de adaptação do estudante
 */
function applyInterfaceCustomizations(adaptationDetails) {
    const body = document.body;
    const mainContainer = document.getElementById('main-container');

    // Remove classes anteriores
    body.className = body.className.replace(/adaptive-\w+/g, '').replace(/reduced-stimuli/g, '').replace(/gamified-interface/g, '');

    if (!adaptationDetails.originalData) return;

    const originalData = adaptationDetails.originalData;
    const diagnosis = (originalData.diagnosis || []).join(' ').toLowerCase();
    const difficulties = (originalData.difficulties || []).join(' ').toLowerCase();
    const suggestions = (originalData.suggestions || []).join(' ').toLowerCase();

    console.log('ADAPTATION_UI: Aplicando customizações para:', diagnosis);

    // Customizações específicas por diagnóstico
    if (diagnosis.includes('tea') || diagnosis.includes('autis')) {
        // TEA: Interface reduzida com menos estímulos
        body.classList.add('reduced-stimuli', 'adaptive-interface');
        console.log('ADAPTATION_UI: Aplicando interface reduzida para TEA');
    }

    if (diagnosis.includes('tdah') || diagnosis.includes('hiperatividade')) {
        // TDAH: Interface focada com menos distrações
        body.classList.add('reduced-stimuli', 'adaptive-interface');
        console.log('ADAPTATION_UI: Aplicando interface focada para TDAH');
    }

    if (diagnosis.includes('síndrome de down') || diagnosis.includes('deficiência intelectual')) {
        // Down/DI: Interface gamificada e visual
        body.classList.add('gamified-interface', 'adaptive-interface', 'large-text');
        console.log('ADAPTATION_UI: Aplicando interface gamificada para Down/DI');
    }

    // Customizações baseadas em dificuldades específicas
    if (difficulties.includes('coordenação motora') || difficulties.includes('destreza')) {
        // Elementos maiores para facilitar interação
        body.classList.add('adaptive-interface', 'large-text');
        console.log('ADAPTATION_UI: Aplicando elementos maiores para dificuldades motoras');
    }

    if (difficulties.includes('visão') || difficulties.includes('visual')) {
        // Alto contraste e texto maior
        body.classList.add('adaptive-high-contrast', 'extra-large-text');
        console.log('ADAPTATION_UI: Aplicando alto contraste para dificuldades visuais');
    }

    // Customizações baseadas em sugestões
    if (suggestions.includes('alto contraste') || suggestions.includes('contraste')) {
        body.classList.add('adaptive-high-contrast');
        console.log('ADAPTATION_UI: Aplicando alto contraste por sugestão');
    }

    if (suggestions.includes('texto grande') || suggestions.includes('fonte grande')) {
        body.classList.add('extra-large-text');
        console.log('ADAPTATION_UI: Aplicando texto grande por sugestão');
    }
}

// ===================================================================================
// NOVA FUNÇÃO: VALIDAÇÃO ROBUSTA DE DADOS DE ADAPTAÇÃO
// ===================================================================================

/**
 * CORRIGIDA: Valida e converte os detalhes de adaptação com estrutura real do banco
 * @param {string|object} adaptationDetails - Dados de adaptação do estudante
 * @returns {object|null} - Objeto validado ou null se inválido
 */
function parseAdaptationDetails(adaptationDetails) {
    if (!adaptationDetails) return null;
    
    try {
        // Se for string, tenta fazer parse JSON
        const parsed = typeof adaptationDetails === 'string' ? 
            JSON.parse(adaptationDetails) : adaptationDetails;
        
        // Valida estrutura mínima
        if (!parsed || typeof parsed !== 'object') {
            console.warn('Detalhes de adaptação inválidos: não é um objeto');
            return null;
        }
        
        // CORREÇÃO: Converte estrutura real do banco para estrutura esperada
        const convertedNeeds = extractNeedsFromRealData(parsed);
        
        if (!convertedNeeds || convertedNeeds.length === 0) {
            console.warn('Nenhuma necessidade específica detectada nos dados de adaptação');
            return null;
        }
        
        return {
            needs: convertedNeeds,
            originalData: parsed
        };
        
    } catch (error) {
        console.warn('Erro ao processar detalhes de adaptação:', error);
        return null;
    }
}

/**
 * NOVA FUNÇÃO: Extrai necessidades dos dados reais do banco
 * @param {object} realData - Dados como estão no banco
 * @returns {Array} - Array de necessidades padronizadas
 */
function extractNeedsFromRealData(realData) {
    const needs = [];

    // Analisa diagnosis para determinar necessidades - pode ser string ou array
    const diagnosisData = realData.diagnosis || realData.diagnostic || [];
    const diagnosisArray = Array.isArray(diagnosisData) ? diagnosisData : [diagnosisData];

    diagnosisArray.forEach(diag => {
        if (!diag || typeof diag !== 'string') return;

        const diagLower = diag.toLowerCase();

        if (diagLower.includes('tea') || diagLower.includes('autis') || diagLower.includes('espectro autista')) {
            // TEA geralmente precisa de textos curtos e poucas alternativas
            needs.push('textos_curtos');
            needs.push('poucas_alternativas');
        }

        if (diagLower.includes('tdah') || diagLower.includes('atenção') || diagLower.includes('concentração') ||
            diagLower.includes('hiperatividade')) {
            needs.push('textos_curtos');
            needs.push('poucas_alternativas');
        }

        if (diagLower.includes('deficiência motora') || diagLower.includes('coordenação motora') ||
            diagLower.includes('deficiência física')) {
            needs.push('coordenacao_motora');
            needs.push('pareamento');
        }

        if (diagLower.includes('síndrome de down') || diagLower.includes('deficiência intelectual') ||
            diagLower.includes('down')) {
            needs.push('coordenacao_motora');
            needs.push('pareamento');
        }

        if (diagLower.includes('deficiência mental') || diagLower.includes('retardo mental') ||
            diagLower.includes('atraso cognitivo')) {
            needs.push('coordenacao_motora');
            needs.push('pareamento');
        }
    });
    
    // Analisa suggestions para confirmar necessidades - pode ser string ou array
    const suggestionsData = realData.suggestions || realData.adaptations || [];
    const suggestionsArray = Array.isArray(suggestionsData) ? suggestionsData : [suggestionsData];

    suggestionsArray.forEach(sugg => {
        if (!sugg || typeof sugg !== 'string') return;

        const suggLower = sugg.toLowerCase();

        if (suggLower.includes('texto') && (suggLower.includes('curto') || suggLower.includes('reduzido') || suggLower.includes('simples')) ||
            suggLower.includes('poucas alternativas') || suggLower.includes('poucas opções') ||
            suggLower.includes('menos alternativas') || suggLower.includes('reduzir opções')) {
            if (!needs.includes('textos_curtos')) needs.push('textos_curtos');
            if (!needs.includes('poucas_alternativas')) needs.push('poucas_alternativas');
        }

        if (suggLower.includes('coordenação motora') || suggLower.includes('pareamento') ||
            suggLower.includes('atividades motoras') || suggLower.includes('drag') ||
            suggLower.includes('arrastar') || suggLower.includes('soltar')) {
            if (!needs.includes('coordenacao_motora')) needs.push('coordenacao_motora');
            if (!needs.includes('pareamento')) needs.push('pareamento');
        }

        if (suggLower.includes('visual') || suggLower.includes('colorido') ||
            suggLower.includes('imagem') || suggLower.includes('figura')) {
            if (!needs.includes('coordenacao_motora')) needs.push('coordenacao_motora');
            if (!needs.includes('pareamento')) needs.push('pareamento');
        }
    });

    // Analisa difficulties para identificar necessidades adicionais - pode ser string ou array
    const difficultiesData = realData.difficulties || realData.challenges || [];
    const difficultiesArray = Array.isArray(difficultiesData) ? difficultiesData : [difficultiesData];

    difficultiesArray.forEach(diff => {
        if (!diff || typeof diff !== 'string') return;

        const diffLower = diff.toLowerCase();

        if (diffLower.includes('coordenação motora') || diffLower.includes('coordenação') ||
            diffLower.includes('motora') || diffLower.includes('destreza')) {
            if (!needs.includes('coordenacao_motora')) needs.push('coordenacao_motora');
            if (!needs.includes('pareamento')) needs.push('pareamento');
        }

        if (diffLower.includes('atenção') || diffLower.includes('concentração') ||
            diffLower.includes('foco') || diffLower.includes('textos longos') ||
            diffLower.includes('leitura') || diffLower.includes('compreensão')) {
            if (!needs.includes('textos_curtos')) needs.push('textos_curtos');
            if (!needs.includes('poucas_alternativas')) needs.push('poucas_alternativas');
        }
    });
    
    // Remove duplicatas
    const uniqueNeeds = [...new Set(needs)];
    
    console.log('Necessidades extraídas dos dados reais:', uniqueNeeds);
    return uniqueNeeds;
}

// ===================================================================================
// LÓGICA DO QUIZ SIMPLIFICADO - CORRIGIDA
// ===================================================================================

function startSimpleQuizAssessment(assessmentData, adaptationDetails) {
    // CORREÇÃO: Garante que há questões suficientes
    if (!assessmentData.questions || assessmentData.questions.length === 0) {
        console.error('Erro: Nenhuma questão disponível para adaptação');
        alert('Erro: Não foi possível carregar a avaliação adaptada.');
        return;
    }

    // Determina número de questões baseado no nível de dificuldade
    const maxQuestions = determineQuestionCount(adaptationDetails);

    // Seleciona as questões mais adequadas (mais curtas)
    const simplifiedQuestions = assessmentData.questions
        .sort((a, b) => a.question_text.length - b.question_text.length)
        .slice(0, Math.min(maxQuestions, assessmentData.questions.length));

    // CORREÇÃO: Valida que as questões têm opções antes de processar
    const finalQuestions = simplifiedQuestions.map(q => {
        if (!q.options || q.options.length === 0) {
            console.error('Questão sem opções:', q.id);
            return q; // Retorna questão original se houver problema
        }

        const correctAnswer = q.options.find(opt => opt.isCorrect);
        const incorrectAnswers = q.options.filter(opt => !opt.isCorrect);

        if (!correctAnswer || incorrectAnswers.length === 0) {
            console.warn('Questão com estrutura inválida, mantendo original:', q.id);
            return q; // Mantém questão original se não conseguir simplificar
        }

        // Simplifica o texto da questão se necessário
        const simplifiedQuestion = simplifyQuestionText(q.question_text, adaptationDetails);

        // Reduz número de opções baseado nas necessidades
        const optionCount = determineOptionCount(adaptationDetails);
        const selectedIncorrect = incorrectAnswers
            .sort(() => 0.5 - Math.random())
            .slice(0, optionCount - 1);

        let newOptions = [correctAnswer, ...selectedIncorrect];

        // Embaralha as opções
        newOptions = newOptions.sort(() => 0.5 - Math.random());

        return {
            ...q,
            question_text: simplifiedQuestion,
            options: newOptions
        };
    });

    const adaptedAssessment = {
        ...assessmentData,
        title: `${assessmentData.title} (Adaptada - Simplificada)`,
        questions: finalQuestions,
    };

    // Aplica estilos específicos para quiz simplificado
    applySimpleQuizStyles();

    startStandardAssessment(adaptedAssessment);
}

/**
 * Determina o número ideal de questões baseado nas necessidades do estudante
 */
function determineQuestionCount(adaptationDetails) {
    if (!adaptationDetails?.originalData) return 5;

    const diagnosis = (adaptationDetails.originalData.diagnosis || []).join(' ').toLowerCase();

    if (diagnosis.includes('deficiência intelectual') || diagnosis.includes('síndrome de down')) {
        return 3; // Menos questões para reduzir fadiga
    }

    if (diagnosis.includes('tdah') || diagnosis.includes('tea')) {
        return 4; // Número reduzido para manter foco
    }

    return 5; // Padrão
}

/**
 * Determina o número ideal de opções por questão
 */
function determineOptionCount(adaptationDetails) {
    if (!adaptationDetails?.originalData) return 2;

    const diagnosis = (adaptationDetails.originalData.diagnosis || []).join(' ').toLowerCase();

    if (diagnosis.includes('deficiência intelectual') || diagnosis.includes('síndrome de down')) {
        return 2; // Apenas 2 opções para facilitar escolha
    }

    if (diagnosis.includes('tdah') || diagnosis.includes('tea')) {
        return 2; // Reduz sobrecarga cognitiva
    }

    return 3; // Máximo 3 opções
}

/**
 * Simplifica o texto da questão baseado nas necessidades
 */
function simplifyQuestionText(text, adaptationDetails) {
    if (!adaptationDetails?.originalData) return text;

    const diagnosis = (adaptationDetails.originalData.diagnosis || []).join(' ').toLowerCase();

    // Para deficiência intelectual e Down, simplifica o vocabulário
    if (diagnosis.includes('deficiência intelectual') || diagnosis.includes('síndrome de down')) {
        return text
            .replace(/\b(fundamental|essencial|primordial)\b/gi, 'importante')
            .replace(/\b(posteriormente|subsequentemente)\b/gi, 'depois')
            .replace(/\b(anteriormente|previamente)\b/gi, 'antes')
            .replace(/\b(utilize|empregue)\b/gi, 'use')
            .replace(/\b(determine|estabeleça)\b/gi, 'encontre');
    }

    return text;
}

/**
 * Aplica estilos específicos para o quiz simplificado
 */
function applySimpleQuizStyles() {
    // Adiciona observer para aplicar estilos quando opções são criadas
    const observer = new MutationObserver(() => {
        const options = document.querySelectorAll('#options-container .option-btn');
        options.forEach(option => {
            if (!option.classList.contains('simple-quiz-option')) {
                option.classList.add('simple-quiz-option');
            }
        });
    });

    observer.observe(document.getElementById('options-container') || document.body, {
        childList: true,
        subtree: true
    });

    // Para parar o observer após 10 segundos (para não ficar rodando indefinidamente)
    setTimeout(() => observer.disconnect(), 10000);
}

// ===================================================================================
// LÓGICA DA AVALIAÇÃO DE ARRASTAR E SOLTAR - CORRIGIDA
// ===================================================================================

function startDragDropAssessment(adaptationDetails) {
    // Cria níveis adaptados baseados nas necessidades do estudante
    dragDropLevels = createAdaptedDragDropLevels(adaptationDetails);

    currentDragDropLevelIndex = 0;
    scoreDragDrop = 0;

    // CORREÇÃO: Calcula o total de itens corretamente
    totalItemsInAssessment = dragDropLevels.reduce((total, level) => total + level.items.length, 0);

    updateState({ assessmentStartTime: Date.now() });

    // Aplica customizações específicas para drag-drop
    applyDragDropCustomizations(adaptationDetails);

    loadDragDropLevel(currentDragDropLevelIndex);
    showScreen('dragDrop');
    dom.dragDrop.nextBtn.addEventListener('click', handleNextDragDropLevel);
}

/**
 * Cria níveis de drag-drop adaptados baseados nas necessidades do estudante
 */
function createAdaptedDragDropLevels(adaptationDetails) {
    const baseLevels = [
        {
            instruction: 'Arraste cada forma geométrica para a sua sombra.',
            difficulty: 'easy',
            items: [
                { id: 'circle', content: '<svg width="80" height="80"><circle cx="40" cy="40" r="38" fill="#3b82f6"/></svg>' },
                { id: 'square', content: '<svg width="80" height="80"><rect x="2" y="2" width="76" height="76" fill="#10b981"/></svg>' }
            ]
        },
        {
            instruction: 'Arraste cada animal para o seu lugar.',
            difficulty: 'medium',
            items: [
                { id: 'cat', content: '<span style="font-size: 3rem;">🐈</span>' },
                { id: 'dog', content: '<span style="font-size: 3rem;">🐕</span>' }
            ]
        },
        {
            instruction: 'Combine as cores.',
            difficulty: 'easy',
            items: [
                { id: 'red', content: '<div style="width: 60px; height: 60px; background: #ef4444; border-radius: 50%;"></div>' },
                { id: 'blue', content: '<div style="width: 60px; height: 60px; background: #3b82f6; border-radius: 50%;"></div>' }
            ]
        }
    ];

    if (!adaptationDetails?.originalData) return baseLevels;

    const diagnosis = (adaptationDetails.originalData.diagnosis || []).join(' ').toLowerCase();

    // Para Down e DI: mais níveis simples e visuais
    if (diagnosis.includes('síndrome de down') || diagnosis.includes('deficiência intelectual')) {
        return [
            {
                instruction: '🎯 Arraste cada emoji para o seu amigo!',
                difficulty: 'easy',
                items: [
                    { id: 'happy', content: '<span style="font-size: 4rem;">😊</span>' },
                    { id: 'sad', content: '<span style="font-size: 4rem;">😢</span>' }
                ]
            },
            {
                instruction: '🌈 Combine as cores iguais!',
                difficulty: 'easy',
                items: [
                    { id: 'red', content: '<div style="width: 80px; height: 80px; background: #ef4444; border-radius: 20px; border: 4px solid white;"></div>' },
                    { id: 'blue', content: '<div style="width: 80px; height: 80px; background: #3b82f6; border-radius: 20px; border: 4px solid white;"></div>' }
                ]
            }
        ];
    }

    // Para TEA e TDAH: menos estímulos, instruções mais claras
    if (diagnosis.includes('tea') || diagnosis.includes('tdah')) {
        return [
            {
                instruction: 'Arraste a forma para o lugar correto.',
                difficulty: 'easy',
                items: [
                    { id: 'circle', content: '<svg width="100" height="100"><circle cx="50" cy="50" r="45" fill="#3b82f6"/></svg>' },
                    { id: 'square', content: '<svg width="100" height="100"><rect x="5" y="5" width="90" height="90" fill="#10b981"/></svg>' }
                ]
            }
        ];
    }

    return baseLevels;
}

/**
 * Aplica customizações específicas para a interface drag-drop
 */
function applyDragDropCustomizations(adaptationDetails) {
    if (!adaptationDetails?.originalData) return;

    const diagnosis = (adaptationDetails.originalData.diagnosis || []).join(' ').toLowerCase();

    // Para Down e DI: adiciona recompensas visuais
    if (diagnosis.includes('síndrome de down') || diagnosis.includes('deficiência intelectual')) {
        // Adiciona efeitos sonoros (se disponível) e animações de recompensa
        const style = document.createElement('style');
        style.textContent = `
            .drag-item {
                animation: gentleBounce 2s infinite ease-in-out;
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            }
            @keyframes gentleBounce {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
            }
        `;
        document.head.appendChild(style);
    }

    console.log('ADAPTATION_DRAG_DROP: Customizações aplicadas para:', diagnosis);
}

function loadDragDropLevel(levelIndex) {
    const level = dragDropLevels[levelIndex];
    dom.dragDrop.instruction.textContent = level.instruction;
    dom.dragDrop.feedback.textContent = '';
    dom.dragDrop.nextBtn.classList.add('hidden');

    const itemsContainer = dom.dragDrop.itemsContainer;
    const targetsContainer = dom.dragDrop.targetsContainer;
    itemsContainer.innerHTML = '';
    targetsContainer.innerHTML = '';

    const shuffledItems = [...level.items].sort(() => Math.random() - 0.5);
    const shuffledTargets = [...level.items].sort(() => Math.random() - 0.5);

    shuffledItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.id = `drag-${item.id}`;
        itemEl.className = 'drag-item';
        itemEl.innerHTML = item.content;
        itemEl.draggable = true;
        itemEl.addEventListener('dragstart', handleDragStart);
        itemsContainer.appendChild(itemEl);
    });

    shuffledTargets.forEach(target => {
        const targetEl = document.createElement('div');
        targetEl.dataset.targetId = target.id;
        targetEl.className = 'drop-target';
        targetEl.innerHTML = target.id.length > 3 ? 
            `<span class="text-6xl" style="filter: brightness(0) opacity(0.3);">${target.content}</span>` : 
            `<div style="filter: brightness(0) opacity(0.3);">${target.content}</div>`;
        
        targetEl.addEventListener('dragover', handleDragOver);
        targetEl.addEventListener('dragleave', handleDragLeave);
        targetEl.addEventListener('drop', handleDrop);
        targetsContainer.appendChild(targetEl);
    });
}

function handleDragStart(e) {
    draggedItem = e.target;
    e.dataTransfer.setData('text/plain', e.target.id);
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function handleDragOver(e) { 
    e.preventDefault(); 
    e.currentTarget.classList.add('drag-over'); 
}

function handleDragLeave(e) { 
    e.currentTarget.classList.remove('drag-over'); 
}

function handleDrop(e) {
    e.preventDefault();
    const targetEl = e.currentTarget;
    targetEl.classList.remove('drag-over');

    if (draggedItem && draggedItem.id.split('-')[1] === targetEl.dataset.targetId) {
        targetEl.innerHTML = draggedItem.innerHTML;
        targetEl.classList.add('correct-drop');

        // Adiciona animação de celebração baseada nas necessidades do estudante
        celebrateCorrectDrop(targetEl);

        draggedItem.remove();
        draggedItem = null;
        scoreDragDrop++; // CORREÇÃO: Incrementa por ITEM correto, não por nível
        checkLevelCompletion();
    } else if (draggedItem) {
        draggedItem.classList.remove('dragging');
        provideEncouragingFeedback();
        draggedItem = null;
    }
}

/**
 * Celebra uma resposta correta com animação adaptada ao estudante
 */
function celebrateCorrectDrop(targetEl) {
    const adaptationDetails = parseAdaptationDetails(state.currentStudent.adaptationDetails);

    if (adaptationDetails?.originalData) {
        const diagnosis = (adaptationDetails.originalData.diagnosis || []).join(' ').toLowerCase();

        if (diagnosis.includes('síndrome de down') || diagnosis.includes('deficiência intelectual')) {
            // Animação mais expressiva para estudantes com Down/DI
            targetEl.classList.add('reward-animation');
            dom.dragDrop.feedback.textContent = "🎉 Muito bem! Parabéns! 🎉";
            dom.dragDrop.feedback.style.color = '#10b981';
            dom.dragDrop.feedback.style.fontSize = '1.5rem';

            // Remove animação após completar
            setTimeout(() => {
                targetEl.classList.remove('reward-animation');
                dom.dragDrop.feedback.style.fontSize = '1rem';
            }, 1000);
        } else {
            // Feedback padrão para outros tipos
            dom.dragDrop.feedback.textContent = "✅ Correto!";
            dom.dragDrop.feedback.style.color = '#10b981';
        }
    } else {
        // Feedback padrão
        dom.dragDrop.feedback.textContent = "✅ Correto!";
        dom.dragDrop.feedback.style.color = '#10b981';
    }

    setTimeout(() => dom.dragDrop.feedback.textContent = '', 2000);
}

/**
 * Fornece feedback encorajador adaptado ao estudante
 */
function provideEncouragingFeedback() {
    const adaptationDetails = parseAdaptationDetails(state.currentStudent.adaptationDetails);

    if (adaptationDetails?.originalData) {
        const diagnosis = (adaptationDetails.originalData.diagnosis || []).join(' ').toLowerCase();

        if (diagnosis.includes('síndrome de down') || diagnosis.includes('deficiência intelectual')) {
            // Feedback mais encorajador e positivo
            const encouragingMessages = [
                "😊 Quase lá! Tente outra vez!",
                "🌟 Você consegue! Tente de novo!",
                "💪 Continue tentando! Você é capaz!"
            ];
            const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
            dom.dragDrop.feedback.textContent = randomMessage;
        } else {
            // Feedback padrão
            dom.dragDrop.feedback.textContent = "Tente novamente!";
        }
    } else {
        dom.dragDrop.feedback.textContent = "Tente novamente!";
    }

    dom.dragDrop.feedback.style.color = '#f97316';
    setTimeout(() => dom.dragDrop.feedback.textContent = '', 1500);
}

function checkLevelCompletion() {
    if (dom.dragDrop.itemsContainer.children.length === 0) {
        dom.dragDrop.feedback.textContent = "Excelente! Nível concluído!";
        dom.dragDrop.feedback.style.color = 'green';
        dom.dragDrop.nextBtn.classList.remove('hidden');
    }
}

function handleNextDragDropLevel() {
    currentDragDropLevelIndex++;
    if (currentDragDropLevelIndex < dragDropLevels.length) {
        loadDragDropLevel(currentDragDropLevelIndex);
    } else {
        // CORREÇÃO: Usa o total correto de itens, não de níveis
        finalizeDragDropAssessment();
    }
}

// ===================================================================================
// NOVA FUNÇÃO: FINALIZAÇÃO CORRETA DA AVALIAÇÃO DRAG-DROP
// ===================================================================================

function finalizeDragDropAssessment() {
    // CORREÇÃO: Usa totalItemsInAssessment calculado corretamente
    updateState({
        score: scoreDragDrop,
        currentAssessment: {
            id: adaptedAssessmentId,
            questions: { length: totalItemsInAssessment }, // Total de itens, não níveis
            title: 'Atividade de Associação (Adaptada)'
        },
        answerLog: createDragDropAnswerLog()
    });
    
    console.log('DRAG_DROP: Finalizando com score:', scoreDragDrop, 'de', totalItemsInAssessment);
    finishAssessment();
}

// ===================================================================================
// NOVA FUNÇÃO: CRIAÇÃO DE LOG DE RESPOSTAS PARA DRAG-DROP
// ===================================================================================

/**
 * Cria um log de respostas compatível com o formato esperado pelo banco
 * @returns {Array} Array de objetos de resposta
 */
function createDragDropAnswerLog() {
    const answerLog = [];
    let questionIndex = 0;
    
    // Cria uma entrada para cada item nos níveis
    dragDropLevels.forEach((level, levelIndex) => {
        level.items.forEach((item, itemIndex) => {
            answerLog.push({
                questionId: `drag-drop-${levelIndex}-${itemIndex}`, // ID único para cada item
                isCorrect: questionIndex < scoreDragDrop, // Assume que os primeiros N foram corretos
                duration: 15, // Tempo estimado por item (pode ser melhorado)
                questionIndex: questionIndex,
                adaptationType: 'drag-drop'
            });
            questionIndex++;
        });
    });
    
    return answerLog;
}