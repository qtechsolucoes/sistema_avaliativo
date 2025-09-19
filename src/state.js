// src/state.js

// O objeto 'state' armazena todas as variáveis que mudam durante o uso da aplicação.
export let state = {
    currentStudent: {},
    currentAssessment: {},
    currentQuestionIndex: 0,
    score: 0,
    answerLog: [],
    questionStartTime: null,
    assessmentStartTime: null,
    allResultsData: [] 
};

// O objeto 'dom' armazena referências para todos os elementos HTML.
export const dom = {
    screens: {
        login: document.getElementById('login-screen'),
        quiz: document.getElementById('quiz-screen'),
        results: document.getElementById('results-screen'),
        teacherArea: document.getElementById('teacher-area-screen'),
        teacherDashboard: document.getElementById('teacher-dashboard'),
        locked: document.getElementById('locked-screen'),
        // ADICIONADO: Nova tela de avaliação
        dragDrop: document.getElementById('drag-drop-screen')
    },
    login: {
        yearSelect: document.getElementById('year-select'),
        classSelect: document.getElementById('class-select'),
        studentSelect: document.getElementById('student-select'),
        startBtn: document.getElementById('start-btn'),
        errorMessage: document.getElementById('error-message-container'),
        teacherLoginLink: document.getElementById('teacher-login-link'),
        adaptationLegend: document.getElementById('adaptation-legend')
    },
    quiz: {
        studentInfoDisplay: document.getElementById('student-info-display'),
        progress: document.getElementById('progress'),
        question: document.getElementById('question'),
        optionsContainer: document.getElementById('options-container'),
        feedback: document.getElementById('feedback'),
        nextBtn: document.getElementById('next-btn'),
        warningMessage: document.getElementById('warning-message'),
        baseTextDesktop: document.getElementById('base-text-desktop'),
        baseTextMobile: document.getElementById('base-text-mobile'),
        openSidebarBtn: document.getElementById('open-sidebar-btn'),
        closeSidebarBtn: document.getElementById('close-sidebar-btn'),
        mobileSidebar: document.getElementById('text-panel-mobile'),
        mobileSidebarOverlay: document.getElementById('mobile-sidebar-overlay')
    },
    results: {
        score: document.getElementById('score'),
        decimalScore: document.getElementById('decimal-score'),
        saveStatus: document.getElementById('save-status'),
        backToStartBtn: document.getElementById('back-to-start-btn')
    },
    teacher: {
        backToStartFromAreaBtn: document.getElementById('back-to-start-from-teacher-area-btn'),
        generateFileBtn: document.getElementById('generate-test-file-btn'),
        exportBtn: document.getElementById('export-results-btn'),
        importBtn: document.getElementById('import-results-btn'),
        importInput: document.getElementById('import-file-input'),
        syncStatus: document.getElementById('sync-status'),
        viewDashboardBtn: document.getElementById('view-dashboard-btn'),
    },
    dashboard: {
        backToAreaBtn: document.getElementById('back-to-teacher-area-btn'),
        yearFilter: document.getElementById('dashboard-year-filter'),
        classFilter: document.getElementById('dashboard-class-filter'),
        avgScore: document.getElementById('avg-score'),
        totalAssessments: document.getElementById('total-assessments'),
        totalStudents: document.getElementById('total-students'),
        tableBody: document.getElementById('results-table-body'),
        charts: {}
    },
    modal: {
        overlay: document.getElementById('confirmation-modal-overlay'),
        studentInfo: document.getElementById('modal-student-info'),
        confirmBtn: document.getElementById('confirm-finish-btn'),
        cancelBtn: document.getElementById('cancel-finish-btn')
    },
    locked: {
        unlockBtn: document.getElementById('unlock-btn')
    },
    // ADICIONADO: Elementos da nova avaliação de arrastar e soltar
    dragDrop: {
        instruction: document.getElementById('drag-drop-instruction'),
        itemsContainer: document.getElementById('drag-items-container'),
        targetsContainer: document.getElementById('drop-targets-container'),
        feedback: document.getElementById('drag-drop-feedback'),
        nextBtn: document.getElementById('drag-drop-next-btn')
    }
};

// Função para permitir que outros módulos modifiquem o estado de forma controlada.
export function updateState(newState) {
    state = { ...state, ...newState };
}