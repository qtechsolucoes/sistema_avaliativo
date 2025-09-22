// src/login.js - VERSÃO CORRIGIDA E ROBUSTA

import { dom, state, updateState } from './state.js';
import { getClassesByGrade, getStudentsByClass } from './database.js';
import { logService } from './services/logService.js';
import { cacheService } from './services/cacheService.js';

// Cache para armazenar dados da sessão e evitar chamadas repetidas
const SESSION_CACHE_KEY_CLASSES = 'login_classes_';
const SESSION_CACHE_KEY_STUDENTS = 'login_students_';

let activeController = null; // Para controlar e abortar requisições antigas

/**
 * Preenche o seletor de anos (séries).
 */
function populateYears() {
    dom.login.yearSelect.innerHTML = '<option value="">-- Selecione --</option>'; // Limpa opções antigas
    const availableYears = ['6', '7', '8', '9'];
    availableYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}º Ano`;
        dom.login.yearSelect.appendChild(option);
    });
}

/**
 * Busca e preenche o seletor de turmas de forma segura e eficiente.
 * @param {string} grade - O ano/série selecionado.
 */
async function populateClasses(grade) {
    // Aborta qualquer requisição anterior para evitar race conditions
    if (activeController) {
        activeController.abort();
    }
    activeController = new AbortController();
    const signal = activeController.signal;

    // Reseta os seletores dependentes
    resetSelect(dom.login.classSelect, 'turma');
    resetSelect(dom.login.studentSelect, 'aluno');
    updateAdaptationUI(null);
    updateStartButtonState();

    if (!grade) {
        return;
    }

    setSelectLoading(dom.login.classSelect, true, 'turmas');
    
    try {
        const cacheKey = `${SESSION_CACHE_KEY_CLASSES}${grade}`;
        const classes = await cacheService.getOrFetch(cacheKey, () => getClassesByGrade(parseInt(grade, 10)));
        
        // Se o sinal foi abortado, a requisição foi cancelada
        if (signal.aborted) {
            logService.debug('Requisição de turmas abortada.', { grade });
            return;
        }

        if (!classes || classes.length === 0) {
            setSelectError(dom.login.classSelect, 'Nenhuma turma encontrada');
            showError('Nenhuma turma encontrada para este ano.');
            return;
        }

        populateSelectWithOptions(dom.login.classSelect, classes, 'Turma', 'id', 'name');
        clearError();

    } catch (error) {
        if (error.name !== 'AbortError') {
            logService.error('Erro ao carregar turmas.', { grade, error });
            setSelectError(dom.login.classSelect, 'Erro ao carregar');
            showError('Não foi possível carregar as turmas. Verifique a conexão.');
        }
    } finally {
        setSelectLoading(dom.login.classSelect, false);
    }
}

/**
 * Busca e preenche o seletor de alunos, filtrando os que já concluíram.
 * @param {string} classId - O ID da turma selecionada.
 */
async function populateStudents(classId) {
    if (activeController) {
        activeController.abort();
    }
    activeController = new AbortController();
    const signal = activeController.signal;

    resetSelect(dom.login.studentSelect, 'aluno');
    updateAdaptationUI(null);
    updateStartButtonState();

    if (!classId) {
        return;
    }

    setSelectLoading(dom.login.studentSelect, true, 'alunos');

    try {
        const cacheKey = `${SESSION_CACHE_KEY_STUDENTS}${classId}`;
        const students = await cacheService.getOrFetch(cacheKey, () => getStudentsByClass(classId));
        
        if (signal.aborted) {
             logService.debug('Requisição de alunos abortada.', { classId });
            return;
        }

        if (!students || students.length === 0) {
            setSelectError(dom.login.studentSelect, 'Nenhum aluno encontrado');
            showError('Nenhum aluno encontrado nesta turma.');
            return;
        }

        // Busca alunos que já finalizaram a prova
        const completedStudentIds = await getCompletedStudentIds(classId);

        // Debug: Mostra quais estudantes estão bloqueados
        console.log('🔒 IDs de estudantes completados:', Array.from(completedStudentIds));
        console.log('📋 Todos os estudantes da turma:', students.map(s => ({ id: s.id, name: s.name })));

        populateSelectWithOptions(dom.login.studentSelect, students, 'Aluno', 'id', 'name', (student) => {
            // Lógica para desabilitar alunos que já concluíram
            const isCompleted = completedStudentIds.has(student.id);
            const hasAdaptation = hasValidAdaptationDetails(student.adaptation_details);

            console.log(`🎯 Estudante ${student.name}: ${isCompleted ? 'BLOQUEADO' : 'DISPONÍVEL'}${hasAdaptation ? ' (Adaptação)' : ''}`);

            if (isCompleted) {
                return { disabled: true, textSuffix: ' (Concluído)' };
            }
            if (hasAdaptation) {
                const adaptationInfo = getAdaptationSummary(student.adaptation_details);
                return {
                    'data-has-adaptation': 'true',
                    'data-adaptation-info': adaptationInfo,
                    textSuffix: ' 🎯'
                };
            }
            return {};
        });
        clearError();
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            logService.error('Erro ao carregar alunos.', { classId, error });
            setSelectError(dom.login.studentSelect, 'Erro ao carregar');
            showError('Não foi possível carregar os alunos. Verifique a conexão.');
        }
    } finally {
        setSelectLoading(dom.login.studentSelect, false);
    }
}


// --- Funções Auxiliares da UI ---

function resetSelect(selectElement, type) {
    selectElement.innerHTML = `<option value="">-- Selecione a ${type === 'turma' ? 'série' : 'turma'} --</option>`;
    selectElement.disabled = true;
}

function setSelectLoading(selectElement, isLoading, type = '') {
    if (isLoading) {
        selectElement.innerHTML = `<option value="">Carregando ${type}...</option>`;
        selectElement.disabled = true;
    } else {
        selectElement.disabled = false;
        if (selectElement.options.length <= 1) { // Se não foi populado com sucesso
             selectElement.disabled = true;
        }
    }
}

function setSelectError(selectElement, message) {
    selectElement.innerHTML = `<option value="">-- ${message} --</option>`;
    selectElement.disabled = true;
}

function populateSelectWithOptions(selectElement, data, type, valueKey, textKey, optionCustomizer = () => ({})) {
    selectElement.innerHTML = `<option value="">-- Selecione --</option>`;
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        
        const customAttrs = optionCustomizer(item);
        let text = `Turma ${item[textKey]}`;
        if(type == "Aluno") text = item[textKey];
        option.textContent = text + (customAttrs.textSuffix || '');

        delete customAttrs.textSuffix; // Remove para não virar atributo
        
        Object.entries(customAttrs).forEach(([key, value]) => {
            option.setAttribute(key, value);
        });
        
        selectElement.appendChild(option);
    });
    selectElement.disabled = false;
}

/**
 * Atualiza o estado do botão "Iniciar" e a UI de adaptação.
 */
function handleSelectionChange() {
    const studentSelect = dom.login.studentSelect;
    const selectedOption = studentSelect.options[studentSelect.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        const hasAdaptation = selectedOption.getAttribute('data-has-adaptation') === 'true';
        updateAdaptationUI(hasAdaptation ? selectedOption.textContent : null);
    } else {
        updateAdaptationUI(null);
    }
    
    updateStartButtonState();
}

/**
 * Atualiza a legenda de adaptação e o estilo do formulário.
 * @param {string|null} studentName - O nome do aluno com adaptação, ou null.
 */
function updateAdaptationUI(studentName) {
    const legend = dom.login.adaptationLegend;
    if (studentName) {
        const studentSelect = dom.login.studentSelect;
        const selectedOption = studentSelect.options[studentSelect.selectedIndex];
        const adaptationInfo = selectedOption?.getAttribute('data-adaptation-info') || '';

        const cleanName = studentName.replace(' 🎯', '');

        legend.innerHTML = `
            <span class="icon">🎯</span>
            <div>
                <strong>Avaliação Adaptada para ${cleanName}:</strong><br>
                <span class="text-sm">${adaptationInfo || 'Interface personalizada de acordo com necessidades específicas.'}</span>
            </div>
        `;
        legend.classList.remove('hidden');
    } else {
        legend.classList.add('hidden');
    }
}

/**
 * Habilita ou desabilita o botão de iniciar avaliação.
 */
function updateStartButtonState() {
    const isComplete = dom.login.yearSelect.value && dom.login.classSelect.value && dom.login.studentSelect.value;
    dom.login.startBtn.disabled = !isComplete;
}

function hasValidAdaptationDetails(details) {
    if (!details) return false;
    // Uma simples verificação para ver se o objeto não está vazio
    return typeof details === 'object' && Object.keys(details).length > 0;
}

/**
 * Gera um resumo das adaptações necessárias para um estudante
 * @param {Object} adaptationDetails - Detalhes de adaptação do estudante
 * @returns {string} Resumo das adaptações
 */
function getAdaptationSummary(adaptationDetails) {
    if (!adaptationDetails) return '';

    try {
        const details = typeof adaptationDetails === 'string'
            ? JSON.parse(adaptationDetails)
            : adaptationDetails;

        const parts = [];

        // Diagnóstico principal
        if (details.diagnosis) {
            parts.push(details.diagnosis);
        }

        // Características principais das necessidades
        if (details.needs && Array.isArray(details.needs)) {
            const needs = details.needs.slice(0, 2); // Primeiras 2 necessidades
            parts.push(...needs);
        }

        // Sugestões de adaptação
        if (details.suggestions && Array.isArray(details.suggestions)) {
            const suggestions = details.suggestions.slice(0, 1); // Primeira sugestão
            parts.push(...suggestions);
        }

        return parts.join(' • ').substring(0, 120) + (parts.join(' • ').length > 120 ? '...' : '');
    } catch (error) {
        console.warn('Erro ao processar detalhes de adaptação:', error);
        return 'Interface adaptada disponível';
    }
}


// --- Funções de erro ---
function showError(message) {
    dom.login.errorMessage.textContent = message;
    dom.login.errorMessage.classList.remove('hidden');
}

function clearError() {
    dom.login.errorMessage.classList.add('hidden');
}

/**
 * Ponto de entrada da inicialização da tela de login.
 * @param {Function} onStartCallback - Função a ser chamada ao iniciar a avaliação.
 */
export function initializeLoginScreen(onStartCallback) {
    populateYears();

    dom.login.yearSelect.addEventListener('change', (e) => populateClasses(e.target.value));
    dom.login.classSelect.addEventListener('change', (e) => populateStudents(e.target.value));
    dom.login.studentSelect.addEventListener('change', handleSelectionChange);

    dom.login.startBtn.addEventListener('click', async () => {
        try {
            const studentId = dom.login.studentSelect.value;
            const classId = dom.login.classSelect.value;
            const grade = dom.login.yearSelect.value;

            // Busca os dados completos do aluno novamente para garantir consistência
            const cacheKey = `${SESSION_CACHE_KEY_STUDENTS}${classId}`;
            const studentsInClass = await cacheService.get(cacheKey);
            if (!studentsInClass) {
                showError("Sessão expirada. Por favor, selecione a turma novamente.");
                return;
            }

            const selectedStudent = studentsInClass.find(s => s.id === studentId);
            const selectedClass = (await cacheService.get(`${SESSION_CACHE_KEY_CLASSES}${grade}`)).find(c => c.id === classId);

            if (!selectedStudent || !selectedClass) {
                showError("Erro ao validar seleção. Tente novamente.");
                return;
            }

            updateState({
                currentStudent: {
                    id: selectedStudent.id,
                    name: selectedStudent.name,
                    grade: grade,
                    classId: selectedClass.id,
                    className: selectedClass.name,
                    adaptationDetails: selectedStudent.adaptation_details
                }
            });

            logService.info('Iniciando avaliação para o aluno.', { studentId });
            onStartCallback();

        } catch (error) {
            logService.critical('Erro crítico ao iniciar avaliação.', { error });
            showError("Ocorreu um erro inesperado. Recarregue a página.");
        }
    });

    // Estado inicial
    resetSelect(dom.login.classSelect, 'turma');
    resetSelect(dom.login.studentSelect, 'aluno');
}

/**
 * Busca IDs dos estudantes que já completaram avaliações para uma turma específica
 * @param {string} classId - ID da turma
 * @returns {Promise<Set<string>>} Set com IDs dos estudantes que já completaram
 */
async function getCompletedStudentIds(classId) {
    try {
        const { dataService } = await import('./services/dataService.js');

        console.log('🔍 Buscando estudantes completados APENAS no Supabase (fonte única de verdade)');

        // Busca submissões completadas (agora só retorna dados do Supabase)
        const completedSubmissions = await dataService.getCompletedSubmissions(classId);

        // Retorna Set com IDs únicos dos estudantes
        const completedIds = new Set(completedSubmissions.map(submission => submission.studentId));

        // Debug: Mostra IDs bloqueados
        console.log(`🔒 Sistema centralizado: ${completedIds.size} estudantes bloqueados`);
        console.log('📋 IDs bloqueados:', Array.from(completedIds));

        return completedIds;

    } catch (error) {
        console.warn('Erro ao buscar estudantes completados:', error);
        // Em caso de erro, retorna Set vazio (não bloqueia ninguém)
        return new Set();
    }
}