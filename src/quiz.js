// src/quiz.js - VERSÃO CORRIGIDA E ROBUSTA

import { state, dom, updateState } from './state.js';
import { showScreen } from './navigation.js';
import { getAssessmentData, saveSubmission } from './database.js';
import { showConfirmationModal, handleVisibilityChange } from './ui.js';
import { routeAssessment } from './adaptive/index.js';
import { logService } from './services/logService.js';
import { HTMLSanitizer } from './utils/sanitizer.js';
import { connectivityService } from './services/connectivityService.js';
import { startQuestionTimer, stopQuestionTimer } from './utils/questionTimer.js';

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

        const studentInfo = `Aluno(a): ${state.currentStudent.name} | Turma: ${state.currentStudent.grade}º Ano ${state.currentStudent.className}`;
        HTMLSanitizer.setSafeText(dom.quiz.studentInfoDisplay, studentInfo);

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

        // Atualiza UI de forma segura
        HTMLSanitizer.setSafeText(dom.quiz.progress, `Pergunta ${state.currentQuestionIndex + 1} de ${state.currentAssessment.questions.length}`);
        HTMLSanitizer.setSafeText(dom.quiz.question, question.question_text);
        HTMLSanitizer.setSafeHTML(dom.quiz.baseTextDesktop, state.currentAssessment.baseText || '');
        HTMLSanitizer.setSafeHTML(dom.quiz.baseTextMobile, state.currentAssessment.baseText || '');

        // Inicializa controles de scroll do texto
        initializeTextScrollControls();
        HTMLSanitizer.setSafeText(dom.quiz.feedback, '');
        dom.quiz.nextBtn.classList.add('hidden');

        // Renderiza as opções de forma segura
        dom.quiz.optionsContainer.innerHTML = '';
        question.options.forEach(option => {
            const button = HTMLSanitizer.createSafeElement('button', option.text, 'option-btn');
            button.addEventListener('click', () => selectAnswer(button, option.isCorrect, question.id));
            dom.quiz.optionsContainer.appendChild(button);
        });

        // Inicia timer de 3 minutos para a questão
        startQuestionTimer({
            minTime: 180, // 3 minutos em segundos
            onUnblock: () => {
                // Quando desbloquear, habilita o botão se já tiver respondido
                if (!dom.quiz.nextBtn.classList.contains('hidden')) {
                    dom.quiz.nextBtn.disabled = false;
                }
            }
        });

        // Bloqueia o botão "Próxima" inicialmente
        dom.quiz.nextBtn.disabled = true;

    } catch (error) {
        logService.critical('Falha ao carregar a questão.', { questionIndex: state.currentQuestionIndex, error });
        HTMLSanitizer.setSafeText(dom.quiz.question, 'Erro ao carregar esta questão.');

        dom.quiz.optionsContainer.innerHTML = '';
        const errorMsg = HTMLSanitizer.createSafeElement('p', 'Não foi possível exibir as opções. Por favor, notifique o professor.', 'text-red-600');
        dom.quiz.optionsContainer.appendChild(errorMsg);
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

    // Usa updateState para consistência
    const newAnswer = {
        questionId: questionId,
        isCorrect: isCorrect,
        duration: Math.max(1, duration) // Garante que a duração seja no mínimo 1s
    };

    updateState({
        answerLog: [...state.answerLog, newAnswer]
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

    // Para e remove o timer
    stopQuestionTimer();

    const totalDuration = Math.round((Date.now() - state.assessmentStartTime) / 1000);

    // Debug: Verificar se os IDs estão presentes
    logService.debug('Dados para submissão:', {
        studentId: state.currentStudent.id,
        studentData: state.currentStudent,
        assessmentId: state.currentAssessment.id,
        assessmentData: state.currentAssessment
    });

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

    // Debug: Verificar dados completos da submissão
    logService.debug('Dados completos da submissão:', submissionData);

    displayFinalScore(submissionData.score, submissionData.totalQuestions);
    showScreen('results');
    dom.results.saveStatus.textContent = 'Verificando conectividade...';

    // Usa o serviço de conectividade para detectar automaticamente online/offline
    const connectivityResult = await connectivityService.saveWithConnectivityDetection(submissionData);

    let saveResult;

    if (connectivityResult.mode === 'online') {
        // Sistema online - salva no banco de dados normalmente
        dom.results.saveStatus.textContent = 'Salvando no banco de dados...';
        saveResult = await saveSubmission(submissionData);
    } else {
        // Sistema offline - já salvou no localStorage e fez download do JSON
        logService.info('Modo offline detectado - dados salvos localmente e JSON baixado', {
            localSave: connectivityResult.localSave,
            download: connectivityResult.download
        });

        saveResult = {
            success: connectivityResult.success,
            synced: false,
            mode: 'offline',
            localSave: connectivityResult.localSave,
            download: connectivityResult.download
        };
    }

    displaySaveResult(saveResult);

    // Bloqueia o dispositivo apenas se o salvamento foi bem-sucedido
    if (saveResult.success) {
        localStorage.setItem('deviceLocked', 'true');
    }
}

/**
 * Salva submissão em modo offline (envia para servidor local via rede)
 * @param {Object} submissionData - Dados da submissão
 * @returns {Promise<Object>} - Resultado do salvamento
 */
async function saveSubmissionOffline(submissionData) {
    try {
        // Tenta importar o serviço de submissão offline
        if (window.offlineSubmissionService) {
            return await window.offlineSubmissionService.submitToServer(submissionData);
        }

        // Fallback: salva localmente se o serviço não estiver disponível
        logService.warn('Serviço de submissão offline não disponível. Usando fallback.');
        return saveToLocalStorageFallback(submissionData);

    } catch (error) {
        logService.error('Erro ao salvar resultado offline', { error });
        return saveToLocalStorageFallback(submissionData);
    }
}

/**
 * Fallback para salvar no localStorage
 * @param {Object} submissionData - Dados da submissão
 * @returns {Object} - Resultado do salvamento
 */
function saveToLocalStorageFallback(submissionData) {
    try {
        const localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');

        const isDuplicate = localResults.some(r =>
            r.studentId === submissionData.studentId &&
            r.assessmentId === submissionData.assessmentId
        );

        if (isDuplicate) {
            return {
                success: false,
                synced: false,
                error: 'duplicate_local'
            };
        }

        localResults.push({
            ...submissionData,
            localTimestamp: new Date().toISOString()
        });

        localStorage.setItem('pending_results', JSON.stringify(localResults));

        return {
            success: true,
            synced: false,
            error: 'offline'
        };

    } catch (error) {
        logService.critical('Falha no fallback localStorage', { error });
        return {
            success: false,
            synced: false,
            error: 'storage_failed'
        };
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
        dom.results.saveStatus.textContent = "✅ Resultado salvo e sincronizado com sucesso!";
        dom.results.saveStatus.style.color = 'green';
    } else if (result.success && result.mode === 'offline') {
        // Modo offline com auto-download - mensagem positiva
        const downloadMsg = result.download?.success
            ? `<div class="flex items-center gap-2 text-green-700">
                <span class="text-2xl">✅</span>
                <span>Arquivo <strong>${result.download.fileName}</strong> baixado com sucesso!</span>
               </div>`
            : '<div class="text-orange-600">⚠️ Não foi possível baixar o arquivo automaticamente.</div>';

        const localMsg = result.localSave?.success
            ? '<div class="text-blue-600 text-sm">💾 Backup salvo no navegador com segurança.</div>'
            : '';

        dom.results.saveStatus.innerHTML = `
            <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                <div class="flex items-center gap-3">
                    <div class="text-4xl">🔌</div>
                    <div>
                        <div class="text-xl font-bold text-blue-900">VOCÊ ESTÁ DESCONECTADO</div>
                        <div class="text-lg font-semibold text-green-700">PROVA EXTRAÍDA COM SUCESSO!</div>
                    </div>
                </div>
                <div class="border-t border-blue-200 pt-3 space-y-2">
                    ${downloadMsg}
                    ${localMsg}
                </div>
                <div class="bg-yellow-100 border border-yellow-300 rounded p-3 flex items-start gap-2">
                    <span class="text-xl">📤</span>
                    <div class="text-sm text-yellow-800">
                        <strong>Próximo passo:</strong> Entregue o arquivo JSON ao professor para que sua prova seja registrada no sistema.
                    </div>
                </div>
            </div>
        `;
        dom.results.saveStatus.style.color = '#1e40af'; // blue-800
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
/**
 * Inicializa os controles de scroll do texto de apoio
 */
function initializeTextScrollControls() {
    const textContainer = document.getElementById('text-scroll-container');
    const scrollHint = document.getElementById('scroll-hint');

    if (!textContainer || !scrollHint) return;

    let scrollInteracted = false;

    // Adiciona indicação visual quando há conteúdo para scrollar
    function checkScrollNeed() {
        const scrollHeight = textContainer.scrollHeight;
        const clientHeight = textContainer.clientHeight;

        if (scrollHeight > clientHeight + 50) { // +50px de margem
            scrollHint.style.display = 'block';
            // Auto-hide a dica após 5 segundos
            setTimeout(() => {
                if (!scrollInteracted) {
                    scrollHint.style.opacity = '0.5';
                }
            }, 5000);
        } else {
            scrollHint.style.display = 'none';
        }
    }

    // Esconde a dica após primeiro scroll
    function handleFirstScroll() {
        if (textContainer.scrollTop > 10 && !scrollInteracted) {
            scrollInteracted = true;
            scrollHint.style.display = 'none';
        }
    }

    // Event listeners
    textContainer.addEventListener('scroll', handleFirstScroll);

    // Verifica necessidade de scroll quando o conteúdo é carregado
    setTimeout(checkScrollNeed, 100);

    // Verifica novamente se a janela redimensiona
    window.addEventListener('resize', () => {
        setTimeout(checkScrollNeed, 100);
    });

    // Adiciona interações do mouse/touch para melhor UX
    textContainer.addEventListener('mouseenter', () => {
        textContainer.style.scrollbarColor = '#3b82f6 #e2e8f0'; // Destaca scrollbar
    });

    textContainer.addEventListener('mouseleave', () => {
        textContainer.style.scrollbarColor = '#cbd5e1 #f1f5f9'; // Volta ao normal
    });
}

export function initializeQuizScreen() {
    // Usa delegação de eventos para evitar problemas de referência DOM
    const nextBtnId = 'next-btn';

    // Remove listeners existentes se houver
    const existingBtn = document.getElementById(nextBtnId);
    if (existingBtn) {
        // Cria novo botão para garantir que não há listeners órfãos
        const newBtn = existingBtn.cloneNode(true);
        existingBtn.parentNode.replaceChild(newBtn, existingBtn);

        // Atualiza referência no DOM
        dom.quiz.nextBtn = newBtn;

        // Adiciona listener
        newBtn.addEventListener('click', nextQuestion);
    }
}