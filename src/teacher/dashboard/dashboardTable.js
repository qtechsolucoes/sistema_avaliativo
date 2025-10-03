// src/teacher/dashboard/dashboardTable.js - Renderização da tabela
import { dom } from '../../state.js';

export class DashboardTable {
    constructor() {
        this.sortField = 'score';
        this.sortDirection = 'desc';
        this.setupSortListeners();
    }

    setupSortListeners() {
        // Adiciona listeners de ordenação aos headers da tabela
        const table = document.querySelector('#results-table-body')?.closest('table');
        if (!table) return;

        const headers = table.querySelectorAll('thead th');
        headers.forEach((header, index) => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.handleSort(index);
            });
        });
    }

    render(results, sortMode = 'score') {
        const tbody = dom.dashboard.tableBody;
        if (!tbody) return;

        tbody.innerHTML = '';

        if (results.length === 0) {
            this.showEmptyState();
            return;
        }

        const sortedResults = this.sortResults(results, sortMode);

        sortedResults.forEach(result => {
            const row = this.createResultRow(result);
            tbody.appendChild(row);
        });

        this.updateTableHeaders();
    }

    createResultRow(result) {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-slate-50 transition-colors';
        
        const data = this.extractRowData(result);
        
        row.innerHTML = `
            <td class="p-3">
                <div class="font-medium">${data.studentName}</div>
                ${data.hasAdaptation ? '<span class="text-xs text-blue-600">Adaptada</span>' : ''}
            </td>
            <td class="p-3 text-center">
                <span class="px-2 py-1 bg-slate-100 rounded text-sm font-medium">
                    ${data.year}º
                </span>
            </td>
            <td class="p-3 text-center">
                <span class="px-2 py-1 bg-blue-50 rounded text-sm font-medium">
                    ${data.className}
                </span>
            </td>
            <td class="p-3">
                <div class="flex items-center gap-2">
                    <div class="text-lg font-bold ${data.scoreColor}">
                        ${data.decimalScore}
                    </div>
                    <div class="text-sm text-gray-500">
                        (${data.score}/${data.totalQuestions})
                    </div>
                </div>
                ${this.createScoreBar(data.percentage)}
            </td>
            <td class="p-3 text-center text-sm">
                ${data.duration}
            </td>
            <td class="p-3 text-sm text-gray-600">
                <div>${data.date}</div>
                <div class="text-xs">${data.time}</div>
            </td>
        `;
        
        return row;
    }

    extractRowData(result) {
        const year = this.extractYear(result);
        const className = result.student_class || 'N/A';
        const percentage = (result.score / result.total_questions) * 100;
        const decimalScore = (result.score * 10 / result.total_questions).toFixed(1).replace('.', ',');
        
        const submittedDate = new Date(result.submitted_at);
        const date = submittedDate.toLocaleDateString('pt-BR');
        const time = submittedDate.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const duration = result.total_duration_seconds ? 
            this.formatDuration(result.total_duration_seconds) : 'N/A';
        
        return {
            studentName: result.student_name || 'Desconhecido',
            hasAdaptation: false, // Pode ser verificado nos dados do aluno
            year,
            className,
            score: result.score,
            totalQuestions: result.total_questions,
            decimalScore,
            percentage,
            scoreColor: this.getScoreColor(percentage),
            duration,
            date,
            time
        };
    }

    createScoreBar(percentage) {
        const color = percentage >= 80 ? 'bg-green-500' : 
                     percentage >= 60 ? 'bg-yellow-500' : 
                     'bg-red-500';
        
        return `
            <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div class="${color} h-2 rounded-full transition-all duration-300" 
                     style="width: ${percentage}%"></div>
            </div>
        `;
    }

    sortResults(results, sortMode) {
        const sorted = [...results];
        
        switch (sortMode) {
            case 'year':
                sorted.sort((a, b) => {
                    const yearA = this.extractYear(a);
                    const yearB = this.extractYear(b);
                    return yearA - yearB;
                });
                break;
                
            case 'score':
                sorted.sort((a, b) => {
                    const scoreA = a.score / a.total_questions;
                    const scoreB = b.score / b.total_questions;

                    // Primeiro compara por nota (maior para menor)
                    if (scoreB !== scoreA) {
                        return scoreB - scoreA;
                    }

                    // Se notas forem iguais, desempata por tempo (menor para maior)
                    const timeA = a.total_duration_seconds || 999999;
                    const timeB = b.total_duration_seconds || 999999;
                    return timeA - timeB;
                });
                break;
                
            case 'name':
                sorted.sort((a, b) =>
                    (a.student_name || '').localeCompare(b.student_name || '')
                );
                break;
                
            case 'date':
            default:
                sorted.sort((a, b) => 
                    new Date(b.submitted_at) - new Date(a.submitted_at)
                );
                break;
        }
        
        return sorted;
    }

    extractYear(result) {
        if (result.student_grade) {
            return parseInt(result.student_grade);
        }
        
        const match = result.assessments?.title?.match(/(\d+)º Ano/);
        return match ? parseInt(match[1]) : 0;
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        if (minutes > 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
        
        return `${minutes}m ${secs}s`;
    }

    getScoreColor(percentage) {
        if (percentage >= 80) return 'text-green-700';
        if (percentage >= 60) return 'text-yellow-700';
        return 'text-red-700';
    }

    updateTableHeaders() {
        const table = document.querySelector('#results-table-body')?.closest('table');
        if (!table) return;

        const thead = table.querySelector('thead tr');
        if (!thead || thead.dataset.enhanced) return;

        thead.innerHTML = `
            <th class="p-3 font-semibold text-left hover:bg-gray-50">
                <div class="flex items-center gap-1">
                    Aluno
                    <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 12l5-5 5 5H5z"/>
                    </svg>
                </div>
            </th>
            <th class="p-3 font-semibold text-center hover:bg-gray-50">Ano</th>
            <th class="p-3 font-semibold text-center hover:bg-gray-50">Turma</th>
            <th class="p-3 font-semibold hover:bg-gray-50">
                <div class="flex items-center gap-1">
                    Nota
                    <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 12l5-5 5 5H5z"/>
                    </svg>
                </div>
            </th>
            <th class="p-3 font-semibold text-center hover:bg-gray-50">Duração</th>
            <th class="p-3 font-semibold hover:bg-gray-50">
                <div class="flex items-center gap-1">
                    Data
                    <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 12l5-5 5 5H5z"/>
                    </svg>
                </div>
            </th>
        `;
        
        thead.dataset.enhanced = 'true';
    }

    showEmptyState() {
        dom.dashboard.tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center">
                    <div class="flex flex-col items-center">
                        <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" 
                             stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" 
                                  stroke-width="2" 
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <p class="text-gray-500 text-lg">Nenhum resultado encontrado</p>
                        <p class="text-gray-400 text-sm mt-1">
                            Ajuste os filtros ou aguarde submissões dos alunos
                        </p>
                    </div>
                </td>
            </tr>
        `;
    }

    handleSort(columnIndex) {
        const sortFields = ['name', 'year', 'class', 'score', 'duration', 'date'];
        const newSortField = sortFields[columnIndex];
        
        if (newSortField === this.sortField) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = newSortField;
            this.sortDirection = 'asc';
        }
        
        // Re-renderiza com nova ordenação
        const results = state.allResultsData || [];
        this.render(results, this.sortField);
    }
}