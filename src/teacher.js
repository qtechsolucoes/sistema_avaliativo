// src/teacher.js

import { state, dom, updateState } from './state.js';
import { showScreen } from './navigation.js';
// Importa TODAS as funções necessárias do database.js
import { 
    getAllSubmissionsForDashboard, 
    getSubmissionAnswers, 
    getClassesByGrade, 
    getStudentsByClass, 
    getAssessmentData,
    saveSubmission
} from './database.js';

// --- Variáveis dos Gráficos ---
let allCharts = {};

// ===================================================================================
// LÓGICA DA ÁREA DO PROFESSOR (MENU PRINCIPAL)
// ===================================================================================

/**
 * Exibe a tela principal da área do professor após validação por senha.
 */
function showTeacherArea() {
    const password = prompt("Digite a senha de acesso:");
    if (password === "admin123") { // Senha de exemplo
        showScreen('teacherArea');
    } else if (password) {
        alert("Senha incorreta.");
    }
}

/**
 * Gera um ficheiro HTML autônomo para a prova offline.
 * Busca todos os dados necessários do Supabase e os embute no ficheiro.
 */
async function generateTestFile() {
    alert("Aguarde, a preparar o ficheiro autónomo para a prova...\nIsto pode demorar um momento.");
    
    try {
        // 1. Busca todos os dados necessários para o modo offline em paralelo
        const [
            htmlTemplate,
            mainCss,
            ...jsModulesContent
        ] = await Promise.all([
            fetch('../index.html').then(res => res.text()),
            fetch('../styles/main.css').then(res => res.text()),
            // Busca o conteúdo de todos os módulos JS
            ...['state.js', 'config.js', 'database.js', 'navigation.js', 'login.js', 'quiz.js', 'ui.js', 'teacher.js', 'main.js'].map(file => fetch(`./${file}`).then(res => res.text()))
        ]);

        // 2. Monta o novo ficheiro HTML
        let finalHtml = htmlTemplate;

        // Substitui o link CSS pelo conteúdo embutido
        finalHtml = finalHtml.replace(
            '<link rel="stylesheet" href="styles/main.css">',
            `<style>\n${mainCss}\n</style>`
        );
        
        // Concatena e limpa o código JS para funcionar de forma não modular
        let combinedJs = jsModulesContent.join('\n\n');
        combinedJs = combinedJs.replace(/import.*?from.*?['"].*?['"];?/gs, '');
        combinedJs = combinedJs.replace(/export (default |const |let |function |async function )/g, 'const ');

        // Substitui o script modular pelo script combinado
        finalHtml = finalHtml.replace(
            '<script type="module" src="src/main.js"></script>',
            `<script>\n// Ficheiro gerado automaticamente\n${combinedJs}\n</script>`
        );

        // 3. Gera e baixa o ficheiro
        const blob = new Blob([finalHtml], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'plataforma_avaliacoes_offline.html';
        link.click();
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Erro ao gerar o ficheiro da prova:", error);
        alert("Ocorreu um erro ao gerar o ficheiro. Verifique a consola para mais detalhes.");
    }
}


/**
 * Exporta os resultados pendentes salvos no localStorage para um arquivo JSON.
 */
function exportResults() {
    const localResults = localStorage.getItem('pending_results');
    if (!localResults || JSON.parse(localResults).length === 0) {
        alert("Não há resultados locais pendentes para exportar.");
        return;
    }
    const blob = new Blob([localResults], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    link.download = `resultados_locais_${date}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
}

/**
 * Dispara o seletor de arquivos para importação.
 */
function importResults() {
    dom.teacher.importInput.click();
}

/**
 * Processa o ficheiro JSON importado e tenta sincronizar com o Supabase.
 * @param {Event} event - O evento de mudança do input de ficheiro.
 */
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const resultsToImport = JSON.parse(e.target.result);
            if (!Array.isArray(resultsToImport)) throw new Error("Ficheiro inválido.");
            dom.teacher.syncStatus.textContent = `A importar ${resultsToImport.length} resultados...`;
            
            let successCount = 0;
            for (const result of resultsToImport) {
                const { success } = await saveSubmission(result);
                if (success) successCount++;
            }
            dom.teacher.syncStatus.textContent = `${successCount} de ${resultsToImport.length} resultados foram sincronizados com sucesso.`;

        } catch (err) {
            dom.teacher.syncStatus.textContent = "Erro ao ler ou importar o ficheiro.";
            console.error(err);
        }
    };
    reader.readAsText(file);
}


// ===================================================================================
// LÓGICA DO PAINEL DE DESEMPENHO (DASHBOARD)
// ===================================================================================

/**
 * Busca os dados mais recentes e exibe o painel de desempenho.
 */
async function showTeacherDashboard() {
    dom.dashboard.tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">A carregar dados...</td></tr>';
    const results = await getAllSubmissionsForDashboard();
    updateState({ allResultsData: results });
    
    setupDashboardFilters();
    updateDashboard(state.allResultsData);
    showScreen('teacherDashboard');
}

/**
 * Configura os filtros do painel (Ano e Turma).
 */
function setupDashboardFilters() {
    const yearFilter = dom.dashboard.yearFilter;
    yearFilter.innerHTML = '<option value="all">Todos os Anos</option>';
    
    const years = [...new Set(state.allResultsData.map(r => {
        const match = r.assessments.title.match(/(\d+)º Ano/);
        return match ? match[1] : null;
    }))].filter(Boolean).sort();
    
    years.forEach(year => yearFilter.add(new Option(`${year}º Ano`, year)));
}


/**
 * Filtra os dados do painel com base nas seleções dos filtros.
 */
function filterDashboardData() {
    alert("Funcionalidade de filtro avançado em desenvolvimento.");
}

/**
 * Atualiza todos os componentes do painel com os dados.
 * @param {Array} results - A lista de submissões a ser exibida.
 */
function updateDashboard(results) {
    updateDashboardStats(results);
    renderResultsTable(results);
    renderScoreDistributionChart(results);
    // Chama as novas funções de gráfico
    renderQuestionDifficultyChart(results); 
    renderTimePerQuestionChart(results);
}

/**
 * Atualiza os cartões de métricas gerais (Média, Total, etc.).
 * @param {Array} results - A lista de submissões.
 */
function updateDashboardStats(results) {
    dom.dashboard.totalAssessments.textContent = results.length;
    dom.dashboard.totalStudents.textContent = [...new Set(results.map(r => r.student_id))].length;

    if (results.length > 0) {
        const totalScore = results.reduce((sum, r) => sum + (r.score / r.total_questions), 0);
        const avg = (totalScore / results.length) * 100;
        dom.dashboard.avgScore.textContent = `${avg.toFixed(1)}%`;
    } else {
        dom.dashboard.avgScore.textContent = `0%`;
    }
}

/**
 * Renderiza a tabela de resultados individuais.
 * @param {Array} results - A lista de submissões.
 */
function renderResultsTable(results) {
    dom.dashboard.tableBody.innerHTML = '';
    if (results.length === 0) {
        dom.dashboard.tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Nenhum resultado encontrado.</td></tr>';
        return;
    }
    
    results.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at) || a.students.full_name.localeCompare(b.students.full_name));

    results.forEach(r => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-slate-50';
        const decimalScore = (r.score * 10 / r.total_questions).toFixed(1).replace('.', ',');
        const duration = r.total_duration_seconds ? `${Math.floor(r.total_duration_seconds / 60)}m ${r.total_duration_seconds % 60}s` : 'N/A';
        row.innerHTML = `
            <td class="p-3">${r.students.full_name}</td>
            <td class="p-3">${r.assessments.title}</td>
            <td class="p-3 font-semibold">${decimalScore} (${r.score}/${r.total_questions})</td>
            <td class="p-3">${duration}</td>
            <td class="p-3 text-sm">${new Date(r.submitted_at).toLocaleString('pt-BR')}</td>
        `;
        dom.dashboard.tableBody.appendChild(row);
    });
}

// ===================================================================================
// FUNÇÕES DE RENDERIZAÇÃO DE GRÁFICOS (AGORA IMPLEMENTADAS)
// ===================================================================================

/**
 * Função genérica para criar ou atualizar um gráfico.
 */
function renderChart(canvasId, type, data, options) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (dom.dashboard.charts[canvasId]) {
        dom.dashboard.charts[canvasId].destroy();
    }
    dom.dashboard.charts[canvasId] = new Chart(ctx, { type, data, options });
}

/**
 * NOVA IMPLEMENTAÇÃO: Renderiza um gráfico de barras mostrando acertos e erros por questão.
 * @param {Array} results - Lista de todas as submissões.
 */
async function renderQuestionDifficultyChart(results) {
    if (results.length === 0) return;

    // 1. Busca todas as respostas detalhadas de todas as submissões em paralelo.
    const allAnswerSets = await Promise.all(results.map(r => getSubmissionAnswers(r.id)));
    const allAnswers = allAnswerSets.flat();

    // 2. Agrega os dados: conta acertos e erros para cada questão.
    const questionStats = {};
    allAnswers.forEach(answer => {
        if (!questionStats[answer.question_id]) {
            questionStats[answer.question_id] = {
                text: answer.questions.question_text,
                correct: 0,
                incorrect: 0
            };
        }
        if (answer.is_correct) {
            questionStats[answer.question_id].correct++;
        } else {
            questionStats[answer.question_id].incorrect++;
        }
    });

    // 3. Prepara os dados para o formato do Chart.js.
    const labels = Object.values(questionStats).map(q => `Q: ${q.text.substring(0, 25)}...`);
    const correctData = Object.values(questionStats).map(q => q.correct);
    const incorrectData = Object.values(questionStats).map(q => q.incorrect);

    // 4. Renderiza o gráfico.
    renderChart('question-difficulty-chart', 'bar', {
        labels: labels,
        datasets: [{
            label: 'Acertos',
            data: correctData,
            backgroundColor: 'rgba(74, 222, 128, 0.8)',
        }, {
            label: 'Erros',
            data: incorrectData,
            backgroundColor: 'rgba(248, 113, 113, 0.8)',
        }]
    }, { 
        responsive: true,
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
        plugins: { tooltip: { callbacks: { title: (tooltipItems) => questionStats[Object.keys(questionStats)[tooltipItems[0].dataIndex]].text } } }
    });
}

/**
 * NOVA IMPLEMENTAÇÃO: Renderiza um gráfico de barras mostrando o tempo médio por questão.
 * @param {Array} results - Lista de todas as submissões.
 */
async function renderTimePerQuestionChart(results) {
    if (results.length === 0) return;

    // 1. Busca todas as respostas detalhadas (poderia ser otimizado para não buscar duas vezes).
    const allAnswerSets = await Promise.all(results.map(r => getSubmissionAnswers(r.id)));
    const allAnswers = allAnswerSets.flat();

    // 2. Agrega os dados: calcula a soma das durações e a contagem de respostas.
    const timeStats = {};
    allAnswers.forEach(answer => {
        if (!timeStats[answer.question_id]) {
            timeStats[answer.question_id] = {
                text: answer.questions.question_text,
                totalDuration: 0,
                count: 0
            };
        }
        timeStats[answer.question_id].totalDuration += answer.duration_seconds || 0;
        timeStats[answer.question_id].count++;
    });

    // 3. Prepara os dados, calculando a média.
    const labels = Object.values(timeStats).map(q => `Q: ${q.text.substring(0, 25)}...`);
    const averageTimeData = Object.values(timeStats).map(q => (q.totalDuration / q.count).toFixed(1));

    // 4. Renderiza o gráfico.
    renderChart('time-per-question-chart', 'bar', {
        labels: labels,
        datasets: [{
            label: 'Tempo Médio (em segundos)',
            data: averageTimeData,
            backgroundColor: 'rgba(96, 165, 250, 0.8)',
        }]
    }, { 
        responsive: true,
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Segundos' } } },
        plugins: { tooltip: { callbacks: { title: (tooltipItems) => timeStats[Object.keys(timeStats)[tooltipItems[0].dataIndex]].text } } }
    });
}

function renderScoreDistributionChart(results) {
    const ranges = { '0-4': 0, '5-7': 0, '8-10': 0 };
    results.forEach(r => {
        const score = r.score * 10 / r.total_questions;
        if (score <= 4.9) ranges['0-4']++;
        else if (score <= 7.9) ranges['5-7']++;
        else ranges['8-10']++;
    });
    renderChart('score-distribution-chart', 'pie', {
        labels: ['Notas 0-4.9 (Baixo)', 'Notas 5-7.9 (Médio)', 'Notas 8-10 (Alto)'],
        datasets: [{
            data: [ranges['0-4'], ranges['5-7'], ranges['8-10']],
            backgroundColor: ['rgba(248, 113, 113, 0.8)', 'rgba(250, 204, 21, 0.8)', 'rgba(74, 222, 128, 0.8)'],
        }]
    }, { responsive: true });
}

/**
 * Configura todos os event listeners da área do professor e do painel.
 */
export function initializeTeacherArea(loginCallback) {
    dom.login.teacherLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showTeacherArea();
    });
    dom.teacher.backToStartFromAreaBtn.addEventListener('click', loginCallback);
    dom.teacher.generateFileBtn.addEventListener('click', generateTestFile);
    dom.teacher.exportBtn.addEventListener('click', exportResults);
    dom.teacher.importBtn.addEventListener('click', importResults);
    dom.teacher.importInput.addEventListener('change', handleFileUpload);
    dom.teacher.viewDashboardBtn.addEventListener('click', showTeacherDashboard);
    dom.dashboard.backToAreaBtn.addEventListener('click', () => showScreen('teacherArea'));
}