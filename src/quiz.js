// src/quiz.js - VERSÃO CORRIGIDA E ROBUSTA

import { state, dom, updateState } from './state.js';
import { showScreen } from './navigation.js';
import { getAssessmentData, saveSubmission } from './database.js';
import { showConfirmationModal, handleVisibilityChange } from './ui.js';
import { routeAssessment } from './adaptation.js';
import { logService } from './services/logService.js';

/**
 * Ponto de entrada principal para iniciar o fluxo da avaliação.
 * Valida os dados do aluno e busca os dados da avaliação.
 */
export async function startAssessmentFlow() {
    try {
        if (!state.currentStudent?.id || !state.currentStudent?.grade) {
            logService.critical('startAssessmentFlow chamado sem dados de estudante válidos.', { student: state.currentStudent });
            showErrorOnLogin('Erro: Dados do estudante estão incompletos. Por favor, reinicie o processo.');
            return;
        }

        logService.info('Iniciando fluxo da avaliação', { studentName: state.currentStudent.name, grade: state.currentStudent.grade });

        const assessment = await getAssessmentData(parseInt(state.currentStudent.grade, 10));

        const validationError = validateAssessmentData(assessment);
        if (validationError) {
            logService.error('Falha na validação dos dados da avaliação.', { error: validationError, assessmentId: assessment?.id });
            showErrorOnLogin(validationError);
            return;
        }

        logService.info('Avaliação carregada com sucesso.', { title: assessment.title, questionCount: assessment.questions.length });
        
        // O roteador de adaptação decidirá qual tipo de prova iniciar.
        routeAssessment(assessment);

    } catch (error) {
        logService.critical('Erro crítico no fluxo de inicialização da avaliação.', { error });
        showErrorOnLogin('Ocorreu um erro inesperado ao carregar a avaliação. Tente novamente.');
    }
}

/**
 * Valida a integridade dos dados da avaliação recebidos do banco.
 * @param {object} assessment - O objeto da avaliação.
 * @returns {string|null} - Uma string de erro se inválido, ou null se válido.
 */
function validateAssessmentData(assessment) {
    if (!assessment || !assessment.id) {
        return `Nenhuma prova foi encontrada para o ${state.currentStudent.grade}º ano. Por favor, verifique com o professor.`;
    }
    if (!assessment.questions || !Array.isArray(assessment.questions) || assessment.questions.length === 0) {
        return `A prova para o ${state.currentStudent.grade}º ano não contém questões.`;
    }
    for (const [index, q] of assessment.questions.entries()) {
        if (!q.id || !q.question_text) {
            return `A questão ${index + 1} possui uma estrutura inválida.`;
        }
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            return `A questão ${index + 1} ("${q.question_text.substring(0, 20)}...") não possui opções suficientes.`;
        }
        if (q.options.filter(opt => opt.isCorrect === true).length !== 1) {
            return `A questão ${index + 1} ("${q.question_text.substring(0, 20)}...") deve ter exatamente uma resposta correta.`;
        }
    }
    return null; // Validação passou
}

/**
 * Inicia a prova no formato padrão de múltipla escolha.
 * @param {object} assessmentData - Os dados da avaliação.
 */
export function startStandardAssessment(assessmentData) {
    try {
        // Embaralha as questões para cada aluno e as opções de cada questão
        const processedQuestions = shuffleArray(assessmentData.questions).map(q => ({
            ...q,
            options: shuffleArray(q.options)
        }));

        updateState({
            currentAssessment: { ...assessmentData, questions: processedQuestions },
            currentQuestionIndex: 0,
            score: 0,
            answerLog: [],
            questionStartTime: null,
            assessmentStartTime: Date.now()
        });

        const studentInfo = `<b>Aluno(a):</b> ${state.currentStudent.name} | <b>Turma:</b> ${state.currentStudent.grade}º Ano ${state.currentStudent.className}`;
        dom.quiz.studentInfoDisplay.innerHTML = studentInfo;

        loadQuestion();
        showScreen('quiz');

        // Adiciona monitoramento de visibilidade da aba
        document.addEventListener('visibilitychange', handleVisibilityChange);

        logService.info('Prova padrão iniciada.', { studentId: state.currentStudent.id, assessmentId: assessmentData.id });

    } catch (error) {
        logService.critical('Erro ao iniciar a avaliação padrão.', { error });
        alert('Ocorreu um erro crítico ao iniciar a prova. A página será recarregada.');
        window.location.reload();
    }
}

/**
 * Algoritmo de Fisher-Yates para embaralhar um array de forma imparcial.
 * @param {Array} array - O array a ser embaralhado.
 * @returns {Array} - Um novo array com os elementos embaralhados.
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
 * Carrega a questão atual na interface do quiz.
 */
function loadQuestion() {
    try {
        const question = state.currentAssessment.questions[state.currentQuestionIndex];

        updateState({ questionStartTime: Date.now() });

        // Atualiza UI
        dom.quiz.progress.textContent = `Pergunta ${state.currentQuestionIndex + 1} de ${state.currentAssessment.questions.length}`;
        dom.quiz.question.textContent = question.question_text;
        dom.quiz.baseTextDesktop.innerHTML = state.currentAssessment.baseText || '';
        dom.quiz.baseTextMobile.innerHTML = state.currentAssessment.baseText || '';
        dom.quiz.feedback.textContent = '';
        dom.quiz.nextBtn.classList.add('hidden');

        // Renderiza as opções
        dom.quiz.optionsContainer.innerHTML = '';
        question.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.classList.add('option-btn');
            button.addEventListener('click', () => selectAnswer(button, option.isCorrect, question.id));
            dom.quiz.optionsContainer.appendChild(button);
        });
    } catch (error) {
        logService.critical('Falha ao carregar a questão.', { questionIndex: state.currentQuestionIndex, error });
        dom.quiz.question.textContent = 'Erro ao carregar esta questão.';
        dom.quiz.optionsContainer.innerHTML = '<p class="text-red-600">Não foi possível exibir as opções. Por favor, notifique o professor.</p>';
    }
}

/**
 * Processa a resposta selecionada pelo aluno.
 * @param {HTMLButtonElement} selectedButton - O botão que foi clicado.
 * @param {boolean} isCorrect - Se a opção selecionada é a correta.
 * @param {string} questionId - O ID da questão respondida.
 */
function selectAnswer(selectedButton, isCorrect, questionId) {
    const duration = Math.round((Date.now() - state.questionStartTime) / 1000);

    state.answerLog.push({
        questionId: questionId,
        isCorrect: isCorrect,
        duration: Math.max(1, duration) // Garante que a duração seja no mínimo 1s
    });

    if (isCorrect) {
        updateState({ score: state.score + 1 });
        dom.quiz.feedback.textContent = "Resposta Correta!";
        dom.quiz.feedback.style.color = 'green';
    } else {
        dom.quiz.feedback.textContent = "Resposta Incorreta.";
        dom.quiz.feedback.style.color = 'red';
    }

    // Feedback visual para todas as opções
    const allOptions = dom.quiz.optionsContainer.querySelectorAll('.option-btn');
    const questions = state.currentAssessment.questions[state.currentQuestionIndex];
    allOptions.forEach(btn => {
        btn.disabled = true;
        const optionText = btn.textContent;
        const originalOption = questions.options.find(opt => opt.text === optionText);
        if (originalOption?.isCorrect) {
            btn.classList.add('correct');
        } else if (btn === selectedButton && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    // Configura o botão de "Próxima"
    dom.quiz.nextBtn.classList.remove('hidden');
    if (state.currentQuestionIndex === state.currentAssessment.questions.length - 1) {
        dom.quiz.nextBtn.textContent = "Finalizar Avaliação";
    } else {
        dom.quiz.nextBtn.textContent = "Próxima Pergunta";
    }
}

/**
 * Avança para a próxima questão ou inicia o processo de finalização.
 */
function nextQuestion() {
    if (state.currentQuestionIndex < state.currentAssessment.questions.length - 1) {
        updateState({ currentQuestionIndex: state.currentQuestionIndex + 1 });
        loadQuestion();
    } else {
        showConfirmationModal();
    }
}

/**
 * Finaliza a avaliação, salva os dados e mostra a tela de resultados.
 */
export async function finishAssessment() {
    logService.info('Iniciando finalização da avaliação.', { studentId: state.currentStudent.id });
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    const totalDuration = Math.round((Date.now() - state.assessmentStartTime) / 1000);
    const submissionData = {
        studentId: state.currentStudent.id,
        assessmentId: state.currentAssessment.id,
        score: state.score,
        totalQuestions: state.currentAssessment.questions.length,
        totalDuration: Math.max(1, totalDuration),
        answerLog: state.answerLog,
        // Inclui metadados para o modo offline
        studentName: state.currentStudent.name,
        assessmentTitle: state.currentAssessment.title,
        grade: state.currentStudent.grade,
        classId: state.currentStudent.classId,
        className: state.currentStudent.className
    };

    displayFinalScore(submissionData.score, submissionData.totalQuestions);
    showScreen('results');
    dom.results.saveStatus.textContent = 'Salvando resultado...';

    const saveResult = await saveSubmission(submissionData);
    displaySaveResult(saveResult);

    // Bloqueia o dispositivo apenas se o salvamento (online ou offline) foi bem-sucedido
    if (saveResult.success) {
        localStorage.setItem('deviceLocked', 'true');
    }
}

/**
 * Exibe a pontuação final na tela de resultados.
 */
function displayFinalScore(score, totalQuestions) {
    const finalScore = totalQuestions > 0 ? (score * 10 / totalQuestions) : 0;
    dom.results.score.textContent = `${score} / ${totalQuestions}`;
    dom.results.decimalScore.textContent = finalScore.toFixed(1).replace('.', ',');
}

/**
 * Exibe o status do salvamento (sincronizado, offline, erro).
 */
function displaySaveResult(result) {
    if (result.error === 'duplicate' || result.error === 'duplicate_local') {
        dom.results.saveStatus.textContent = "Atenção: Este resultado já foi salvo anteriormente.";
        dom.results.saveStatus.style.color = 'orange';
    } else if (result.success && result.synced) {
        dom.results.saveStatus.textContent = "Resultado salvo e sincronizado com sucesso!";
        dom.results.saveStatus.style.color = 'green';
    } else if (result.success && !result.synced) {
        dom.results.saveStatus.textContent = "Resultado salvo localmente. Será sincronizado depois.";
        dom.results.saveStatus.style.color = '#d97706'; // amber-600
    } else {
        dom.results.saveStatus.textContent = `Erro ao salvar: ${result.details || 'Tente novamente.'}`;
        dom.results.saveStatus.style.color = 'red';
    }
}

/**
 * Mostra uma mensagem de erro na tela de login.
 */
function showErrorOnLogin(message) {
    dom.login.errorMessage.textContent = message;
    dom.login.errorMessage.classList.remove('hidden');
    showScreen('login');
}

/**
 * Inicializa os listeners de eventos para a tela do quiz.
 */
export function initializeQuizScreen() {
    // Garante que o listener não seja duplicado
    dom.quiz.nextBtn.replaceWith(dom.quiz.nextBtn.cloneNode(true));
    dom.quiz.nextBtn = document.getElementById('next-btn'); // Reatribui a referência do DOM
    dom.quiz.nextBtn.addEventListener('click', nextQuestion);
}