const response = await fetch (`http://\${networkDetector.teacherIP}:\${NETWORK_CONFIG.teacherServerPort}/submit\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(result),
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                console.log(\`✅ Resultado enviado para o professor (tentativa \${attempt})\`);
                return { success: true, method: 'network', attempt };
            }
        } catch (error) {
            console.warn(\`❌ Tentativa \${attempt} falhou:\`, error.message);
            
            if (attempt < NETWORK_CONFIG.maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
    
    return { success: false, reason: 'network_failed' };
}

// SALVAMENTO OFFLINE COM EXPORT AUTOMÁTICO
function saveOfflineWithAutoExport(result) {
    // LOCALSTORAGE BACKUP
    const offlineResults = JSON.parse(localStorage.getItem('offline_results') || '[]');
    offlineResults.push(result);
    localStorage.setItem('offline_results', JSON.stringify(offlineResults));
    
    // GERAÇÃO AUTOMÁTICA DE JSON COM NOME ESTRUTURADO
    generateStructuredResultFile(result);
    
    console.log('📁 Resultado salvo offline e JSON gerado automaticamente');
}

// GERAÇÃO DE ARQUIVO COM NOME ESTRUTURADO
function generateStructuredResultFile(result) {
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            student: result.studentName,
            grade: result.grade,
            className: result.className,
            exportType: 'individual_auto',
            systemInfo: {
                userAgent: navigator.userAgent,
                timestamp: result.timestamp
            }
        },
        result: result
    };
    
    // NOME ESTRUTURADO: Nome_Ano_Turma_Data
    const safeName = result.studentName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = \`\${safeName}_\${result.grade}ano_turma\${result.className}_\${dateStr}.json\`;
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json;charset=utf-8' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    
    // DOWNLOAD AUTOMÁTICO
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log(\`📁 Arquivo JSON gerado: \${fileName}\`);
}

// ÁREA DO PROFESSOR COM FUNCIONALIDADES COMPLETAS
function setupTeacherArea() {
    const offlineResults = JSON.parse(localStorage.getItem('offline_results') || '[]');
    
    // STATUS DA REDE LOCAL
    const networkStatus = networkDetector.teacherServerFound ? 
        '🟢 Servidor Local Ativo' : '🔴 Servidor Local Inativo';
    
    if (dom.teacher.syncStatus) {
        dom.teacher.syncStatus.innerHTML = \`
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="font-medium">Status da Rede:</span>
                    <span class="text-sm">\${networkStatus}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="font-medium">Resultados Locais:</span>
                    <span class="text-sm">\${offlineResults.length} arquivos</span>
                </div>
            </div>
        \`;
    }
}

// EXPORTAÇÃO POR ALUNO (MÚLTIPLOS ARQUIVOS)
function exportResultsByStudent() {
    const results = JSON.parse(localStorage.getItem('offline_results') || '[]');
    
    if (results.length === 0) {
        alert('Nenhum resultado para exportar');
        return;
    }
    
    // AGRUPA POR ALUNO
    const studentGroups = {};
    results.forEach(result => {
        const key = \`\${result.studentId}_\${result.grade}_\${result.className}\`;
        if (!studentGroups[key]) {
            studentGroups[key] = [];
        }
        studentGroups[key].push(result);
    });
    
    // EXPORTA ARQUIVO PARA CADA ALUNO
    Object.entries(studentGroups).forEach(([key, studentResults]) => {
        const firstResult = studentResults[0];
        exportStudentFile(firstResult, studentResults);
    });
    
    alert(\`Exportados \${Object.keys(studentGroups).length} arquivos (um por aluno)\`);
}

// EXPORTAÇÃO CONSOLIDADA (ARQUIVO ÚNICO)
function exportResultsConsolidated() {
    const results = JSON.parse(localStorage.getItem('offline_results') || '[]');
    
    if (results.length === 0) {
        alert('Nenhum resultado para exportar');
        return;
    }
    
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            totalResults: results.length,
            exportType: 'consolidated',
            exportedBy: 'Professor - Área Offline'
        },
        results: results
    };
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = \`resultados_consolidados_\${timestamp}.json\`;
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json;charset=utf-8' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log(\`📁 Arquivo consolidado exportado: \${fileName}\`);
}

// MONITORAMENTO DE CONECTIVIDADE
window.addEventListener('online', () => {
    appState.isOnline = true;
    console.log('🌐 Conexão restaurada');
});

window.addEventListener('offline', () => {
    appState.isOnline = false;
    console.log('📱 Modo offline ativado');
});

// INICIALIZAÇÃO DO SISTEMA HÍBRIDO
function initializeHybridApp() {
    console.log('🚀 Inicializando sistema híbrido...');
    
    // DETECÇÃO INICIAL DE REDE
    networkDetector.detectTeacherServer();
    
    populateYears();
    
    // EVENT LISTENERS
    dom.login.yearSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            populateClasses(e.target.value);
        }
        checkFormCompletion();
    });
    
    dom.login.classSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            populateStudents(e.target.value);
        }
        checkFormCompletion();
    });
    
    dom.login.studentSelect.addEventListener('change', checkFormCompletion);
    dom.login.startBtn.addEventListener('click', startAssessment);
    dom.quiz.nextBtn.addEventListener('click', nextQuestion);
    dom.results.backToStartBtn.addEventListener('click', () => showScreen('login'));
    
    // ÁREA DO PROFESSOR (se existir)
    if (dom.teacher.exportBtn) {
        dom.teacher.exportBtn.addEventListener('click', exportResultsByStudent);
    }
    
    if (dom.teacher.importBtn) {
        dom.teacher.importBtn.addEventListener('click', () => {
            dom.teacher.importInput.click();
        });
    }
    
    showScreen('login');
    console.log('✅ Sistema híbrido inicializado');
}

// INICIALIZAÇÃO
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHybridApp);
} else {
    initializeHybridApp();
}
`);


function exportResults() {
    try {
        const localResults = localStorage.getItem('pending_results');
        
        if (!localResults || JSON.parse(localResults).length === 0) {
            alert("Não há resultados locais para exportar.");
            return;
        }

        const results = JSON.parse(localResults);
        
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalResults: results.length,
                exportedBy: 'Sistema de Avaliações'
            },
            results: results
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json;charset=utf-8' 
        });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        link.download = `resultados_avaliacoes_${timestamp}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        dom.teacher.syncStatus.textContent = `${results.length} resultados exportados com sucesso!`;
        dom.teacher.syncStatus.style.color = 'green';
        
    } catch (error) {
        console.error('Erro na exportação:', error);
        dom.teacher.syncStatus.textContent = "Erro ao exportar resultados.";
        dom.teacher.syncStatus.style.color = 'red';
    }
}

function importResults() {
    dom.teacher.importInput.click();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    event.target.value = '';
    
    dom.teacher.syncStatus.textContent = "Processando arquivo...";
    dom.teacher.syncStatus.style.color = '#64748b';

    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const fileContent = JSON.parse(e.target.result);
            
            let resultsToImport = [];
            
            if (fileContent.results && Array.isArray(fileContent.results)) {
                resultsToImport = fileContent.results;
                console.log('Arquivo com metadados detectado:', fileContent.metadata);
            } else if (Array.isArray(fileContent)) {
                resultsToImport = fileContent;
            } else {
                throw new Error("Formato de arquivo não reconhecido");
            }

            if (resultsToImport.length === 0) {
                throw new Error("Nenhum resultado encontrado no arquivo");
            }

            dom.teacher.syncStatus.textContent = `Importando ${resultsToImport.length} resultados...`;
            
            let onlineCount = 0;
            
            for (const result of resultsToImport) {
                try {
                    const saveResult = await saveSubmission(result);
                    if (saveResult.success && saveResult.synced) {
                        onlineCount++;
                    }
                } catch (error) {
                    console.warn('Erro ao importar resultado individual:', error);
                }
            }
            
            dom.teacher.syncStatus.textContent = 
                `Importação concluída: ${onlineCount} enviados online, ${resultsToImport.length - onlineCount} salvos localmente.`;
            dom.teacher.syncStatus.style.color = 'green';

        } catch (error) {
            console.error('Erro na importação:', error);
            dom.teacher.syncStatus.textContent = `Erro na importação: ${error.message}`;
            dom.teacher.syncStatus.style.color = 'red';
        }
    };

    reader.onerror = () => {
        dom.teacher.syncStatus.textContent = "Erro ao ler o arquivo.";
        dom.teacher.syncStatus.style.color = 'red';
    };

    reader.readAsText(file);
}

// ===================================================================================
// DASHBOARD AVANÇADO COM FILTROS MELHORADOS
// ===================================================================================

async function showTeacherDashboard() {
    try {
        dom.dashboard.tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Carregando dados...</td></tr>';
        
        const results = await getAllSubmissionsForDashboard();
        
        if (!Array.isArray(results)) {
            throw new Error('Dados inválidos retornados do banco');
        }
        
        updateState({ allResultsData: results });
        
        setupAdvancedDashboardFilters();
        updateStandardDashboard(results);
        showScreen('teacherDashboard');
        
        console.log(`Dashboard carregado com ${results.length} submissões`);
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        dom.dashboard.tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="p-4 text-center text-red-600">
                    Erro ao carregar dados: ${error.message}
                    <br><button class="mt-2 px-4 py-2 bg-blue-600 text-white rounded" onclick="location.reload()">
                        Recarregar
                    </button>
                </td>
            </tr>
        `;
    }
}

function setupAdvancedDashboardFilters() {
    const yearFilter = dom.dashboard.yearFilter;
    const classFilter = dom.dashboard.classFilter;
    
    yearFilter.innerHTML = '<option value="all">Todos os Anos</option>';
    classFilter.innerHTML = '<option value="all">Todas as Turmas</option>';
    
    if (!state.allResultsData || state.allResultsData.length === 0) {
        return;
    }
    
    const yearsSet = new Set();
    const classesMap = new Map();
    
    state.allResultsData.forEach(result => {
        let year = null;
        
        if (result.assessments && result.assessments.title) {
            const match = result.assessments.title.match(/(\d+)º Ano/);
            if (match) year = match[1];
        }
        
        if (year) {
            yearsSet.add(year);
            
            if (result.student_class) {
                if (!classesMap.has(year)) {
                    classesMap.set(year, new Set());
                }
                classesMap.get(year).add(result.student_class);
            }
        }
    });
    
    const sortedYears = Array.from(yearsSet).sort();
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}º Ano`;
        yearFilter.appendChild(option);
    });
    
    if (sortedYears.length > 1) {
        const compareOption = document.createElement('option');
        compareOption.value = 'compare_years';
        compareOption.textContent = 'Comparar Todos os Anos';
        yearFilter.appendChild(compareOption);
    }
    
    yearFilter.addEventListener('change', () => {
        updateClassFilter(classesMap);
        applyDashboardFilters();
    });
    
    classFilter.addEventListener('change', applyDashboardFilters);
    
    updateClassFilter(classesMap);
}

function updateClassFilter(classesMap) {
    const yearFilter = dom.dashboard.yearFilter;
    const classFilter = dom.dashboard.classFilter;
    const selectedYear = yearFilter.value;
    
    classFilter.innerHTML = '<option value="all">Todas as Turmas</option>';
    
    if (selectedYear === 'all' || selectedYear === 'compare_years') {
        const allClasses = new Set();
        classesMap.forEach(classes => {
            classes.forEach(cls => allClasses.add(cls));
        });
        
        Array.from(allClasses).sort().forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = `Turma ${className}`;
            classFilter.appendChild(option);
        });
        
        if (allClasses.size > 1) {
            const compareOption = document.createElement('option');
            compareOption.value = 'compare_classes';
            compareOption.textContent = 'Comparar Turmas';
            classFilter.appendChild(compareOption);
        }
    } else {
        if (classesMap.has(selectedYear)) {
            const yearClasses = Array.from(classesMap.get(selectedYear)).sort();
            yearClasses.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = `Turma ${className}`;
                classFilter.appendChild(option);
            });
            
            if (yearClasses.length > 1) {
                const compareOption = document.createElement('option');
                compareOption.value = 'compare_classes';
                compareOption.textContent = `Comparar Turmas do ${selectedYear}º Ano`;
                classFilter.appendChild(compareOption);
            }
        }
    }
}

function applyDashboardFilters() {
    const yearFilter = dom.dashboard.yearFilter.value;
    const classFilter = dom.dashboard.classFilter.value;
    
    let filteredResults = [...state.allResultsData];
    
    if (yearFilter !== 'all' && yearFilter !== 'compare_years') {
        filteredResults = filteredResults.filter(result => {
            const match = result.assessments.title.match(/(\d+)º Ano/);
            return match && match[1] === yearFilter;
        });
    }
    
    if (classFilter !== 'all' && classFilter !== 'compare_classes') {
        filteredResults = filteredResults.filter(result => 
            result.student_class === classFilter
        );
    }
    
    if (yearFilter === 'compare_years') {
        updateComparativeYearsDashboard(state.allResultsData);
    } else if (classFilter === 'compare_classes') {
        updateComparativeClassesDashboard(filteredResults, yearFilter);
    } else {
        updateStandardDashboard(filteredResults);
    }
}

function updateStandardDashboard(results) {
    updateDashboardStats(results);
    renderAdvancedResultsTable(results);
    renderScoreDistributionChart(results);
    renderQuestionDifficultyChart(results);
    renderTimePerQuestionChart(results);
}

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

function renderAdvancedResultsTable(results, sortMode = 'default') {
    dom.dashboard.tableBody.innerHTML = '';
    
    if (results.length === 0) {
        dom.dashboard.tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center">Nenhum resultado encontrado.</td></tr>';
        return;
    }
    
    let sortedResults = [...results];
    
    switch (sortMode) {
        case 'year':
            sortedResults.sort((a, b) => {
                const yearA = extractYear(a);
                const yearB = extractYear(b);
                if (yearA !== yearB) return yearA - yearB;
                return a.students.full_name.localeCompare(b.students.full_name);
            });
            break;
        case 'class':
            sortedResults.sort((a, b) => {
                const classA = a.student_class || 'ZZZ';
                const classB = b.student_class || 'ZZZ';
                if (classA !== classB) return classA.localeCompare(classB);
                return a.students.full_name.localeCompare(b.students.full_name);
            });
            break;
        default:
            sortedResults.sort((a, b) => {
                const yearA = extractYear(a);
                const yearB = extractYear(b);
                if (yearA !== yearB) return yearA - yearB;
                
                const classA = a.student_class || 'ZZZ';
                const classB = b.student_class || 'ZZZ';
                if (classA !== classB) return classA.localeCompare(classB);
                
                return a.students.full_name.localeCompare(b.students.full_name);
            });
    }
    
    updateTableHeader();
    
    sortedResults.forEach(r => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-slate-50';
        
        const year = extractYear(r);
        const className = r.student_class || 'N/A';
        const decimalScore = (r.score * 10 / r.total_questions).toFixed(1).replace('.', ',');
        const duration = r.total_duration_seconds ? 
            `${Math.floor(r.total_duration_seconds / 60)}m ${r.total_duration_seconds % 60}s` : 'N/A';
        
        row.innerHTML = `
            <td class="p-3">${r.students.full_name}</td>
            <td class="p-3 text-center font-medium">${year}º</td>
            <td class="p-3 text-center font-medium">${className}</td>
            <td class="p-3 font-semibold ${getScoreColorClass(r.score, r.total_questions)}">${decimalScore} (${r.score}/${r.total_questions})</td>
            <td class="p-3 text-center">${duration}</td>
            <td class="p-3 text-sm text-gray-600">${new Date(r.submitted_at).toLocaleString('pt-BR')}</td>
        `;
        
        dom.dashboard.tableBody.appendChild(row);
    });
}

function extractYear(result) {
    if (result.student_grade) return parseInt(result.student_grade);
    
    const match = result.assessments?.title?.match(/(\d+)º Ano/);
    return match ? parseInt(match[1]) : 0;
}

function updateTableHeader() {
    const tableHeader = document.querySelector('#results-table-body').closest('table').querySelector('thead tr');
    if (tableHeader && !tableHeader.querySelector('[data-enhanced]')) {
        tableHeader.innerHTML = `
            <th class="p-3 font-semibold">Aluno</th>
            <th class="p-3 font-semibold text-center">Ano</th>
            <th class="p-3 font-semibold text-center">Turma</th>
            <th class="p-3 font-semibold">Nota</th>
            <th class="p-3 font-semibold text-center">Duração</th>
            <th class="p-3 font-semibold">Data</th>
        `;
        tableHeader.setAttribute('data-enhanced', 'true');
    }
}

function getScoreColorClass(score, totalQuestions) {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 80) return 'text-green-700';
    if (percentage >= 60) return 'text-yellow-700';
    return 'text-red-700';
}

function renderChart(canvasId, type, data, options) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Canvas ${canvasId} não encontrado`);
        return;
    }
    
    if (allCharts[canvasId]) {
        allCharts[canvasId].destroy();
    }
    allCharts[canvasId] = new Chart(ctx.getContext('2d'), { type, data, options });
}

async function renderQuestionDifficultyChart(results) {
    if (results.length === 0) {
        renderChart('question-difficulty-chart', 'bar', {
            labels: ['Sem dados'],
            datasets: [{
                label: 'Sem dados disponíveis',
                data: [0],
                backgroundColor: 'rgba(156, 163, 175, 0.5)',
            }]
        }, { responsive: true });
        return;
    }

    try {
        const allAnswerSets = await Promise.all(results.map(r => getSubmissionAnswers(r.id)));
        const allAnswers = allAnswerSets.flat();

        if (allAnswers.length === 0) {
            renderChart('question-difficulty-chart', 'bar', {
                labels: ['Questões não encontradas'],
                datasets: [{
                    label: 'Dados não disponíveis',
                    data: [0],
                    backgroundColor: 'rgba(156, 163, 175, 0.5)',
                }]
            }, { responsive: true });
            return;
        }

        const questionStats = {};
        allAnswers.forEach(answer => {
            if (!questionStats[answer.question_id]) {
                questionStats[answer.question_id] = {
                    text: answer.questions?.question_text || `Questão ${Object.keys(questionStats).length + 1}`,
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

        const labels = Object.values(questionStats).map((q, i) => `Q${i + 1}`);
        const correctData = Object.values(questionStats).map(q => q.correct);
        const incorrectData = Object.values(questionStats).map(q => q.incorrect);

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
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
        });
    } catch (error) {
        console.error('Erro ao renderizar gráfico de dificuldade:', error);
        renderChart('question-difficulty-chart', 'bar', {
            labels: ['Erro'],
            datasets: [{
                label: 'Erro no carregamento',
                data: [1],
                backgroundColor: 'rgba(248, 113, 113, 0.5)',
            }]
        }, { responsive: true });
    }
}

async function renderTimePerQuestionChart(results) {
    if (results.length === 0) {
        renderChart('time-per-question-chart', 'bar', {
            labels: ['Sem dados'],
            datasets: [{
                label: 'Sem dados disponíveis',
                data: [0],
                backgroundColor: 'rgba(156, 163, 175, 0.5)',
            }]
        }, { responsive: true });
        return;
    }

    try {
        const allAnswerSets = await Promise.all(results.map(r => getSubmissionAnswers(r.id)));
        const allAnswers = allAnswerSets.flat();

        if (allAnswers.length === 0) {
            renderChart('time-per-question-chart', 'bar', {
                labels: ['Dados não disponíveis'],
                datasets: [{
                    label: 'Tempo não registrado',
                    data: [0],
                    backgroundColor: 'rgba(156, 163, 175, 0.5)',
                }]
            }, { responsive: true });
            return;
        }

        const timeStats = {};
        allAnswers.forEach(answer => {
            if (!timeStats[answer.question_id]) {
                timeStats[answer.question_id] = {
                    text: answer.questions?.question_text || `Questão ${Object.keys(timeStats).length + 1}`,
                    totalDuration: 0,
                    count: 0
                };
            }
            timeStats[answer.question_id].totalDuration += answer.duration_seconds || 30;
            timeStats[answer.question_id].count++;
        });

        const labels = Object.values(timeStats).map((q, i) => `Q${i + 1}`);
        const averageTimeData = Object.values(timeStats).map(q => 
            q.count > 0 ? (q.totalDuration / q.count).toFixed(1) : 0
        );

        renderChart('time-per-question-chart', 'bar', {
            labels: labels,
            datasets: [{
                label: 'Tempo Médio (segundos)',
                data: averageTimeData,
                backgroundColor: 'rgba(96, 165, 250, 0.8)',
            }]
        }, { 
            responsive: true,
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Segundos' } } }
        });
    } catch (error) {
        console.error('Erro ao renderizar gráfico de tempo:', error);
        renderChart('time-per-question-chart', 'bar', {
            labels: ['Erro'],
            datasets: [{
                label: 'Erro no carregamento',
                data: [1],
                backgroundColor: 'rgba(248, 113, 113, 0.5)',
            }]
        }, { responsive: true });
    }
}

function renderScoreDistributionChart(results) {
    if (results.length === 0) {
        renderChart('score-distribution-chart', 'pie', {
            labels: ['Sem dados'],
            datasets: [{
                data: [1],
                backgroundColor: ['rgba(156, 163, 175, 0.5)'],
            }]
        }, { responsive: true });
        return;
    }

    const ranges = { '0-4': 0, '5-7': 0, '8-10': 0 };
    results.forEach(r => {
        const score = r.total_questions > 0 ? (r.score * 10 / r.total_questions) : 0;
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

function updateComparativeYearsDashboard(allResults) {
    const yearGroups = {};
    allResults.forEach(result => {
        const match = result.assessments.title.match(/(\d+)º Ano/);
        if (match) {
            const year = match[1];
            if (!yearGroups[year]) yearGroups[year] = [];
            yearGroups[year].push(result);
        }
    });
    
    updateComparativeStats(yearGroups, 'ano');
    renderComparativeChart(yearGroups, 'Comparação por Ano', 'anos');
    renderAdvancedResultsTable(allResults, 'year');
}

function updateComparativeClassesDashboard(results, selectedYear) {
    const classGroups = {};
    results.forEach(result => {
        const className = result.student_class || 'Sem Turma';
        if (!classGroups[className]) classGroups[className] = [];
        classGroups[className].push(result);
    });
    
    updateComparativeStats(classGroups, 'turma');
    renderComparativeChart(classGroups, `Comparação de Turmas${selectedYear !== 'all' ? ` - ${selectedYear}º Ano` : ''}`, 'turmas');
    renderAdvancedResultsTable(results, 'class');
}

function updateComparativeStats(groups, type) {
    const groupNames = Object.keys(groups);
    let totalResults = 0;
    let totalStudents = 0;
    let weightedScoreSum = 0;
    
    groupNames.forEach(groupName => {
        const groupResults = groups[groupName];
        totalResults += groupResults.length;
        totalStudents += new Set(groupResults.map(r => r.student_id)).size;
        
        groupResults.forEach(result => {
            weightedScoreSum += (result.score / result.total_questions);
        });
    });
    
    const avgScore = totalResults > 0 ? (weightedScoreSum / totalResults) * 100 : 0;
    
    dom.dashboard.totalAssessments.textContent = totalResults;
    dom.dashboard.totalStudents.textContent = totalStudents;
    dom.dashboard.avgScore.textContent = `${avgScore.toFixed(1)}%`;
    
    const comparisonInfo = document.getElementById('comparison-info') || createComparisonInfoElement();
    comparisonInfo.innerHTML = `
        <h4 class="font-semibold text-gray-700 mb-2">Comparação por ${type}:</h4>
        <div class="space-y-1 text-sm">
            ${groupNames.map(name => {
                const groupResults = groups[name];
                const groupAvg = groupResults.length > 0 ? 
                    (groupResults.reduce((sum, r) => sum + (r.score / r.total_questions), 0) / groupResults.length) * 100 : 0;
                return `<div class="flex justify-between">
                    <span>${type === 'ano' ? name + 'º Ano' : 'Turma ' + name}:</span>
                    <span class="font-medium">${groupAvg.toFixed(1)}%</span>
                </div>`;
            }).join('')}
        </div>
    `;
}

function createComparisonInfoElement() {
    const element = document.createElement('div');
    element.id = 'comparison-info';
    element.className = 'bg-indigo-50 p-4 rounded-lg border border-indigo-200';
    
    const statsGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
    if (statsGrid) {
        statsGrid.parentNode.insertBefore(element, statsGrid.nextSibling);
    }
    
    return element;
}

function renderComparativeChart(groups, title, type) {
    const labels = Object.keys(groups);
    const avgScores = labels.map(label => {
        const results = groups[label];
        return results.length > 0 ? 
            (results.reduce((sum, r) => sum + (r.score / r.total_questions), 0) / results.length) * 100 : 0;
    });
    
    const colors = generateDistinctColors(labels.length);
    
    renderChart('score-distribution-chart', 'bar', {
        labels: labels.map(label => type === 'anos' ? label + 'º Ano' : 'Turma ' + label),
        datasets: [{
            label: 'Média de Acertos (%)',
            data: avgScores,
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.8', '1')),
            borderWidth: 2
        }]
    }, {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: title
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Percentual de Acertos'
                }
            }
        }
    });
}

function generateDistinctColors(count) {
    const colors = [
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(20, 184, 166, 0.8)',
        'rgba(251, 146, 60, 0.8)'
    ];
    
    return Array.from({length: count}, (_, i) => colors[i % colors.length]);
}

// ===================================================================================
// FUNÇÃO PRINCIPAL DE EXPORT - CORRIGIDA
// ===================================================================================

export function initializeTeacherArea(loginCallback, password = "admin123") {
    if (password) {
        adminPassword = password;
        console.log('Senha do administrador configurada');
    }
    
    // Verifica se os elementos DOM existem antes de adicionar listeners
    if (dom.login.teacherLoginLink) {
        dom.login.teacherLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showTeacherArea();
        });
    }
    
    if (dom.teacher.backToStartFromAreaBtn) {
        dom.teacher.backToStartFromAreaBtn.addEventListener('click', loginCallback);
    }
    
    if (dom.teacher.generateFileBtn) {
        dom.teacher.generateFileBtn.addEventListener('click', generateTestFile);
    }
    
    if (dom.teacher.exportBtn) {
        dom.teacher.exportBtn.addEventListener('click', exportResults);
    }
    
    if (dom.teacher.importBtn) {
        dom.teacher.importBtn.addEventListener('click', importResults);
    }
    
    if (dom.teacher.importInput) {
        dom.teacher.importInput.addEventListener('change', handleFileUpload);
    }
    
    if (dom.teacher.viewDashboardBtn) {
        dom.teacher.viewDashboardBtn.addEventListener('click', showTeacherDashboard);
    }
    
    if (dom.dashboard.backToAreaBtn) {
        dom.dashboard.backToAreaBtn.addEventListener('click', () => showScreen('teacherArea'));
    }
    
    console.log('Área do professor inicializada');
}

// EXPORTA TAMBÉM AS FUNÇÕES NECESSÁRIAS PARA O DASHBOARD AVANÇADO
export {
    setupAdvancedDashboardFilters,
    applyDashboardFilters,
    updateComparativeYearsDashboard,
    updateComparativeClassesDashboard,
    renderAdvancedResultsTable
};// src/teacher.js - VERSÃO COMPLETA COM EXPORT CORRIGIDO

import { state, dom, updateState } from './state.js';
import { showScreen } from './navigation.js';
import { 
    getAllSubmissionsForDashboard, 
    getSubmissionAnswers, 
    getClassesByGrade, 
    getStudentsByClass, 
    getAssessmentData,
    saveSubmission,
    syncPendingSubmissions
} from './database.js';

// --- Variáveis dos Gráficos ---
let allCharts = {};
let adminPassword = "admin123";

// ===================================================================================
// LÓGICA DA ÁREA DO PROFESSOR (MENU PRINCIPAL)
// ===================================================================================

function showTeacherArea() {
    const password = prompt("Digite a senha de acesso do professor:");
    
    if (password === adminPassword) {
        showScreen('teacherArea');
    } else if (password !== null) {
        alert("Senha incorreta.");
    }
}

async function generateTestFile() {
    const confirmMsg = "Esta operação irá gerar um arquivo HTML completo para uso offline.\n\n" +
                      "O arquivo incluirá TODOS os dados atuais do Supabase (alunos, turmas, avaliações).\n\n" +
                      "Deseja continuar?";
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    dom.teacher.syncStatus.textContent = "Coletando TODOS os dados do Supabase...";
    dom.teacher.generateFileBtn.disabled = true;
    
    try {
        dom.teacher.syncStatus.textContent = "Buscando dados dos alunos...";
        const allStudentsData = await getAllStudentsFromAllClasses();
        
        dom.teacher.syncStatus.textContent = "Buscando dados das turmas...";
        const allClassesData = await getAllClassesFromAllGrades();
        
        dom.teacher.syncStatus.textContent = "Buscando dados das avaliações...";
        const allAssessmentsData = await getAllAssessmentsData();
        
        dom.teacher.syncStatus.textContent = "Buscando submissões existentes...";
        const allSubmissionsData = await getAllSubmissionsForDashboard();
        
        const htmlResponse = await fetch('./index.html');
        if (!htmlResponse.ok) throw new Error('Erro ao carregar template HTML');
        let htmlTemplate = await htmlResponse.text();

        const cssResponse = await fetch('./styles/main.css');
        if (!cssResponse.ok) throw new Error('Erro ao carregar CSS');
        const mainCss = await cssResponse.text();

        dom.teacher.syncStatus.textContent = "Gerando código JavaScript com dados do Supabase...";

        const offlineJS = createEnhancedOfflineSystem({
            students: allStudentsData,
            classes: allClassesData,
            assessments: allAssessmentsData,
            submissions: allSubmissionsData
        });

        htmlTemplate = htmlTemplate.replace(
            '<link rel="stylesheet" href="styles/main.css">',
            `<style>${mainCss}</style>`
        );

        htmlTemplate = htmlTemplate.replace(
            '<script type="module" src="src/main.js"></script>',
            `<script>${offlineJS}</script>`
        );

        htmlTemplate = removeUnnecessaryElementsFixed(htmlTemplate);

        const timestamp = new Date().toLocaleString('pt-BR');
        htmlTemplate = htmlTemplate.replace(
            '<title>Plataforma de Avaliações</title>',
            `<title>Plataforma Híbrida - ${timestamp}</title>`
        );

        const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        const dateStr = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        link.download = `plataforma_hibrida_${dateStr}_${timeStr}.html`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        dom.teacher.syncStatus.textContent = `Arquivo híbrido gerado! ${allStudentsData.length} alunos, ${allClassesData.length} turmas`;
        dom.teacher.syncStatus.style.color = 'green';

    } catch (error) {
        console.error("Erro ao gerar arquivo offline:", error);
        dom.teacher.syncStatus.textContent = `Erro: ${error.message}`;
        dom.teacher.syncStatus.style.color = 'red';
        
    } finally {
        dom.teacher.generateFileBtn.disabled = false;
        setTimeout(() => {
            dom.teacher.syncStatus.textContent = "";
            dom.teacher.syncStatus.style.color = '';
        }, 5000);
    }
}

function removeUnnecessaryElementsFixed(htmlTemplate) {
    console.log('Removendo elementos desnecessários para versão offline...');
    
    let cleanedHtml = htmlTemplate;
    const originalLength = cleanedHtml.length;
    
    // Remove o painel do professor (dashboard)
    const dashboardPattern = /<div id="teacher-dashboard"[^>]*>[\s\S]*?(?=<div id="[^"]*"|<!-- |$)/;
    cleanedHtml = cleanedHtml.replace(dashboardPattern, '');
    
    // Remove a área do professor  
    const teacherAreaPattern = /<div id="teacher-area-screen"[^>]*>[\s\S]*?(?=<div id="[^"]*"|<!-- |$)/;
    cleanedHtml = cleanedHtml.replace(teacherAreaPattern, '');
    
    // Remove link "Acesso do Professor"
    cleanedHtml = cleanedHtml.replace(
        /<div class="text-center mt-6">\s*<a[^>]*id="teacher-login-link"[^>]*>.*?<\/a>\s*<\/div>/gs,
        ''
    );
    
    // Remove referências restantes
    const cleanupPatterns = [
        /<a[^>]*href="#"[^>]*id="teacher-login-link"[^>]*>.*?<\/a>/gs,
        /<!-- ÁREA DO PROFESSOR -->[\s\S]*?<!-- \/ÁREA DO PROFESSOR -->/g,
        /<!-- PAINEL DO PROFESSOR -->[\s\S]*?<!-- \/PAINEL DO PROFESSOR -->/g
    ];
    
    cleanupPatterns.forEach((pattern, index) => {
        const before = cleanedHtml.length;
        cleanedHtml = cleanedHtml.replace(pattern, '');
        const after = cleanedHtml.length;
        
        if (before !== after) {
            console.log(`Padrão ${index + 1} removido (${before - after} bytes)`);
        }
    });
    
    // Limpeza final
    cleanedHtml = cleanedHtml.replace(/<!--[\s\S]*?-->/g, '');
    cleanedHtml = cleanedHtml.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleanedHtml = cleanedHtml.replace(/>\s+</g, '><');
    
    const finalLength = cleanedHtml.length;
    const removedBytes = originalLength - finalLength;
    
    console.log(`Limpeza concluída: ${removedBytes} bytes removidos`);
    
    return cleanedHtml;
}

async function getAllStudentsFromAllClasses() {
    const allStudents = [];
    const grades = [6, 7, 8, 9];
    
    for (const grade of grades) {
        const classes = await getClassesByGrade(grade);
        for (const cls of classes) {
            const students = await getStudentsByClass(cls.id);
            students.forEach(student => {
                allStudents.push({
                    ...student,
                    grade: grade,
                    classId: cls.id,
                    className: cls.name
                });
            });
        }
    }
    
    console.log(`Total de alunos coletados: ${allStudents.length}`);
    return allStudents;
}

async function getAllClassesFromAllGrades() {
    const allClasses = [];
    const grades = [6, 7, 8, 9];
    
    for (const grade of grades) {
        const classes = await getClassesByGrade(grade);
        classes.forEach(cls => {
            allClasses.push({
                ...cls,
                grade: grade
            });
        });
    }
    
    console.log(`Total de turmas coletadas: ${allClasses.length}`);
    return allClasses;
}

async function getAllAssessmentsData() {
    const allAssessments = [];
    const grades = [6, 7, 8, 9];
    
    for (const grade of grades) {
        const assessment = await getAssessmentData(grade);
        if (assessment) {
            allAssessments.push({
                ...assessment,
                grade: grade
            });
        }
    }
    
    console.log(`Total de avaliações coletadas: ${allAssessments.length}`);
    return allAssessments;
}

function createEnhancedOfflineSystem(realData) {
    return `
// SISTEMA HÍBRIDO ONLINE/OFFLINE COM REDE LOCAL E EXPORTAÇÃO
// Gerado automaticamente em ${new Date().toISOString()}

console.log('🚀 SISTEMA HÍBRIDO ATIVO - Online/Offline + Rede Local + Export');

const SUPABASE_STUDENTS_DATA = ${JSON.stringify(realData.students, null, 2)};
const SUPABASE_CLASSES_DATA = ${JSON.stringify(realData.classes, null, 2)};
const SUPABASE_ASSESSMENTS_DATA = ${JSON.stringify(realData.assessments, null, 2)};
const SUPABASE_SUBMISSIONS_DATA = ${JSON.stringify(realData.submissions, null, 2)};

console.log('📊 Dados carregados:', {
    alunos: SUPABASE_STUDENTS_DATA.length,
    turmas: SUPABASE_CLASSES_DATA.length,
    avaliacoes: SUPABASE_ASSESSMENTS_DATA.length,
    submissoes: SUPABASE_SUBMISSIONS_DATA.length
});

// CONFIGURAÇÕES DE REDE LOCAL
const NETWORK_CONFIG = {
    teacherServerIP: null,
    teacherServerPort: 8080,
    autoSendResults: true,
    maxRetries: 3
};

let appState = {
    currentStudent: {},
    currentAssessment: {},
    currentQuestionIndex: 0,
    score: 0,
    answerLog: [],
    questionStartTime: null,
    assessmentStartTime: null,
    isOnline: navigator.onLine,
    networkMode: 'auto'
};

const dom = {
    login: {
        yearSelect: document.getElementById('year-select'),
        classSelect: document.getElementById('class-select'),
        studentSelect: document.getElementById('student-select'),
        startBtn: document.getElementById('start-btn'),
        errorMessage: document.getElementById('error-message-container'),
        adaptationLegend: document.getElementById('adaptation-legend')
    },
    quiz: {
        studentInfoDisplay: document.getElementById('student-info-display'),
        progress: document.getElementById('progress'),
        question: document.getElementById('question'),
        optionsContainer: document.getElementById('options-container'),
        feedback: document.getElementById('feedback'),
        nextBtn: document.getElementById('next-btn'),
        baseTextDesktop: document.getElementById('base-text-desktop'),
        baseTextMobile: document.getElementById('base-text-mobile')
    },
    results: {
        score: document.getElementById('score'),
        decimalScore: document.getElementById('decimal-score'),
        saveStatus: document.getElementById('save-status'),
        backToStartBtn: document.getElementById('back-to-start-btn')
    },
    screens: {
        login: document.getElementById('login-screen'),
        quiz: document.getElementById('quiz-screen'),
        results: document.getElementById('results-screen'),
        dragDrop: document.getElementById('drag-drop-screen')
    },
    teacher: {
        exportBtn: document.getElementById('export-results-btn'),
        importBtn: document.getElementById('import-results-btn'),
        importInput: document.getElementById('import-file-input'),
        syncStatus: document.getElementById('sync-status')
    }
};

// SISTEMA DE DETECÇÃO DE REDE LOCAL
class NetworkDetector {
    constructor() {
        this.teacherServerFound = false;
        this.teacherIP = null;
    }
    
    async detectTeacherServer() {
        const commonIPs = ['192.168.1.1', '192.168.0.1', '10.0.0.1'];
        
        for (const ip of commonIPs) {
            try {
                const response = await fetch(\`http://\${ip}:\${NETWORK_CONFIG.teacherServerPort}/ping\`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(1000)
                });
                
                if (response.ok) {
                    this.teacherIP = ip;
                    this.teacherServerFound = true;
                    console.log(\`✅ Servidor do professor encontrado: \${ip}\`);
                    return true;
                }
            } catch (error) {
                // Continua procurando
            }
        }
        
        console.log('📱 Modo offline - servidor do professor não encontrado');
        return false;
    }
}

const networkDetector = new NetworkDetector();

function showScreen(screenName) {
    Object.values(dom.screens).forEach(screen => {
        if (screen) screen.classList.add('hidden');
    });
    
    document.body.classList.add('flex', 'items-center', 'justify-center');
    
    if (dom.screens[screenName]) {
        dom.screens[screenName].classList.remove('hidden');
    }
}

function populateYears() {
    const availableGrades = [...new Set(SUPABASE_CLASSES_DATA.map(c => c.grade))].sort();
    availableGrades.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = grade + 'º Ano';
        dom.login.yearSelect.appendChild(option);
    });
}

function populateClasses(selectedGrade) {
    dom.login.classSelect.innerHTML = '<option value="">-- Selecione --</option>';
    
    const classesForGrade = SUPABASE_CLASSES_DATA.filter(c => c.grade == selectedGrade);
    classesForGrade.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = 'Turma ' + cls.name;
        dom.login.classSelect.appendChild(option);
    });
    dom.login.classSelect.disabled = false;
}

function populateStudents(selectedClassId) {
    dom.login.studentSelect.innerHTML = '<option value="">-- Selecione --</option>';
    
    const studentsInClass = SUPABASE_STUDENTS_DATA.filter(s => s.classId === selectedClassId);
    const completedStudentIds = new Set(SUPABASE_SUBMISSIONS_DATA.map(sub => sub.student_id));
    
    studentsInClass.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        let name = student.full_name;
        
        if (student.adaptation_details && hasValidAdaptation(student.adaptation_details)) {
            name += ' *';
            option.style.fontWeight = 'bold';
            option.style.color = '#2563eb';
            option.dataset.hasAdaptation = 'true';
        }
        
        if (completedStudentIds.has(student.id)) {
            name += ' (Concluído)';
            option.disabled = true;
            option.style.color = '#94a3b8';
        }
        
        option.textContent = name;
        dom.login.studentSelect.appendChild(option);
    });
    dom.login.studentSelect.disabled = false;
}

function hasValidAdaptation(adaptationDetails) {
    if (!adaptationDetails) return false;
    try {
        const parsed = typeof adaptationDetails === 'string' ? JSON.parse(adaptationDetails) : adaptationDetails;
        return (parsed.diagnosis && parsed.diagnosis.length > 0) || 
               (parsed.suggestions && parsed.suggestions.length > 0) ||
               (parsed.difficulties && parsed.difficulties.length > 0);
    } catch (e) {
        return false;
    }
}

function checkFormCompletion() {
    const isComplete = dom.login.yearSelect.value && dom.login.classSelect.value && dom.login.studentSelect.value;
    dom.login.startBtn.disabled = !isComplete;
    
    if (dom.login.studentSelect.value) {
        const selectedOption = dom.login.studentSelect.options[dom.login.studentSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.hasAdaptation === 'true') {
            dom.login.adaptationLegend.innerHTML = '<p class="text-blue-600">* Aluno com necessidades específicas - Avaliação adaptada será aplicada</p>';
            dom.login.adaptationLegend.classList.remove('hidden');
        } else {
            dom.login.adaptationLegend.classList.add('hidden');
        }
    }
}

function startAssessment() {
    const selectedStudent = SUPABASE_STUDENTS_DATA.find(s => s.id === dom.login.studentSelect.value);
    const selectedGrade = parseInt(dom.login.yearSelect.value);
    const assessment = SUPABASE_ASSESSMENTS_DATA.find(a => a.grade === selectedGrade);
    
    if (!assessment) {
        alert('Avaliação não encontrada para este ano!');
        return;
    }
    
    appState.currentStudent = selectedStudent;
    appState.currentAssessment = assessment;
    appState.assessmentStartTime = Date.now();
    appState.currentQuestionIndex = 0;
    appState.score = 0;
    appState.answerLog = [];
    
    if (selectedStudent.adaptation_details) {
        const adaptationType = determineAdaptationType(selectedStudent.adaptation_details);
        if (adaptationType === 'simplified') {
            startSimplifiedQuiz();
            return;
        } else if (adaptationType === 'motor') {
            startDragDropQuiz();
            return;
        }
    }
    
    startStandardQuiz();
}

function determineAdaptationType(adaptationDetails) {
    try {
        const parsed = typeof adaptationDetails === 'string' ? JSON.parse(adaptationDetails) : adaptationDetails;
        
        if (parsed.diagnosis) {
            const diagnosisStr = parsed.diagnosis.join(' ').toLowerCase();
            if (diagnosisStr.includes('tea') || diagnosisStr.includes('tdah') || diagnosisStr.includes('autis')) {
                return 'simplified';
            }
            if (diagnosisStr.includes('motora') || diagnosisStr.includes('down') || diagnosisStr.includes('deficiência intelectual')) {
                return 'motor';
            }
        }
        
        return 'standard';
    } catch (e) {
        return 'standard';
    }
}

function startStandardQuiz() {
    const networkStatus = appState.isOnline ? '🌐 ONLINE' : '📱 OFFLINE';
    dom.quiz.studentInfoDisplay.innerHTML = '<strong>Aluno:</strong> ' + appState.currentStudent.full_name + ' <span class="text-blue-600">(' + networkStatus + ')</span>';
    loadQuestion();
    showScreen('quiz');
}

function startSimplifiedQuiz() {
    const simplified = appState.currentAssessment.questions.slice(0, Math.min(5, appState.currentAssessment.questions.length)).map(q => {
        const correct = q.options.find(opt => opt.isCorrect);
        const incorrect = q.options.find(opt => !opt.isCorrect);
        return {...q, options: [correct, incorrect].sort(() => Math.random() - 0.5)};
    });
    
    appState.currentAssessment.questions = simplified;
    appState.currentAssessment.title += ' (Adaptada - Simplificada)';
    startStandardQuiz();
}

function startDragDropQuiz() {
    showScreen('dragDrop');
    document.getElementById('drag-drop-instruction').textContent = 'Avaliação de coordenação motora - clique em "Próximo Nível" para simular';
    document.getElementById('drag-drop-next-btn').classList.remove('hidden');
    document.getElementById('drag-drop-next-btn').onclick = () => {
        appState.score = Math.floor(Math.random() * 6) + 3;
        appState.currentAssessment.questions = new Array(8).fill({});
        finishAssessment();
    };
}

function loadQuestion() {
    const question = appState.currentAssessment.questions[appState.currentQuestionIndex];
    appState.questionStartTime = Date.now();
    
    dom.quiz.baseTextDesktop.innerHTML = appState.currentAssessment.baseText || '';
    dom.quiz.baseTextMobile.innerHTML = appState.currentAssessment.baseText || '';
    dom.quiz.progress.textContent = 'Pergunta ' + (appState.currentQuestionIndex + 1) + ' de ' + appState.currentAssessment.questions.length;
    dom.quiz.question.textContent = question.question_text;
    dom.quiz.feedback.textContent = '';
    dom.quiz.nextBtn.classList.add('hidden');
    
    dom.quiz.optionsContainer.innerHTML = '';
    const correctAnswer = question.options.find(opt => opt.isCorrect).text;
    
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.className = 'option-btn';
        button.onclick = () => selectAnswer(button, correctAnswer, question.id);
        dom.quiz.optionsContainer.appendChild(button);
    });
}

function selectAnswer(selectedButton, correctAnswer, questionId) {
    const duration = Math.round((Date.now() - appState.questionStartTime) / 1000);
    const isCorrect = selectedButton.textContent === correctAnswer;
    
    appState.answerLog.push({
        questionId: questionId,
        isCorrect: isCorrect,
        duration: duration,
        questionIndex: appState.currentQuestionIndex
    });
    
    const allOptions = dom.quiz.optionsContainer.querySelectorAll('.option-btn');
    allOptions.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correctAnswer) {
            btn.style.backgroundColor = '#dcfce7';
            btn.style.borderColor = '#22c55e';
        } else if (btn === selectedButton) {
            btn.style.backgroundColor = '#fee2e2';
            btn.style.borderColor = '#ef4444';
        }
    });
    
    if (isCorrect) {
        appState.score++;
        dom.quiz.feedback.textContent = 'Resposta Correta!';
        dom.quiz.feedback.style.color = 'green';
    } else {
        dom.quiz.feedback.textContent = 'Incorreto. A resposta certa era: "' + correctAnswer + '"';
        dom.quiz.feedback.style.color = 'red';
    }
    
    dom.quiz.nextBtn.classList.remove('hidden');
    if (appState.currentQuestionIndex === appState.currentAssessment.questions.length - 1) {
        dom.quiz.nextBtn.textContent = 'Finalizar Avaliação';
    }
}

function nextQuestion() {
    if (appState.currentQuestionIndex === appState.currentAssessment.questions.length - 1) {
        finishAssessment();
    } else {
        appState.currentQuestionIndex++;
        loadQuestion();
    }
}

// FUNÇÃO DE FINALIZAÇÃO COM SISTEMA HÍBRIDO
async function finishAssessment() {
    const totalDuration = Math.round((Date.now() - appState.assessmentStartTime) / 1000);
    const finalScore = (appState.score * 10 / appState.currentAssessment.questions.length);
    
    // DADOS COMPLETOS COM INFORMAÇÕES ESTRUTURADAS
    const enrichedResult = {
        studentId: appState.currentStudent.id,
        studentName: appState.currentStudent.full_name,
        assessmentId: appState.currentAssessment.id,
        assessmentTitle: appState.currentAssessment.title,
        score: appState.score,
        totalQuestions: appState.currentAssessment.questions.length,
        totalDuration: totalDuration,
        answerLog: appState.answerLog,
        timestamp: Date.now(),
        // DADOS CRUCIAIS PARA ORGANIZAÇÃO
        grade: appState.currentStudent.grade,
        className: appState.currentStudent.className,
        metadata: {
            deviceInfo: navigator.userAgent,
            networkMode: appState.networkMode,
            submissionMethod: 'hybrid_system'
        }
    };
    
    // TENTATIVA DE ENVIO PARA REDE LOCAL
    let sendResult = { success: false };
    
    try {
        sendResult = await attemptNetworkSubmission(enrichedResult);
    } catch (error) {
        console.warn('Erro na tentativa de envio para rede local:', error);
    }
    
    if (!sendResult.success) {
        // SALVAMENTO LOCAL + EXPORT AUTOMÁTICO
        saveOfflineWithAutoExport(enrichedResult);
    }
    
    // EXIBIÇÃO DOS RESULTADOS
    dom.results.score.textContent = appState.score + ' / ' + appState.currentAssessment.questions.length;
    dom.results.decimalScore.textContent = finalScore.toFixed(1).replace('.', ',');
    
    // STATUS INTELIGENTE
    if (sendResult.success) {
        dom.results.saveStatus.innerHTML = \`
            <strong class="text-green-600">✅ ENVIADO PARA O PROFESSOR</strong><br>
            <small>Resultado enviado automaticamente via rede local</small>
        \`;
    } else {
        dom.results.saveStatus.innerHTML = \`
            <strong class="text-blue-600">📁 ARQUIVO JSON GERADO</strong><br>
            <small>Download automático: \${appState.currentStudent.full_name.replace(/[^a-zA-Z0-9]/g, '_')}_\${appState.currentStudent.grade}ano_turma\${appState.currentStudent.className}.json</small>
        \`;
    }
    
    showScreen('results');
}

// TENTATIVA DE ENVIO PARA REDE LOCAL
async function attemptNetworkSubmission(result) {
    if (!NETWORK_CONFIG.autoSendResults) {
        return { success: false, reason: 'auto_send_disabled' };
    }
    
    if (!networkDetector.teacherServerFound) {
        const found = await networkDetector.detectTeacherServer();
        if (!found) {
            return { success: false, reason: 'teacher_server_not_found' };
        }
    }
    
    // ENVIO COM RETRY
    for (let attempt = 1; attempt <= NETWORK_CONFIG.maxRetries; attempt++) {
        try {
            const response = await fetch(\`http://\${networkDetector.teacherIP}:\${NETWORK_CONFIG.teacherServerPort