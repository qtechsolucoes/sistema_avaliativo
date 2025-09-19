// src/login.js

import { dom, updateState } from './state.js';
import { getClassesByGrade, getStudentsByClass, getAllSubmissionsForDashboard } from './database.js';

let availableClasses = [];
let availableStudents = [];
let completedSubmissions = [];

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
 * Busca e preenche o seletor de turmas com base no ano selecionado.
 * @param {string} grade - O ano selecionado (ex: '6').
 */
async function populateClasses(grade) {
    dom.login.classSelect.innerHTML = '<option value="">-- A carregar turmas... --</option>';
    dom.login.studentSelect.innerHTML = '<option value="">-- Selecione a turma primeiro --</option>';
    dom.login.studentSelect.disabled = true;
    dom.login.classSelect.disabled = true;
    dom.login.adaptationLegend.classList.add('hidden'); // Esconde a legenda ao trocar de ano

    if (!grade) {
        dom.login.classSelect.innerHTML = '<option value="">-- Selecione o ano primeiro --</option>';
        return;
    }

    availableClasses = await getClassesByGrade(grade);
    dom.login.classSelect.innerHTML = '<option value="">-- Selecione --</option>';
    
    availableClasses.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = `Turma ${cls.name}`;
        dom.login.classSelect.appendChild(option);
    });
    
    dom.login.classSelect.disabled = false;
}

/**
 * Preenche o seletor de alunos, buscando a lista da turma e verificando quem já concluiu a prova.
 * @param {string} classId - O ID da turma selecionada.
 */
async function populateStudents(classId) {
    dom.login.studentSelect.innerHTML = '<option value="">-- A carregar alunos... --</option>';
    dom.login.studentSelect.disabled = true;
    dom.login.adaptationLegend.classList.add('hidden'); // Esconde a legenda ao trocar de turma

    if (!classId) {
        dom.login.studentSelect.innerHTML = '<option value="">-- Selecione a turma primeiro --</option>';
        return;
    }
    
    const [students, submissions] = await Promise.all([
        getStudentsByClass(classId),
        getAllSubmissionsForDashboard()
    ]);
    
    availableStudents = students;
    completedSubmissions = submissions;
    
    const completedStudentIds = new Set(
        submissions.map(sub => sub.student_id)
    );

    dom.login.studentSelect.innerHTML = '<option value="">-- Selecione --</option>';

    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        let studentName = student.full_name;

        // Adiciona o asterisco se o aluno tiver detalhes de adaptação
        if (student.adaptation_details) {
            studentName += " *";
        }

        option.textContent = studentName;

        if (completedStudentIds.has(student.id)) {
            option.disabled = true;
            option.textContent += " (Concluído)";
        }
        dom.login.studentSelect.appendChild(option);
    });
    
    dom.login.studentSelect.disabled = false;
}

/**
 * Verifica se todos os campos foram preenchidos e controla a visibilidade da legenda.
 */
function checkFormCompletion() {
    const isComplete = dom.login.yearSelect.value && dom.login.classSelect.value && dom.login.studentSelect.value;
    dom.login.startBtn.disabled = !isComplete;

    // LÓGICA DA LEGENDA
    const selectedOption = dom.login.studentSelect.options[dom.login.studentSelect.selectedIndex];
    if (selectedOption && selectedOption.textContent.includes('*')) {
        dom.login.adaptationLegend.classList.remove('hidden');
    } else {
        dom.login.adaptationLegend.classList.add('hidden');
    }
}

/**
 * Configura os event listeners para a tela de login.
 * @param {Function} startAssessmentCallback - A função a ser chamada quando o botão "Iniciar" é clicado.
 */
export function initializeLoginScreen(startAssessmentCallback) {
    populateYears();

    dom.login.yearSelect.addEventListener('change', async (e) => {
        await populateClasses(e.target.value);
        checkFormCompletion();
    });

    dom.login.classSelect.addEventListener('change', async (e) => {
        await populateStudents(e.target.value);
        checkFormCompletion();
    });

    dom.login.studentSelect.addEventListener('change', checkFormCompletion);

    dom.login.startBtn.addEventListener('click', () => {
        const selectedClass = availableClasses.find(c => c.id === dom.login.classSelect.value);
        const selectedStudent = availableStudents.find(s => s.id === dom.login.studentSelect.value);

        const studentData = {
            id: selectedStudent.id,
            name: selectedStudent.full_name,
            grade: dom.login.yearSelect.value,
            classId: selectedClass.id,
            className: selectedClass.name,
            // Guarda os detalhes da adaptação no estado
            adaptationDetails: selectedStudent.adaptation_details || null
        };
        
        updateState({ currentStudent: studentData });
        
        startAssessmentCallback();
    });
}

