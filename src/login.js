// src/login.js - VERSÃO CORRIGIDA

import { dom, updateState } from './state.js';
import { getClassesByGrade, getStudentsByClass, getAllSubmissionsForDashboard } from './database.js';

let availableClasses = [];
let availableStudents = [];
let completedSubmissions = [];
let currentLoadingOperation = null; // CORREÇÃO: Controle de race conditions

/**
 * Preenche o seletor de anos com as opções disponíveis.
 */
function populateYears() {
    const availableYears = ['6', '7', '8', '9'];
    availableYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}º Ano`;
        dom.login.yearSelect.appendChild(option);
    });
}

/**
 * CORRIGIDA: Busca e preenche o seletor de turmas com debounce e validação.
 * @param {string} grade - O ano selecionado (ex: '6').
 */
async function populateClasses(grade) {
    // CORREÇÃO: Cancela operação anterior se ainda estiver em andamento
    if (currentLoadingOperation) {
        currentLoadingOperation.cancelled = true;
    }
    
    const operation = { cancelled: false, type: 'classes', grade };
    currentLoadingOperation = operation;
    
    // Reset dos seletores dependentes
    resetClassSelector();
    resetStudentSelector();
    hideAdaptationLegend();

    if (!grade) {
        dom.login.classSelect.innerHTML = '<option value="">-- Selecione o ano primeiro --</option>';
        return;
    }

    // Indica carregamento
    dom.login.classSelect.innerHTML = '<option value="">-- A carregar turmas... --</option>';
    dom.login.classSelect.disabled = true;

    try {
        const classes = await getClassesByGrade(parseInt(grade));
        
        // CORREÇÃO: Verifica se a operação não foi cancelada
        if (operation.cancelled) {
            console.log('Operação de carregamento de turmas cancelada');
            return;
        }
        
        availableClasses = classes || [];
        dom.login.classSelect.innerHTML = '<option value="">-- Selecione --</option>';
        
        if (availableClasses.length === 0) {
            dom.login.classSelect.innerHTML = '<option value="">-- Nenhuma turma encontrada --</option>';
            showError('Nenhuma turma encontrada para este ano. Verifique a configuração do sistema.');
            return;
        }
        
        availableClasses.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = `Turma ${cls.name}`;
            dom.login.classSelect.appendChild(option);
        });
        
        dom.login.classSelect.disabled = false;
        clearError();
        
    } catch (error) {
        if (!operation.cancelled) {
            console.error('Erro ao carregar turmas:', error);
            dom.login.classSelect.innerHTML = '<option value="">-- Erro ao carregar turmas --</option>';
            showError('Erro ao carregar turmas. Verifique sua conexão.');
        }
    } finally {
        if (currentLoadingOperation === operation) {
            currentLoadingOperation = null;
        }
    }
}

/**
 * CORRIGIDA: Preenche o seletor de alunos com validação e controle de duplicatas.
 * @param {string} classId - O ID da turma selecionada.
 */
async function populateStudents(classId) {
    // CORREÇÃO: Cancela operação anterior
    if (currentLoadingOperation) {
        currentLoadingOperation.cancelled = true;
    }
    
    const operation = { cancelled: false, type: 'students', classId };
    currentLoadingOperation = operation;
    
    resetStudentSelector();
    hideAdaptationLegend();

    if (!classId) {
        dom.login.studentSelect.innerHTML = '<option value="">-- Selecione a turma primeiro --</option>';
        return;
    }
    
    // Indica carregamento
    dom.login.studentSelect.innerHTML = '<option value="">-- A carregar alunos... --</option>';
    dom.login.studentSelect.disabled = true;

    try {
        // CORREÇÃO: Carrega dados em paralelo com timeout
        const [students, submissions] = await Promise.race([
            Promise.all([
                getStudentsByClass(classId),
                getAllSubmissionsForDashboard()
            ]),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 10000)
            )
        ]);
        
        // Verifica se a operação foi cancelada
        if (operation.cancelled) {
            console.log('Operação de carregamento de alunos cancelada');
            return;
        }
        
        // CORREÇÃO: Validação robusta dos dados
        availableStudents = Array.isArray(students) ? students.filter(s => s && s.id && s.full_name) : [];
        completedSubmissions = Array.isArray(submissions) ? submissions : [];
        
        if (availableStudents.length === 0) {
            dom.login.studentSelect.innerHTML = '<option value="">-- Nenhum aluno encontrado --</option>';
            showError('Nenhum aluno encontrado nesta turma.');
            return;
        }
        
        // CORREÇÃO: Melhora na identificação de alunos que já completaram
        const completedStudentIds = new Set(
            completedSubmissions
                .filter(sub => sub && sub.student_id)
                .map(sub => sub.student_id)
        );

        dom.login.studentSelect.innerHTML = '<option value="">-- Selecione --</option>';

        availableStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            let studentName = student.full_name;

            // CORREÇÃO: Validação e destaque melhorado para alunos atípicos
            const hasAdaptation = hasValidAdaptationDetails(student.adaptation_details);
            if (hasAdaptation) {
                studentName += " *";
                // CORREÇÃO: Adiciona estilo visual para destacar alunos atípicos
                option.style.fontWeight = 'bold';
                option.style.color = '#2563eb'; // blue-600
                option.dataset.hasAdaptation = 'true';
            }

            option.textContent = studentName;

            // CORREÇÃO: Marca alunos que já completaram a avaliação
            if (completedStudentIds.has(student.id)) {
                option.disabled = true;
                option.textContent += " (Concluído)";
                option.style.color = '#94a3b8'; // slate-400
                option.style.fontWeight = 'normal'; // Remove destaque se concluído
            }
            
            dom.login.studentSelect.appendChild(option);
        });
        
        dom.login.studentSelect.disabled = false;
        clearError();
        
    } catch (error) {
        if (!operation.cancelled) {
            console.error('Erro ao carregar alunos:', error);
            dom.login.studentSelect.innerHTML = '<option value="">-- Erro ao carregar alunos --</option>';
            
            if (error.message === 'Timeout') {
                showError('Tempo limite excedido ao carregar alunos. Tente novamente.');
            } else {
                showError('Erro ao carregar alunos. Verifique sua conexão.');
            }
        }
    } finally {
        if (currentLoadingOperation === operation) {
            currentLoadingOperation = null;
        }
    }
}

/**
 * NOVA FUNÇÃO: Valida se os detalhes de adaptação são válidos (estrutura real)
 */
function hasValidAdaptationDetails(adaptationDetails) {
    if (!adaptationDetails) return false;
    
    try {
        // Se for string, tenta fazer parse
        const parsed = typeof adaptationDetails === 'string' ? 
            JSON.parse(adaptationDetails) : adaptationDetails;
        
        // CORREÇÃO: Verifica se há diagnosis, suggestions ou difficulties
        const hasDiagnosis = parsed.diagnosis && Array.isArray(parsed.diagnosis) && parsed.diagnosis.length > 0;
        const hasSuggestions = parsed.suggestions && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0;
        const hasDifficulties = parsed.difficulties && Array.isArray(parsed.difficulties) && parsed.difficulties.length > 0;
        
        return hasDiagnosis || hasSuggestions || hasDifficulties;
               
    } catch (error) {
        console.warn('Dados de adaptação inválidos:', error);
        return false;
    }
}

/**
 * NOVA FUNÇÃO: Reset do seletor de turmas
 */
function resetClassSelector() {
    availableClasses = [];
    dom.login.classSelect.innerHTML = '<option value="">-- Selecione o ano primeiro --</option>';
    dom.login.classSelect.disabled = true;
}

/**
 * NOVA FUNÇÃO: Reset do seletor de alunos
 */
function resetStudentSelector() {
    availableStudents = [];
    dom.login.studentSelect.innerHTML = '<option value="">-- Selecione a turma primeiro --</option>';
    dom.login.studentSelect.disabled = true;
}

/**
 * NOVA FUNÇÃO: Esconde a legenda de adaptação
 */
function hideAdaptationLegend() {
    dom.login.adaptationLegend.classList.add('hidden');
}

/**
 * NOVA FUNÇÃO: Mostra mensagem de erro
 */
function showError(message) {
    dom.login.errorMessage.textContent = message;
    dom.login.errorMessage.classList.remove('hidden');
}

/**
 * NOVA FUNÇÃO: Limpa mensagem de erro
 */
function clearError() {
    dom.login.errorMessage.classList.add('hidden');
}

/**
 * CORRIGIDA: Verifica se todos os campos foram preenchidos e aplica estilos visuais.
 */
function checkFormCompletion() {
    const year = dom.login.yearSelect.value;
    const classId = dom.login.classSelect.value;
    const studentId = dom.login.studentSelect.value;
    
    const isComplete = year && classId && studentId;
    dom.login.startBtn.disabled = !isComplete;

    // CORREÇÃO: Lógica completa para destacar alunos atípicos
    if (studentId) {
        const selectedOption = dom.login.studentSelect.options[dom.login.studentSelect.selectedIndex];
        
        if (selectedOption && !selectedOption.disabled) {
            const hasAdaptation = selectedOption.dataset.hasAdaptation === 'true';
            
            if (hasAdaptation) {
                // Aplica estilos visuais
                applyAdaptationStyling(true);
                
                // Mostra legenda e mensagem
                showAdaptationMessage(selectedOption.textContent);
                
                console.log('Aluno atípico selecionado:', selectedOption.textContent.replace(' *', ''));
            } else {
                applyAdaptationStyling(false);
                hideAdaptationLegend();
                clearAdaptationMessage();
            }
        } else {
            applyAdaptationStyling(false);
            hideAdaptationLegend();
            clearAdaptationMessage();
        }
    } else {
        applyAdaptationStyling(false);
        hideAdaptationLegend();
        clearAdaptationMessage();
    }
    
    // Limpa erro se formulário estiver completo
    if (isComplete) {
        clearError();
    }
}

/**
 * NOVA FUNÇÃO: Aplica estilos visuais quando aluno atípico é selecionado
 */
function applyAdaptationStyling(hasAdaptation) {
    const studentSelect = dom.login.studentSelect;
    const startBtn = dom.login.startBtn;
    const container = document.getElementById('main-container');
    
    if (hasAdaptation) {
        // Adiciona classes CSS para destacar
        studentSelect.classList.add('has-adaptation-selected');
        startBtn.classList.add('adapted-student');
        container?.classList.add('form-complete-adapted');
        
        // Muda texto do botão para indicar adaptação
        if (!startBtn.disabled) {
            startBtn.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Iniciar Avaliação Adaptada
            `;
        }
    } else {
        // Remove classes CSS
        studentSelect.classList.remove('has-adaptation-selected');
        startBtn.classList.remove('adapted-student');
        container?.classList.remove('form-complete-adapted');
        
        // Volta texto padrão do botão
        if (!startBtn.disabled) {
            startBtn.innerHTML = `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 015.755.757l.006-.757h1a3 3 0 110 6H9a3 3 0 01-3-3V10z"></path>
                </svg>
                Iniciar Avaliação
            `;
        }
    }
}

/**
 * NOVA FUNÇÃO: Mostra mensagem específica sobre adaptação
 */
function showAdaptationMessage(studentName) {
    // Remove o asterisco para exibir nome limpo
    const cleanName = studentName.replace(' *', '').replace(' (Concluído)', '');
    
    // Atualiza a legenda com mensagem personalizada
    dom.login.adaptationLegend.innerHTML = `
        <div class="flex items-start gap-2">
            <div class="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-blue-600 text-xs font-bold">*</span>
            </div>
            <div class="text-xs">
                <p class="font-semibold text-blue-800">Aluno com necessidades específicas</p>
                <p class="text-blue-600 mt-1">
                    ${cleanName} receberá uma avaliação adaptada às suas necessidades educacionais.
                </p>
            </div>
        </div>
    `;
    
    dom.login.adaptationLegend.classList.remove('hidden');
}

/**
 * NOVA FUNÇÃO: Limpa mensagem de adaptação
 */
function clearAdaptationMessage() {
    dom.login.adaptationLegend.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-blue-600">*</span>
            <span>Aluno com necessidades específicas. Uma avaliação adaptada será aplicada.</span>
        </div>
    `;
}

/**
 * NOVA FUNÇÃO: Valida os dados selecionados antes de prosseguir
 */
function validateSelection() {
    const yearValue = dom.login.yearSelect.value;
    const classValue = dom.login.classSelect.value;
    const studentValue = dom.login.studentSelect.value;
    
    // Valida se o ano é válido
    if (!yearValue || !['6', '7', '8', '9'].includes(yearValue)) {
        showError('Por favor, selecione um ano válido.');
        return false;
    }
    
    // Valida se a turma existe na lista carregada
    const selectedClass = availableClasses.find(c => c.id === classValue);
    if (!selectedClass) {
        showError('Turma selecionada não é válida. Recarregue a página e tente novamente.');
        return false;
    }
    
    // Valida se o aluno existe na lista carregada
    const selectedStudent = availableStudents.find(s => s.id === studentValue);
    if (!selectedStudent) {
        showError('Aluno selecionado não é válido. Recarregue a página e tente novamente.');
        return false;
    }
    
    // Verifica se o aluno já completou a avaliação
    const isCompleted = completedSubmissions.some(sub => sub.student_id === studentValue);
    if (isCompleted) {
        showError('Este aluno já completou a avaliação.');
        return false;
    }
    
    return { selectedClass, selectedStudent };
}

/**
 * CORRIGIDA: Configura os event listeners com debounce e validação.
 * @param {Function} startAssessmentCallback - A função a ser chamada quando o botão "Iniciar" é clicado.
 */
export function initializeLoginScreen(startAssessmentCallback) {
    populateYears();

    // CORREÇÃO: Debounce para evitar múltiplas chamadas
    let yearChangeTimeout;
    dom.login.yearSelect.addEventListener('change', async (e) => {
        clearTimeout(yearChangeTimeout);
        yearChangeTimeout = setTimeout(() => {
            populateClasses(e.target.value);
            checkFormCompletion();
        }, 300);
    });

    let classChangeTimeout;
    dom.login.classSelect.addEventListener('change', async (e) => {
        clearTimeout(classChangeTimeout);
        classChangeTimeout = setTimeout(() => {
            populateStudents(e.target.value);
            checkFormCompletion();
        }, 300);
    });

    dom.login.studentSelect.addEventListener('change', checkFormCompletion);

    // CORREÇÃO: Validação completa antes de iniciar
    dom.login.startBtn.addEventListener('click', () => {
        const validation = validateSelection();
        
        if (!validation) {
            return; // Erro já mostrado pela função validateSelection
        }
        
        const { selectedClass, selectedStudent } = validation;

        try {
            // CORREÇÃO: Parse seguro dos dados de adaptação
            let adaptationDetails = null;
            if (selectedStudent.adaptation_details) {
                adaptationDetails = typeof selectedStudent.adaptation_details === 'string' ? 
                    JSON.parse(selectedStudent.adaptation_details) : 
                    selectedStudent.adaptation_details;
            }

            const studentData = {
                id: selectedStudent.id,
                name: selectedStudent.full_name,
                grade: dom.login.yearSelect.value,
                classId: selectedClass.id,
                className: selectedClass.name,
                adaptationDetails: adaptationDetails
            };
            
            updateState({ currentStudent: studentData });
            
            console.log('Iniciando avaliação para:', studentData);
            startAssessmentCallback();
            
        } catch (error) {
            console.error('Erro ao processar dados do aluno:', error);
            showError('Erro ao processar dados do aluno selecionado. Tente novamente.');
        }
    });
}