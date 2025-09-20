// src/teacher/dashboard/dashboardCharts.js - Renderização de gráficos
import { DashboardData } from './dashboardData.js';

export class DashboardCharts {
    constructor() {
        this.charts = {};
        this.dataProcessor = new DashboardData();
    }

    renderAll(results) {
        this.renderScoreDistribution(results);
        this.renderQuestionDifficulty(results);
        this.renderTimePerQuestion(results);
    }

    renderScoreDistribution(results) {
        const canvas = document.getElementById('score-distribution-chart');
        if (!canvas) return;

        const data = this.prepareScoreDistributionData(results);
        this.createChart(canvas, 'pie', data, {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        });
    }

    async renderQuestionDifficulty(results) {
        const canvas = document.getElementById('question-difficulty-chart');
        if (!canvas) return;

        const stats = await this.dataProcessor.getQuestionStatistics(results);
        const data = this.prepareQuestionDifficultyData(stats);
        
        this.createChart(canvas, 'bar', data, {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            }
        });
    }

    async renderTimePerQuestion(results) {
        const canvas = document.getElementById('time-per-question-chart');
        if (!canvas) return;

        const stats = await this.dataProcessor.getQuestionStatistics(results);
        const data = this.prepareTimeData(stats);
        
        this.createChart(canvas, 'bar', data, {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Segundos'
                    }
                }
            }
        });
    }

    prepareScoreDistributionData(results) {
        const ranges = { baixo: 0, medio: 0, alto: 0 };
        
        results.forEach(r => {
            const score = (r.score * 10 / r.total_questions);
            if (score <= 4.9) ranges.baixo++;
            else if (score <= 7.9) ranges.medio++;
            else ranges.alto++;
        });
        
        return {
            labels: ['0-4.9 (Baixo)', '5-7.9 (Médio)', '8-10 (Alto)'],
            datasets: [{
                data: [ranges.baixo, ranges.medio, ranges.alto],
                backgroundColor: [
                    'rgba(248, 113, 113, 0.8)',
                    'rgba(250, 204, 21, 0.8)',
                    'rgba(74, 222, 128, 0.8)'
                ]
            }]
        };
    }

    prepareQuestionDifficultyData(stats) {
        const questions = Object.values(stats);
        const labels = questions.map((q, i) => `Q${i + 1}`);
        
        return {
            labels,
            datasets: [
                {
                    label: 'Acertos',
                    data: questions.map(q => q.correct),
                    backgroundColor: 'rgba(74, 222, 128, 0.8)'
                },
                {
                    label: 'Erros',
                    data: questions.map(q => q.incorrect),
                    backgroundColor: 'rgba(248, 113, 113, 0.8)'
                }
            ]
        };
    }

    prepareTimeData(stats) {
        const questions = Object.values(stats);
        const labels = questions.map((q, i) => `Q${i + 1}`);
        
        return {
            labels,
            datasets: [{
                label: 'Tempo Médio (segundos)',
                data: questions.map(q => 
                    q.count > 0 ? (q.totalTime / q.count).toFixed(1) : 0
                ),
                backgroundColor: 'rgba(96, 165, 250, 0.8)'
            }]
        };
    }

    createChart(canvas, type, data, options) {
        // Destrói gráfico anterior se existir
        if (this.charts[canvas.id]) {
            this.charts[canvas.id].destroy();
        }
        
        this.charts[canvas.id] = new Chart(canvas.getContext('2d'), {
            type,
            data,
            options
        });
    }

    destroy() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
    }
}