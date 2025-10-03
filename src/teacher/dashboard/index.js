// src/teacher/dashboard/index.js - Gerenciador principal do dashboard
import { DashboardData } from './dashboardData.js';
import { DashboardCharts } from './dashboardCharts.js';
import { DashboardFilters } from './dashboardFilters.js';
import { DashboardTable } from './dashboardTable.js';
import { showScreen } from '../../navigation.js';
import { dom } from '../../state.js';
import { logService } from '../../services/logService.js';

export class DashboardManager {
    constructor() {
        this.data = new DashboardData();
        this.charts = new DashboardCharts();
        this.filters = new DashboardFilters(this);
        this.table = new DashboardTable();
        this.currentResults = [];
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (dom.dashboard.backToAreaBtn) {
            dom.dashboard.backToAreaBtn.addEventListener('click', () => {
                showScreen('teacherArea');
            });
        }
    }

    async show() {
        try {
            // Mostra modal de carregamento
            this.showLoadingModal();
            this.updateLoadingProgress(10, 'Conectando ao banco de dados...');

            this.showLoadingState();
            this.updateLoadingProgress(20, 'Buscando submissões...');

            const results = await this.data.loadAllResults();
            this.updateLoadingProgress(60, 'Processando dados...');

            this.currentResults = results;

            this.filters.setup(results);
            this.updateLoadingProgress(80, 'Preparando gráficos e tabelas...');

            await this.update(results);

            this.updateLoadingProgress(100, 'Finalizado!');

            // Aguarda um pouco para mostrar 100% antes de fechar
            await new Promise(resolve => setTimeout(resolve, 500));

            this.hideLoadingModal();
            showScreen('teacherDashboard');

            logService.info('Dashboard carregado', {
                totalResults: results.length
            });

        } catch (error) {
            this.hideLoadingModal();
            this.showErrorState(error);
            logService.error('Erro ao carregar dashboard', error);
        }
    }

    async update(results) {
        // Atualiza estatísticas
        this.updateStats(results);

        // Renderiza gráficos
        await this.charts.renderAll(results);

        // Atualiza tabela
        this.table.render(results);
    }

    updateStats(results) {
        const stats = this.data.calculateStats(results);
        
        dom.dashboard.totalAssessments.textContent = stats.totalAssessments;
        dom.dashboard.totalStudents.textContent = stats.uniqueStudents;
        dom.dashboard.avgScore.textContent = `${stats.averageScore.toFixed(1)}%`;
    }

    async applyFilters(yearFilter, classFilter) {
        const filtered = this.data.filterResults(
            this.currentResults,
            yearFilter,
            classFilter
        );

        await this.update(filtered);

        logService.debug('Filtros aplicados', {
            year: yearFilter,
            class: classFilter,
            results: filtered.length
        });
    }

    async showYearComparison() {
        // Implementação temporária - funcionalidade de comparação de anos
        logService.info('Comparação de anos solicitada - usando filtro normal como fallback');
        await this.applyFilters('all', 'all');
    }

    async showClassComparison(yearFilter) {
        // Implementação temporária - funcionalidade de comparação de classes
        logService.info('Comparação de classes solicitada - usando filtro normal como fallback', { year: yearFilter });
        await this.applyFilters(yearFilter, 'all');
    }

    showLoadingModal() {
        if (dom.dashboard.loadingModal) {
            dom.dashboard.loadingModal.classList.remove('hidden');
            dom.dashboard.loadingModal.classList.add('flex');
        }
    }

    hideLoadingModal() {
        if (dom.dashboard.loadingModal) {
            dom.dashboard.loadingModal.classList.add('hidden');
            dom.dashboard.loadingModal.classList.remove('flex');
        }
    }

    updateLoadingProgress(percentage, message) {
        if (dom.dashboard.loadingProgress) {
            dom.dashboard.loadingProgress.textContent = `${percentage}%`;
        }
        if (dom.dashboard.loadingBar) {
            dom.dashboard.loadingBar.style.width = `${percentage}%`;
        }
        if (dom.dashboard.loadingMessage && message) {
            dom.dashboard.loadingMessage.textContent = message;
        }
    }

    showLoadingState() {
        if (dom.dashboard.tableBody) {
            dom.dashboard.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-4 text-center">
                        <div class="inline-flex items-center">
                            <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10"
                                    stroke="currentColor" stroke-width="4" fill="none"/>
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Carregando dados...
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    showErrorState(error) {
        if (dom.dashboard.tableBody) {
            dom.dashboard.tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-4 text-center text-red-600">
                        <p>Erro ao carregar dados: ${error.message}</p>
                        <button class="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
                                onclick="location.reload()">
                            Recarregar
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}