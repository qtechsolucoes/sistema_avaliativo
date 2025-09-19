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

    // CORREÇÃO: Lógica mais robusta para determinar o tipo de adaptação
    if (needs.includes('coordenacao_motora') || needs.includes('pareamento')) {
        console.log('ADAPTATION_ROUTER: Encaminhando para atividade de Arrastar e Soltar.');
        startDragDropAssessment();
    } else if (needs.includes('textos_curtos') || needs.includes('poucas_alternativas')) {
        console.log('ADAPTATION_ROUTER: Encaminhando para Quiz Simplificado.');
        startSimpleQuizAssessment(assessmentData);
    } else {
        console.warn('ADAPTATION_ROUTER: Necessidades não reconhecidas. Usando prova padrão como fallback.');
        startStandardAssessment(assessmentData);
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
    
    // Analisa diagnosis para determinar necessidades
    if (realData.diagnosis && Array.isArray(realData.diagnosis)) {
        realData.diagnosis.forEach(diag => {
            const diagLower = diag.toLowerCase();
            
            if (diagLower.includes('tea') || diagLower.includes('autis')) {
                // TEA geralmente precisa de textos curtos e poucas alternativas
                needs.push('textos_curtos');
                needs.push('poucas_alternativas');
            }
            
            if (diagLower.includes('tdah') || diagLower.includes('atenção') || diagLower.includes('concentração')) {
                needs.push('textos_curtos');
                needs.push('poucas_alternativas');
            }
            
            if (diagLower.includes('deficiência motora') || diagLower.includes('coordenação motora')) {
                needs.push('coordenacao_motora');
                needs.push('pareamento');
            }
            
            if (diagLower.includes('síndrome de down') || diagLower.includes('deficiência intelectual')) {
                needs.push('coordenacao_motora');
                needs.push('pareamento');
            }
            
            if (diagLower.includes('deficiência mental') || diagLower.includes('retardo mental')) {
                needs.push('coordenacao_motora');
                needs.push('pareamento');
            }
        });
    }
    
    // Analisa suggestions para confirmar necessidades
    if (realData.suggestions && Array.isArray(realData.suggestions)) {
        realData.suggestions.forEach(sugg => {
            const suggLower = sugg.toLowerCase();
            
            if (suggLower.includes('textos curtos') || suggLower.includes('poucas alternativas') || 
                suggLower.includes('poucas opções')) {
                if (!needs.includes('textos_curtos')) needs.push('textos_curtos');
                if (!needs.includes('poucas_alternativas')) needs.push('poucas_alternativas');
            }
            
            if (suggLower.includes('coordenação motora') || suggLower.includes('pareamento')) {
                if (!needs.includes('coordenacao_motora')) needs.push('coordenacao_motora');
                if (!needs.includes('pareamento')) needs.push('pareamento');
            }
        });
    }
    
    // Analisa difficulties para identificar necessidades adicionais
    if (realData.difficulties && Array.isArray(realData.difficulties)) {
        realData.difficulties.forEach(diff => {
            const diffLower = diff.toLowerCase();
            
            if (diffLower.includes('coordenação motora') || diffLower.includes('coordenação')) {
                if (!needs.includes('coordenacao_motora')) needs.push('coordenacao_motora');
                if (!needs.includes('pareamento')) needs.push('pareamento');
            }
            
            if (diffLower.includes('atenção') || diffLower.includes('concentração') || 
                diffLower.includes('textos longos')) {
                if (!needs.includes('textos_curtos')) needs.push('textos_curtos');
                if (!needs.includes('poucas_alternativas')) needs.push('poucas_alternativas');
            }
        });
    }
    
    // Remove duplicatas
    const uniqueNeeds = [...new Set(needs)];
    
    console.log('Necessidades extraídas dos dados reais:', uniqueNeeds);
    return uniqueNeeds;
}

// ===================================================================================
// LÓGICA DO QUIZ SIMPLIFICADO - CORRIGIDA
// ===================================================================================

function startSimpleQuizAssessment(assessmentData) {
    // CORREÇÃO: Garante que há questões suficientes
    if (!assessmentData.questions || assessmentData.questions.length === 0) {
        console.error('Erro: Nenhuma questão disponível para adaptação');
        alert('Erro: Não foi possível carregar a avaliação adaptada.');
        return;
    }

    // Seleciona as 5 questões mais curtas (ou todas, se houver menos de 5)
    const simplifiedQuestions = assessmentData.questions
        .sort((a, b) => a.question_text.length - b.question_text.length)
        .slice(0, Math.min(5, assessmentData.questions.length));

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

        const randomIncorrectAnswer = incorrectAnswers[Math.floor(Math.random() * incorrectAnswers.length)];
        let newOptions = [correctAnswer, randomIncorrectAnswer];
        
        // Embaralha as duas opções
        if (Math.random() > 0.5) {
            newOptions = [randomIncorrectAnswer, correctAnswer];
        }
        
        return { ...q, options: newOptions };
    });

    const adaptedAssessment = {
        ...assessmentData,
        title: `${assessmentData.title} (Adaptada - Simplificada)`,
        questions: finalQuestions,
    };

    startStandardAssessment(adaptedAssessment);
}

// ===================================================================================
// LÓGICA DA AVALIAÇÃO DE ARRASTAR E SOLTAR - CORRIGIDA
// ===================================================================================

function startDragDropAssessment() {
    dragDropLevels = [
        {
            instruction: 'Arraste cada forma geométrica para a sua sombra.',
            items: [
                { id: 'circle', content: '<svg width="80" height="80"><circle cx="40" cy="40" r="38" fill="#3b82f6"/></svg>' },
                { id: 'square', content: '<svg width="80" height="80"><rect x="2" y="2" width="76" height="76" fill="#10b981"/></svg>' },
                { id: 'triangle', content: '<svg width="80" height="80"><polygon points="40,2 78,78 2,78" fill="#f97316"/></svg>' },
                { id: 'star', content: '<svg width="80" height="80"><polygon points="40,2 49,29 78,32 56,53 62,80 40,66 18,80 24,53 2,32 31,29" fill="#eab308"/></svg>' }
            ]
        },
        {
            instruction: 'Arraste cada animal para o seu contorno.',
            items: [
                { id: 'cat', content: '<span>🐈</span>' },
                { id: 'dog', content: '<span>🐕</span>' },
                { id: 'bird', content: '<span>🐦</span>' },
                { id: 'fish', content: '<span>🐠</span>' }
            ]
        }
    ];

    currentDragDropLevelIndex = 0;
    scoreDragDrop = 0;
    
    // CORREÇÃO: Calcula o total de itens corretamente
    totalItemsInAssessment = dragDropLevels.reduce((total, level) => total + level.items.length, 0);
    
    updateState({ assessmentStartTime: Date.now() });
    
    loadDragDropLevel(currentDragDropLevelIndex);
    showScreen('dragDrop');
    dom.dragDrop.nextBtn.addEventListener('click', handleNextDragDropLevel);
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
        draggedItem.remove();
        draggedItem = null;
        scoreDragDrop++; // CORREÇÃO: Incrementa por ITEM correto, não por nível
        checkLevelCompletion();
    } else if (draggedItem) {
        draggedItem.classList.remove('dragging');
        dom.dragDrop.feedback.textContent = "Tente novamente!";
        dom.dragDrop.feedback.style.color = 'red';
        setTimeout(() => dom.dragDrop.feedback.textContent = '', 1500);
        draggedItem = null;
    }
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