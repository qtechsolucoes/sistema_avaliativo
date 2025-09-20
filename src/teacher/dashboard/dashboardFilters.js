// src/teacher/dashboard/dashboardFilters.js - Filtros do dashboard
import { dom, state, updateState } from '../../state.js';

export class DashboardFilters {
    constructor(dashboardManager) {
        this.dashboardManager = dashboardManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (dom.dashboard.yearFilter) {
            dom.dashboard.yearFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        if (dom.dashboard.classFilter) {
            dom.dashboard.classFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
    }

    setup(results) {
        updateState({ allResultsData: results });
        this.populateFilters(results);
    }

    populateFilters
}