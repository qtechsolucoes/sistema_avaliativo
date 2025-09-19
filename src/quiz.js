// src/quiz.js - VERSÃO CORRIGIDA

import { state, dom, updateState } from './state.js';
import { showScreen } from './navigation.js';
import { getAssessmentData, saveSubmission } from './database.js';
import { showConfirmationModal, handleVisibilityChange } from './ui.js';
import { routeAssessment } from './adaptation.js';

/**
 * CORRIGIDA: Ponto de entrada principal para iniciar o fluxo da avaliação.
 */
export async function startAssessmentFlow() {
    try {
        // CORREÇÃO: Validação do estado atual
        if (!state.currentStudent || !state.currentStudent.id || !state.currentStudent.grade) {
            console.error('Dados do estudante inválidos:', state.currentStudent);
            dom.login.errorMessage.textContent = 'Erro: Dados do estudante não encontrados. Recarregue a página.';
            dom.login.errorMessage.classList.remove('hidden');
            return;
        }

        console.log('Carregando avaliação para o aluno:', state.currentStudent.name, `(${state.currentStudent.grade}º ano)`);
        
        const assessment = await getAssessmentData(parseInt(state.currentStudent.grade));

        // CORREÇÃO: Validação robusta da avaliação
        const validationError = validateAssessmentData(assessment);
        if (validationError) {
            dom.login.errorMessage.textContent = validationError;
            dom.login.errorMessage.classList.remove('hidden');
            return;
        }
        
        console.log('Avaliação carregada com sucesso:', assessment.title, `(${assessment.questions.length} questões)`);
        
        // Entrega os dados da prova ao roteador de adaptação
        routeAssessment(assessment);
        
    } catch (error) {
        console.error('Erro no fluxo de inicialização da avaliação:', error);
        dom.login.errorMessage.textContent = 'Erro inesperado ao carregar a avaliação. Tente novamente.';
        dom.login.errorMessage.classList.remove('hidden');
    }
}

/**
 * NOVA FUNÇÃO: Validação abrangente dos dados da avaliação
 */
function validateAssessmentData(assessment) {
    if (!assessment) {
        return `Nenhuma prova foi encontrada para o ${state.currentStudent.grade}º ano. Verifique com o professor.`;
    }
    
    if (!assessment.questions || !Array.isArray(assessment.questions)) {
        return 'Erro: Estrutura de questões inválida na avaliação.';
    }
    
    if (assessment.questions.length === 0) {
        return `Nenhuma questão encontrada para o ${state.currentStudent.grade}º ano.`;
    }
    
    // Valida cada questão
    for (let i = 0; i < assessment.questions.length; i++) {
        const question = assessment.questions[i];
        
        if (!question.id || !question.question_text) {
            return `Questão ${i + 1} tem estrutura inválida (ID ou texto ausente).`;
        }
        
        if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
            return `Questão ${i + 1} não tem opções suficientes.`;
        }
        
        const correctOptions = question.options.filter(opt => opt.isCorrect === true);
        if (correctOptions.length !== 1) {
            return `Questão ${i + 1} deve ter exatamente uma resposta correta.`;
        }
        
        // Verifica se todas as opções têm texto
        const invalidOptions = question.options.filter(opt => !opt.text || opt.text.trim() === '');
        if (invalidOptions.length > 0) {
            return `Questão ${i + 1} contém opções sem texto.`;
        }
    }
    
    return null; // Sem erros
}

/**
 * CORRIGIDA: Inicia a prova padrão com melhor controle de erro.
 * @param {object} assessmentData - Os dados da prova a serem carregados.
 */
export function startStandardAssessment(assessmentData) {
    try {
        // CORREÇÃO: Validação adicional antes de iniciar
        const validationError = validateAssessmentData(assessmentData);
        if (validationError) {
            console.error('Erro na validação da avaliação:', validationError);
            alert('Erro na avaliação: ' + validationError);
            return;
        }

        // Embaralha as questões para cada aluno
        const shuffledQuestions = shuffleArray(assessmentData.questions);

        // CORREÇÃO: Reset completo do estado
        updateState({ 
            currentAssessment: { ...assessmentData, questions: shuffledQuestions },
            currentQuestionIndex: 0,
            score: 0,
            answerLog: [],
            questionStartTime: null,
            assessmentStartTime: Date.now()
        });
        
        // CORREÇÃO: Informações mais detalhadas do aluno
        const studentInfo = `
            <strong>Aluno:</strong> ${state.currentStudent.name}<br>
            <strong>Turma:</strong> ${state.currentStudent.grade}º Ano ${state.currentStudent.className}<br>
            <strong>Avaliação:</strong> ${assessmentData.title}
        `;
        dom.quiz.studentInfoDisplay.innerHTML = studentInfo;
        
        loadQuestion();
        showScreen('quiz');
        
        // CORREÇÃO: Adiciona listener apenas uma vez
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        console.log('Prova iniciada com sucesso');
        
    } catch (error) {
        console.error('Erro ao iniciar avaliação padrão:', error);
        alert('Erro inesperado ao iniciar a avaliação. Recarregue a página e tente novamente.');
    }
}

/**
 * CORRIGIDA: Embaralha os elementos de um array (algoritmo Fisher-Yates)
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
 * CORRIGIDA: Carrega e exibe a questão atual na tela com validação.
 */
function loadQuestion() {
    try {
        // CORREÇÃO: Validação do índice da questão
        if (state.currentQuestionIndex >= state.currentAssessment.questions.length) {
            console.error('Índice de questão inválido:', state.currentQuestionIndex);
            finishAssessment();
            return;
        }

        const questionData = state.currentAssessment.questions[state.currentQuestionIndex];
        
        // CORREÇÃO: Validação da questão atual
        if (!questionData || !questionData.question_text || !Array.isArray(questionData.options)) {
            console.error('Dados da questão inválidos:', questionData);
            showQuestionError();
            return;
        }

        // Reset da interface
        dom.quiz.nextBtn.classList.add('hidden');
        dom.quiz.feedback.textContent = '';
        dom.quiz.feedback.style.color = '';
        
        updateState({ questionStartTime: Date.now() });
        
        // CORREÇÃO: Validação do texto base
        const baseText = state.currentAssessment.baseText || 'Texto de apoio não disponível.';
        dom.quiz.baseTextDesktop.innerHTML = baseText;
        dom.quiz.baseTextMobile.innerHTML = baseText;
        
        // Informações da questão
        dom.quiz.progress.textContent = `Pergunta ${state.currentQuestionIndex + 1} de ${state.currentAssessment.questions.length}`;
        dom.quiz.question.textContent = questionData.question_text;
        
        // CORREÇÃO: Validação das opções
        const validOptions = questionData.options.filter(opt => opt && opt.text && opt.text.trim() !== '');
        if (validOptions.length < 2) {
            console.error('Questão sem opções válidas suficientes:', questionData.id);
            showQuestionError();
            return;
        }
        
        const correctOptions = validOptions.filter(opt => opt.isCorrect === true);
        if (correctOptions.length !== 1) {
            console.error('Questão sem resposta correta única:', questionData.id);
            showQuestionError();
            return;
        }

        // Limpa container de opções
        dom.quiz.optionsContainer.innerHTML = '';

        const correctAnswer = correctOptions[0].text;

        // CORREÇÃO: Embaralha as opções para cada questão
        const shuffledOptions = shuffleArray(validOptions);
        
        shuffledOptions.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.classList.add('option-btn');
            button.dataset.optionId = `option-${index}`;
            button.addEventListener('click', () => selectAnswer(button, correctAnswer, questionData.id));
            dom.quiz.optionsContainer.appendChild(button);
        });
        
        console.log(`Questão ${state.currentQuestionIndex + 1} carregada: ${questionData.question_text.substring(0, 50)}...`);
        
    } catch (error) {
        console.error('Erro ao carregar questão:', error);
        showQuestionError();
    }
}

/**
 * NOVA FUNÇÃO: Mostra erro quando não consegue carregar questão
 */
function showQuestionError() {
    dom.quiz.question.textContent = 'Erro ao carregar esta questão.';
    dom.quiz.optionsContainer.innerHTML = `
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p class="font-semibold">Erro na questão</p>
            <p class="text-sm mt-1">Esta questão não pôde ser carregada devido a um problema nos dados.</p>
            <button class="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onclick="location.reload()">
                Recarregar Página
            </button>
        </div>
    `;
}

/**
 * CORRIGIDA: Processa a seleção de uma resposta pelo aluno com validações.
 */
function selectAnswer(selectedButton, correctAnswer, questionId) {
    try {
        // CORREÇÃO: Validação dos parâmetros
        if (!selectedButton || !correctAnswer || !questionId) {
            console.error('Parâmetros inválidos na seleção de resposta');
            return;
        }

        // CORREÇÃO: Validação do tempo de resposta
        if (!state.questionStartTime || state.questionStartTime <= 0) {
            console.warn('Tempo de início da questão não registrado, usando valor padrão');
            updateState({ questionStartTime: Date.now() - 1000 }); // 1 segundo atrás
        }

        const duration = Math.max(1, Math.round((Date.now() - state.questionStartTime) / 1000));
        const isCorrect = selectedButton.textContent.trim() === correctAnswer.trim();

        // CORREÇÃO: Validação do log de respostas
        if (!Array.isArray(state.answerLog)) {
            updateState({ answerLog: [] });
        }

        // CORREÇÃO: Log mais detalhado
        const answerData = {
            questionId: questionId,
            selectedAnswer: selectedButton.textContent.trim(),
            correctAnswer: correctAnswer.trim(),
            isCorrect: isCorrect,
            duration: duration,
            questionIndex: state.currentQuestionIndex,
            timestamp: Date.now()
        };

        state.answerLog.push(answerData);

        // Desabilita todas as opções
        const allOptions = dom.quiz.optionsContainer.querySelectorAll('.option-btn');
        allOptions.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent.trim() === correctAnswer.trim()) {
                btn.classList.add('correct');
            } else if (btn === selectedButton && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });

        // CORREÇÃO: Atualização segura do score
        if (isCorrect) {
            const newScore = (state.score || 0) + 1;
            updateState({ score: newScore });
            dom.quiz.feedback.textContent = "Resposta Correta!";
            dom.quiz.feedback.style.color = 'green';
        } else {
            dom.quiz.feedback.textContent = `Incorreto. A resposta certa era: "${correctAnswer}"`;
            dom.quiz.feedback.style.color = 'red';
        }
        
        // Configura botão de próxima
        dom.quiz.nextBtn.classList.remove('hidden');
        if (state.currentQuestionIndex === state.currentAssessment.questions.length - 1) {
            dom.quiz.nextBtn.textContent = "Finalizar Avaliação";
        } else {
            dom.quiz.nextBtn.textContent = "Próxima Pergunta";
        }

        console.log(`Resposta registrada - Correta: ${isCorrect}, Duração: ${duration}s`);
        
    } catch (error) {
        console.error('Erro ao processar resposta:', error);
        dom.quiz.feedback.textContent = 'Erro ao registrar resposta. Tente novamente.';
        dom.quiz.feedback.style.color = 'red';
    }
}

/**
 * CORRIGIDA: Avança para a próxima questão ou inicia o processo de finalização.
 */
function nextQuestion() {
    try {
        if (state.currentQuestionIndex === state.currentAssessment.questions.length - 1) {
            showConfirmationModal();
        } else {
            const nextIndex = state.currentQuestionIndex + 1;
            updateState({ currentQuestionIndex: nextIndex });
            loadQuestion();
        }
    } catch (error) {
        console.error('Erro ao avançar questão:', error);
        alert('Erro ao carregar próxima questão. A avaliação será finalizada.');
        finishAssessment();
    }
}

/**
 * CORRIGIDA: Finaliza a avaliação com validação completa dos dados.
 */
export async function finishAssessment() {
    try {
        console.log('Iniciando finalização da avaliação...');
        
        // Remove listener de visibilidade
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        
        // CORREÇÃO: Validação do estado antes de finalizar
        const validationError = validateFinalizationData();
        if (validationError) {
            console.error('Erro na validação final:', validationError);
            alert('Erro na finalização: ' + validationError);
            return;
        }

        // CORREÇÃO: Cálculo seguro da duração
        const assessmentStart = state.assessmentStartTime || Date.now();
        const totalDuration = Math.max(1, Math.round((Date.now() - assessmentStart) / 1000));

        // CORREÇÃO: Preparação robusta dos dados de submissão
        const submissionData = {
            studentId: state.currentStudent.id,
            assessmentId: state.currentAssessment.id,
            score: Math.max(0, Math.min(state.score || 0, state.currentAssessment.questions.length)),
            totalQuestions: state.currentAssessment.questions.length,
            totalDuration: totalDuration,
            answerLog: prepareAnswerLogForSubmission(state.answerLog || [])
        };

        console.log('Dados de submissão preparados:', {
            student: state.currentStudent.name,
            score: `${submissionData.score}/${submissionData.totalQuestions}`,
            duration: `${totalDuration}s`,
            answers: submissionData.answerLog.length
        });

        // CORREÇÃO: Tentativa de salvamento com feedback
        dom.results.saveStatus.textContent = 'Salvando resultado...';
        dom.results.saveStatus.style.color = '#64748b'; // slate-500
        
        const saveResult = await saveSubmission(submissionData);
        
        // CORREÇÃO: Feedback detalhado baseado no resultado
        displaySaveResult(saveResult);
        
        // CORREÇÃO: Bloqueia dispositivo apenas se salvamento foi bem-sucedido
        if (saveResult.success) {
            localStorage.setItem('deviceLocked', 'true');
        }

        // CORREÇÃO: Cálculo e exibição da nota final
        displayFinalScore(submissionData.score, submissionData.totalQuestions);
        
        showScreen('results');
        console.log('Avaliação finalizada com sucesso');
        
    } catch (error) {
        console.error('Erro crítico na finalização:', error);
        
        // CORREÇÃO: Fallback de emergência
        dom.results.saveStatus.textContent = 'Erro crítico ao finalizar. Os dados podem não ter sido salvos.';
        dom.results.saveStatus.style.color = 'red';
        
        // Tenta mostrar a tela de resultados mesmo com erro
        displayFinalScore(state.score || 0, (state.currentAssessment?.questions?.length || 1));
        showScreen('results');
    }
}

/**
 * NOVA FUNÇÃO: Validação dos dados antes da finalização
 */
function validateFinalizationData() {
    if (!state.currentStudent || !state.currentStudent.id) {
        return 'Dados do estudante não encontrados.';
    }
    
    if (!state.currentAssessment || !state.currentAssessment.id) {
        return 'Dados da avaliação não encontrados.';
    }
    
    if (!state.currentAssessment.questions || state.currentAssessment.questions.length === 0) {
        return 'Nenhuma questão encontrada na avaliação.';
    }
    
    if (typeof state.score !== 'number' || state.score < 0) {
        return 'Pontuação inválida.';
    }
    
    if (state.score > state.currentAssessment.questions.length) {
        return 'Pontuação superior ao número de questões.';
    }
    
    return null; // Sem erros
}

/**
 * NOVA FUNÇÃO: Prepara o log de respostas para envio ao banco
 */
function prepareAnswerLogForSubmission(answerLog) {
    return answerLog.map((answer, index) => ({
        questionId: answer.questionId || `unknown-${index}`,
        isCorrect: Boolean(answer.isCorrect),
        duration: Math.max(1, Math.min(answer.duration || 30, 3600)), // Entre 1s e 1h
        questionIndex: typeof answer.questionIndex === 'number' ? answer.questionIndex : index
    }));
}

/**
 * NOVA FUNÇÃO: Exibe o resultado do salvamento
 */
function displaySaveResult(saveResult) {
    if (saveResult.error === 'duplicate' || saveResult.error === 'duplicate_local') {
        dom.results.saveStatus.textContent = "ATENÇÃO: Este aluno já concluiu a avaliação. Este resultado não foi salvo.";
        dom.results.saveStatus.style.color = 'red';
    } else if (saveResult.success && saveResult.synced) {
        dom.results.saveStatus.textContent = "Resultado salvo e sincronizado com sucesso!";
        dom.results.saveStatus.style.color = 'green';
    } else if (saveResult.success) {
        dom.results.saveStatus.textContent = "Resultado salvo localmente. Será sincronizado quando houver internet.";
        dom.results.saveStatus.style.color = '#d97706'; // amber-600
    } else {
        dom.results.saveStatus.textContent = "Erro ao salvar o resultado. Entre em contato com o professor.";
        dom.results.saveStatus.style.color = 'red';
    }
}

/**
 * NOVA FUNÇÃO: Exibe a pontuação final
 */
function displayFinalScore(score, totalQuestions) {
    // CORREÇÃO: Cálculo seguro da nota
    const validScore = Math.max(0, Math.min(score, totalQuestions));
    const finalScore = totalQuestions > 0 ? (validScore * 10 / totalQuestions) : 0;
    
    dom.results.score.textContent = `${validScore} / ${totalQuestions}`;
    dom.results.decimalScore.textContent = finalScore.toFixed(1).replace('.', ',');
}

/**
 * CORRIGIDA: Configura o event listener para o botão "Próxima Pergunta".
 */
export function initializeQuizScreen() {
    // CORREÇÃO: Remove listener anterior para evitar duplicatas
    const newNextBtn = dom.quiz.nextBtn.cloneNode(true);
    dom.quiz.nextBtn.parentNode.replaceChild(newNextBtn, dom.quiz.nextBtn);
    dom.quiz.nextBtn = newNextBtn;
    
    dom.quiz.nextBtn.addEventListener('click', nextQuestion);
}