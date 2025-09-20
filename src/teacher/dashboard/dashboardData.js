// src/teacher/dashboard/dashboardData.js - Lógica de dados do dashboard
import { 
    getAllSubmissionsForDashboard, 
    getSubmissionAnswers 
} from '../../database.js';

export class DashboardData {
    constructor() {
        this.cache = new Map();
    }

    async loadAllResults() {
        const results = await getAllSubmissionsForDashboard();
        
        if (!Array.isArray(results)) {
            throw new Error('Dados inválidos retornados do banco');
        }
        
        return results;
    }

    async loadAnswersForSubmission(submissionId) {
        // Verifica cache
        if (this.cache.has(submissionId)) {
            return this.cache.get(submissionId);
        }
        
        const answers = await getSubmissionAnswers(submissionId);
        this.cache.set(submissionId, answers);
        
        return answers;
    }

    calculateStats(results) {
        if (!results || results.length === 0) {
            return {
                totalAssessments: 0,
                uniqueStudents: 0,
                averageScore: 0
            };
        }

        const uniqueStudents = new Set(results.map(r => r.student_id));
        
        const totalScore = results.reduce((sum, r) => {
            const percentage = (r.score / r.total_questions) * 100;
            return sum + percentage;
        }, 0);
        
        return {
            totalAssessments: results.length,
            uniqueStudents: uniqueStudents.size,
            averageScore: totalScore / results.length
        };
    }

    filterResults(results, yearFilter, classFilter) {
        let filtered = [...results];
        
        // Filtro por ano
        if (yearFilter && yearFilter !== 'all' && yearFilter !== 'compare_years') {
            filtered = filtered.filter(result => {
                const year = this.extractYear(result);
                return year === parseInt(yearFilter);
            });
        }
        
        // Filtro por turma
        if (classFilter && classFilter !== 'all' && classFilter !== 'compare_classes') {
            filtered = filtered.filter(result => 
                result.student_class === classFilter
            );
        }
        
        return filtered;
    }

    extractYear(result) {
        if (result.student_grade) {
            return parseInt(result.student_grade);
        }
        
        const match = result.assessments?.title?.match(/(\d+)º Ano/);
        return match ? parseInt(match[1]) : 0;
    }

    groupByYear(results) {
        const groups = {};
        
        results.forEach(result => {
            const year = this.extractYear(result);
            if (!groups[year]) {
                groups[year] = [];
            }
            groups[year].push(result);
        });
        
        return groups;
    }

    groupByClass(results) {
        const groups = {};
        
        results.forEach(result => {
            const className = result.student_class || 'Sem Turma';
            if (!groups[className]) {
                groups[className] = [];
            }
            groups[className].push(result);
        });
        
        return groups;
    }

    async getQuestionStatistics(results) {
        const questionStats = {};
        
        for (const result of results) {
            const answers = await this.loadAnswersForSubmission(result.id);
            
            answers.forEach(answer => {
                const qId = answer.question_id;
                
                if (!questionStats[qId]) {
                    questionStats[qId] = {
                        text: answer.questions?.question_text || `Questão ${qId}`,
                        correct: 0,
                        incorrect: 0,
                        totalTime: 0,
                        count: 0
                    };
                }
                
                if (answer.is_correct) {
                    questionStats[qId].correct++;
                } else {
                    questionStats[qId].incorrect++;
                }
                
                questionStats[qId].totalTime += answer.duration_seconds || 0;
                questionStats[qId].count++;
            });
        }
        
        return questionStats;
    }
}