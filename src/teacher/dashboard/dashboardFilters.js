// src/teacher/dashboard/dashboardFilters.js - Sistema de filtros do dashboard
import { dom, state, updateState } from '../../state.js';
import { logService } from '../../services/logService.js';

export class DashboardFilters {
    constructor(dashboardManager) {
        this.dashboardManager = dashboardManager;
        this.lastYearFilter = null;
        this.lastClassFilter = null;
        this.classesMap = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (dom.dashboard.yearFilter) {
            dom.dashboard.yearFilter.addEventListener('change', () => {
                this.handleYearChange();
            });
        }

        if (dom.dashboard.classFilter) {
            dom.dashboard.classFilter.addEventListener('change', () => {
                this.handleClassChange();
            });
        }
    }

    setup(results) {
        updateState({ allResultsData: results });
        this.buildClassesMap(results);
        this.populateFilters(results);
    }

    buildClassesMap(results) {
        this.classesMap.clear();
        
        results.forEach(result => {
            const year = this.extractYear(result);
            const className = result.student_class || 'Sem Turma';
            
            if (!this.classesMap.has(year)) {
                this.classesMap.set(year, new Set());
            }
            this.classesMap.get(year).add(className);
        });
        
        logService.debug('Mapa de turmas construído', {
            years: Array.from(this.classesMap.keys())
        });
    }

    populateFilters(results) {
        this.populateYearFilter(results);
        this.populateClassFilter(results);
    }

    populateYearFilter(results) {
        const yearFilter = dom.dashboard.yearFilter;
        if (!yearFilter) return;

        // Salva seleção atual
        const currentSelection = yearFilter.value;
        
        yearFilter.innerHTML = '<option value="all">Todos os Anos</option>';
        
        const years = this.extractUniqueYears(results);
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}º Ano`;
            yearFilter.appendChild(option);
        });
        
        // Adiciona opção de comparação se houver múltiplos anos
        if (years.length > 1) {
            const divider = document.createElement('option');
            divider.disabled = true;
            divider.textContent = '──────────';
            yearFilter.appendChild(divider);
            
            const compareOption = document.createElement('option');
            compareOption.value = 'compare_years';
            compareOption.textContent = '📊 Comparar Todos os Anos';
            compareOption.style.fontWeight = 'bold';
            yearFilter.appendChild(compareOption);
        }
        
        // Restaura seleção se ainda existir
        if (currentSelection && this.optionExists(yearFilter, currentSelection)) {
            yearFilter.value = currentSelection;
        }
    }

    populateClassFilter(results) {
        const classFilter = dom.dashboard.classFilter;
        if (!classFilter) return;

        const selectedYear = dom.dashboard.yearFilter?.value || 'all';
        const currentSelection = classFilter.value;
        
        classFilter.innerHTML = '<option value="all">Todas as Turmas</option>';
        
        const classes = this.extractClassesForYear(selectedYear);
        
        classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = `Turma ${className}`;
            classFilter.appendChild(option);
        });
        
        // Adiciona opção de comparação se houver múltiplas turmas
        if (classes.length > 1) {
            const divider = document.createElement('option');
            divider.disabled = true;
            divider.textContent = '──────────';
            classFilter.appendChild(divider);
            
            const compareOption = document.createElement('option');
            compareOption.value = 'compare_classes';
            
            if (selectedYear !== 'all' && selectedYear !== 'compare_years') {
                compareOption.textContent = `📊 Comparar Turmas do ${selectedYear}º Ano`;
            } else {
                compareOption.textContent = '📊 Comparar Todas as Turmas';
            }
            
            compareOption.style.fontWeight = 'bold';
            classFilter.appendChild(compareOption);
        }
        
        // Restaura seleção se ainda existir
        if (currentSelection && this.optionExists(classFilter, currentSelection)) {
            classFilter.value = currentSelection;
        }
    }

    extractUniqueYears(results) {
        const yearsSet = new Set();
        
        results.forEach(result => {
            const year = this.extractYear(result);
            if (year > 0) {
                yearsSet.add(year.toString());
            }
        });
        
        return Array.from(yearsSet).sort((a, b) => parseInt(a) - parseInt(b));
    }

    extractYear(result) {
        // Primeiro tenta pegar do campo direto
        if (result.student_grade) {
            return parseInt(result.student_grade);
        }
        
        // Senão, extrai do título da avaliação
        if (result.assessments?.title) {
            const match = result.assessments.title.match(/(\d+)º\s*Ano/i);
            if (match) {
                return parseInt(match[1]);
            }
        }
        
        return 0;
    }

    extractClassesForYear(yearFilter) {
        const classesSet = new Set();
        
        if (yearFilter === 'all' || yearFilter === 'compare_years') {
            // Retorna todas as turmas de todos os anos
            this.classesMap.forEach(classes => {
                classes.forEach(className => classesSet.add(className));
            });
        } else {
            // Retorna turmas do ano específico
            const yearInt = parseInt(yearFilter);
            if (this.classesMap.has(yearInt)) {
                this.classesMap.get(yearInt).forEach(className => classesSet.add(className));
            }
        }
        
        // Remove 'Sem Turma' e ordena
        classesSet.delete('Sem Turma');
        const sortedClasses = Array.from(classesSet).sort();
        
        // Adiciona 'Sem Turma' no final se existir
        if (this.hasStudentsWithoutClass(yearFilter)) {
            sortedClasses.push('Sem Turma');
        }
        
        return sortedClasses;
    }

    hasStudentsWithoutClass(yearFilter) {
        const results = state.allResultsData || [];
        
        return results.some(result => {
            const year = this.extractYear(result);
            const hasNoClass = !result.student_class || result.student_class === 'Sem Turma';
            
            if (yearFilter === 'all' || yearFilter === 'compare_years') {
                return hasNoClass;
            } else {
                return hasNoClass && year === parseInt(yearFilter);
            }
        });
    }

    async handleYearChange() {
        const yearFilter = dom.dashboard.yearFilter?.value;

        logService.debug('Filtro de ano alterado', { year: yearFilter });

        // Atualiza as opções de turma baseado no ano selecionado
        this.populateClassFilter(state.allResultsData || []);

        // Aplica os filtros
        await this.applyFilters();

        this.lastYearFilter = yearFilter;
    }

    async handleClassChange() {
        const classFilter = dom.dashboard.classFilter?.value;

        logService.debug('Filtro de turma alterado', { class: classFilter });

        await this.applyFilters();

        this.lastClassFilter = classFilter;
    }

    async applyFilters() {
        const yearFilter = dom.dashboard.yearFilter?.value || 'all';
        const classFilter = dom.dashboard.classFilter?.value || 'all';

        // Determina o tipo de visualização
        if (yearFilter === 'compare_years') {
            await this.dashboardManager.showYearComparison();
        } else if (classFilter === 'compare_classes') {
            await this.dashboardManager.showClassComparison(yearFilter);
        } else {
            // Filtro normal
            await this.dashboardManager.applyFilters(yearFilter, classFilter);
        }

        // Salva preferências do usuário
        this.saveFilterPreferences(yearFilter, classFilter);
    }

    saveFilterPreferences(yearFilter, classFilter) {
        const preferences = {
            yearFilter,
            classFilter,
            timestamp: Date.now()
        };
        
        localStorage.setItem('dashboardFilters', JSON.stringify(preferences));
    }

    loadFilterPreferences() {
        try {
            const saved = localStorage.getItem('dashboardFilters');
            if (!saved) return null;
            
            const preferences = JSON.parse(saved);
            
            // Verifica se as preferências são recentes (menos de 24 horas)
            if (Date.now() - preferences.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('dashboardFilters');
                return null;
            }
            
            return preferences;
            
        } catch (error) {
            logService.warn('Erro ao carregar preferências de filtros', error);
            return null;
        }
    }

    async restoreFilterPreferences() {
        const preferences = this.loadFilterPreferences();
        if (!preferences) return;

        const yearFilter = dom.dashboard.yearFilter;
        const classFilter = dom.dashboard.classFilter;

        if (yearFilter && this.optionExists(yearFilter, preferences.yearFilter)) {
            yearFilter.value = preferences.yearFilter;
            await this.handleYearChange();
        }

        if (classFilter && this.optionExists(classFilter, preferences.classFilter)) {
            classFilter.value = preferences.classFilter;
            await this.handleClassChange();
        }

        logService.debug('Preferências de filtros restauradas', preferences);
    }

    optionExists(selectElement, value) {
        return Array.from(selectElement.options).some(option => option.value === value);
    }

    async reset() {
        const yearFilter = dom.dashboard.yearFilter;
        const classFilter = dom.dashboard.classFilter;

        if (yearFilter) {
            yearFilter.value = 'all';
        }

        if (classFilter) {
            classFilter.value = 'all';
        }

        this.lastYearFilter = null;
        this.lastClassFilter = null;

        localStorage.removeItem('dashboardFilters');

        await this.applyFilters();

        logService.debug('Filtros resetados');
    }

    getActiveFilters() {
        return {
            year: dom.dashboard.yearFilter?.value || 'all',
            class: dom.dashboard.classFilter?.value || 'all'
        };
    }

    getFilterSummary() {
        const filters = this.getActiveFilters();
        const parts = [];
        
        if (filters.year !== 'all' && filters.year !== 'compare_years') {
            parts.push(`${filters.year}º Ano`);
        }
        
        if (filters.class !== 'all' && filters.class !== 'compare_classes') {
            parts.push(`Turma ${filters.class}`);
        }
        
        if (parts.length === 0) {
            return 'Todos os resultados';
        }
        
        return parts.join(' - ');
    }

    exportFilterState() {
        return {
            activeFilters: this.getActiveFilters(),
            classesMap: Object.fromEntries(
                Array.from(this.classesMap.entries()).map(([year, classes]) => [
                    year,
                    Array.from(classes)
                ])
            ),
            lastYearFilter: this.lastYearFilter,
            lastClassFilter: this.lastClassFilter
        };
    }

    async importFilterState(state) {
        if (!state) return;

        // Restaura mapa de turmas
        if (state.classesMap) {
            this.classesMap.clear();
            Object.entries(state.classesMap).forEach(([year, classes]) => {
                this.classesMap.set(parseInt(year), new Set(classes));
            });
        }

        // Restaura últimos filtros
        this.lastYearFilter = state.lastYearFilter;
        this.lastClassFilter = state.lastClassFilter;

        // Aplica filtros ativos
        if (state.activeFilters) {
            const yearFilter = dom.dashboard.yearFilter;
            const classFilter = dom.dashboard.classFilter;

            if (yearFilter && state.activeFilters.year) {
                yearFilter.value = state.activeFilters.year;
            }

            if (classFilter && state.activeFilters.class) {
                classFilter.value = state.activeFilters.class;
            }

            await this.applyFilters();
        }

        logService.debug('Estado dos filtros importado', state);
    }

    destroy() {
        // Remove event listeners se necessário
        this.classesMap.clear();
        this.lastYearFilter = null;
        this.lastClassFilter = null;
    }
}