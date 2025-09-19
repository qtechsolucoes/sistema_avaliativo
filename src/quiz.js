// src/quiz.js

import { state, dom, updateState } from './state.js';
import { showScreen } from './navigation.js';
import { getAssessmentData, saveSubmission } from './database.js';
import { showConfirmationModal, handleVisibilityChange } from './ui.js';
import { routeAssessment } from './adaptation.js';

/**
 * Ponto de entrada principal para iniciar o fluxo da avaliação.
 */
export async function startAssessmentFlow() {
    const assessment = await getAssessmentData(state.currentStudent.grade);

    if (!assessment || !assessment.questions || assessment.questions.length === 0) {
        dom.login.errorMessage.textContent = `Não foi encontrada uma prova válida para o ${state.currentStudent.grade}º ano.`;
        dom.login.errorMessage.classList.remove('hidden');
        return;
    }
    
    // Entrega os dados da prova ao roteador de adaptação, que decidirá qual prova iniciar.
    routeAssessment(assessment);
}

/**
 * CORREÇÃO: Adicionada a palavra-chave 'export' para que outros módulos possam usar esta função.
 * Inicia a prova padrão (ou uma versão adaptada que usa a mesma interface).
 * @param {object} assessmentData - Os dados da prova a serem carregados.
 */
export function startStandardAssessment(assessmentData) {
    // Embaralha as questões para cada aluno
    const shuffledQuestions = shuffleArray(assessmentData.questions);

    updateState({ 
        currentAssessment: { ...assessmentData, questions: shuffledQuestions },
        assessmentStartTime: Date.now() 
    });
    
    dom.quiz.studentInfoDisplay.innerHTML = `<strong>Aluno:</strong> ${state.currentStudent.name}<br><strong>Turma:</strong> ${state.currentStudent.grade}º Ano ${state.currentStudent.className}`;
    
    loadQuestion();
    showScreen('quiz');
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Embaralha os elementos de um array.
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Carrega e exibe a questão atual na tela.
 */
function loadQuestion() {
    dom.quiz.nextBtn.classList.add('hidden');
    updateState({ questionStartTime: Date.now() });
    
    const questionData = state.currentAssessment.questions[state.currentQuestionIndex];
    
    dom.quiz.baseTextDesktop.innerHTML = state.currentAssessment.baseText;
    dom.quiz.baseTextMobile.innerHTML = state.currentAssessment.baseText;
    dom.quiz.progress.textContent = `Pergunta ${state.currentQuestionIndex + 1} de ${state.currentAssessment.questions.length}`;
    dom.quiz.question.textContent = questionData.question_text;
    dom.quiz.optionsContainer.innerHTML = '';
    dom.quiz.feedback.textContent = '';

    const correctAnswer = questionData.options.find(opt => opt.isCorrect).text;

    questionData.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.classList.add('option-btn');
        button.addEventListener('click', () => selectAnswer(button, correctAnswer, questionData.id));
        dom.quiz.optionsContainer.appendChild(button);
    });
}

/**
 * Processa a seleção de uma resposta pelo aluno.
 */
function selectAnswer(selectedButton, correctAnswer, questionId) {
    const duration = Math.round((Date.now() - state.questionStartTime) / 1000);
    const isCorrect = selectedButton.textContent === correctAnswer;

    state.answerLog.push({
        questionId: questionId,
        isCorrect: isCorrect,
        duration: duration,
        questionIndex: state.currentQuestionIndex
    });

    const allOptions = dom.quiz.optionsContainer.querySelectorAll('.option-btn');
    allOptions.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correctAnswer) {
            btn.classList.add('correct');
        } else if (btn === selectedButton) {
            btn.classList.add('incorrect');
        }
    });

    if (isCorrect) {
        updateState({ score: state.score + 1 });
        dom.quiz.feedback.textContent = "Resposta Correta!";
        dom.quiz.feedback.style.color = 'green';
    } else {
        dom.quiz.feedback.textContent = `Incorreto. A resposta certa era: "${correctAnswer}"`;
        dom.quiz.feedback.style.color = 'red';
    }
    
    dom.quiz.nextBtn.classList.remove('hidden');
    if (state.currentQuestionIndex === state.currentAssessment.questions.length - 1) {
        dom.quiz.nextBtn.textContent = "Finalizar Avaliação";
    }
}

/**
 * Avança para a próxima questão ou inicia o processo de finalização.
 */
function nextQuestion() {
    if (state.currentQuestionIndex === state.currentAssessment.questions.length - 1) {
        showConfirmationModal();
    } else {
        updateState({ currentQuestionIndex: state.currentQuestionIndex + 1 });
        loadQuestion();
    }
}

/**
 * Finaliza a avaliação, compila os dados e envia para salvamento.
 */
export async function finishAssessment() {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    const totalDuration = Math.round((Date.now() - state.assessmentStartTime) / 1000);

    const submissionData = {
        studentId: state.currentStudent.id,
        assessmentId: state.currentAssessment.id,
        score: state.score,
        totalQuestions: state.currentAssessment.questions.length,
        totalDuration: totalDuration,
        answerLog: state.answerLog
    };

    const saveResult = await saveSubmission(submissionData);
    
    if (saveResult.error === 'duplicate') {
        dom.results.saveStatus.textContent = "ERRO: Este aluno já concluiu a avaliação. Este novo resultado não foi salvo.";
        dom.results.saveStatus.style.color = 'red';
    } else if (saveResult.synced) {
        dom.results.saveStatus.textContent = "O seu resultado foi salvo e sincronizado com o sistema.";
        dom.results.saveStatus.style.color = '';
    } else {
        dom.results.saveStatus.textContent = "O seu resultado foi salvo localmente. Será sincronizado quando houver internet.";
        dom.results.saveStatus.style.color = '';
    }
    
    localStorage.setItem('deviceLocked', 'true');

    const finalScore = (state.score * 10 / state.currentAssessment.questions.length);
    dom.results.score.textContent = `${state.score} / ${state.currentAssessment.questions.length}`;
    dom.results.decimalScore.textContent = finalScore.toFixed(1).replace('.', ',');
    showScreen('results');
}

/**
 * Configura o event listener para o botão "Próxima Pergunta".
 */
export function initializeQuizScreen() {
    dom.quiz.nextBtn.addEventListener('click', nextQuestion);
}