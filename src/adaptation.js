// src/adaptation.js

import { state, dom, updateState } from './state.js';
import { startStandardAssessment, finishAssessment } from './quiz.js';
import { showScreen } from './navigation.js';

// --- Variáveis de estado para a atividade de arrastar e soltar ---
let dragDropLevels;
let currentDragDropLevelIndex;
let scoreDragDrop;
let draggedItem = null;
let adaptedAssessmentId = null; // Guardará o ID da avaliação original

// ===================================================================================
// ROTEADOR PRINCIPAL DE ADAPTAÇÕES
// ===================================================================================

export function routeAssessment(assessmentData) {
    const adaptationDetails = state.currentStudent.adaptationDetails;

    console.log('ADAPTATION_ROUTER: A avaliar aluno:', state.currentStudent.name);

    if (!adaptationDetails || !adaptationDetails.needs || adaptationDetails.needs.length === 0) {
        console.log('ADAPTATION_ROUTER: Nenhuma necessidade de adaptação encontrada. A iniciar prova padrão.');
        startStandardAssessment(assessmentData);
        return;
    }

    console.log('ADAPTATION_ROUTER: Necessidades encontradas:', adaptationDetails.needs);
    adaptedAssessmentId = assessmentData.id; // Guarda o ID da prova original para o resultado final
    const needs = adaptationDetails.needs;

    if (needs.includes('coordenação_motora') || needs.includes('pareamento')) {
        console.log('ADAPTATION_ROUTER: A encaminhar para a atividade de Arrastar e Soltar.');
        startDragDropAssessment();
    } else if (needs.includes('textos_curtos') || needs.includes('poucas_alternativas')) {
        console.log('ADAPTATION_ROUTER: A encaminhar para o Quiz Simplificado.');
        startSimpleQuizAssessment(assessmentData);
    } else {
        console.warn('ADAPTATION_ROUTER: Necessidades encontradas, mas nenhum modelo corresponde. A usar a prova padrão como fallback.');
        startStandardAssessment(assessmentData);
    }
}

// ===================================================================================
// LÓGICA DO QUIZ SIMPLIFICADO
// ===================================================================================

function startSimpleQuizAssessment(assessmentData) {
    const simplifiedQuestions = assessmentData.questions
        .sort((a, b) => a.question_text.length - b.question_text.length)
        .slice(0, 5);

    const finalQuestions = simplifiedQuestions.map(q => {
        const correctAnswer = q.options.find(opt => opt.isCorrect);
        const incorrectAnswers = q.options.filter(opt => !opt.isCorrect);
        const randomIncorrectAnswer = incorrectAnswers[Math.floor(Math.random() * incorrectAnswers.length)];
        let newOptions = [correctAnswer, randomIncorrectAnswer];
        if (Math.random() > 0.5) {
            newOptions = [randomIncorrectAnswer, correctAnswer];
        }
        return { ...q, options: newOptions };
    });

    const adaptedAssessment = {
        ...assessmentData,
        title: `${assessmentData.title} (Adaptada)`,
        questions: finalQuestions,
    };

    startStandardAssessment(adaptedAssessment);
}


// ===================================================================================
// LÓGICA DA AVALIAÇÃO DE ARRASTAR E SOLTAR (DRAG & DROP)
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
        targetEl.innerHTML = target.id.length > 3 ? `<span class="text-6xl" style="filter: brightness(0) opacity(0.3);">${target.content}</span>` : `<div style="filter: brightness(0) opacity(0.3);">${target.content}</div>`;
        
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

function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }

function handleDrop(e) {
    e.preventDefault();
    const targetEl = e.currentTarget;
    targetEl.classList.remove('drag-over');

    if (draggedItem && draggedItem.id.split('-')[1] === targetEl.dataset.targetId) {
        targetEl.innerHTML = draggedItem.innerHTML;
        targetEl.classList.add('correct-drop');
        draggedItem.remove();
        draggedItem = null;
        scoreDragDrop++;
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
        // CORREÇÃO: Passa os dados corretos para a função de finalizar
        const totalQuestions = dragDropLevels.reduce((acc, level) => acc + level.items.length, 0);
        updateState({
            score: scoreDragDrop,
            currentAssessment: {
                id: adaptedAssessmentId, // Usa o ID da avaliação original
                questions: { length: totalQuestions },
                title: 'Atividade de Associação'
            },
            answerLog: [{ type: 'drag-drop', correct: scoreDragDrop, total: totalQuestions }]
        });
        finishAssessment();
    }
}