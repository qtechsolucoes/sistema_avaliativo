// src/services/mockDataService.js - Dados mock centralizados
export const mockDataService = {
    getClassesByGrade(grade) {
        return [
            { id: `mock-${grade}-A`, name: 'A' },
            { id: `mock-${grade}-B`, name: 'B' }
        ];
    },
    
    getStudentsByClass(classId) {
        const mockStudents = [
            { 
                id: `student-1-${classId}`, 
                full_name: 'Ana Silva',
                adaptation_details: null
            },
            { 
                id: `student-2-${classId}`, 
                full_name: 'João Santos',
                adaptation_details: {
                    diagnosis: ["TDAH"],
                    suggestions: ["Textos curtos", "Poucas alternativas"],
                    difficulties: ["Concentração"]
                }
            },
            {
                id: `student-3-${classId}`,
                full_name: 'Maria Costa',
                adaptation_details: {
                    diagnosis: ["TEA"],
                    suggestions: ["Atividades visuais", "Rotina estruturada"],
                    difficulties: ["Comunicação", "Interação social"]
                }
            }
        ];
        return mockStudents;
    },
    
    getAssessmentData(grade, discipline = 'Artes') {
        return {
            id: `mock-assessment-${grade}`,
            title: `Avaliação de ${discipline} - ${grade}º Ano`,
            baseText: `Texto base para ${discipline} do ${grade}º ano.`,
            questions: this.generateMockQuestions(grade)
        };
    },
    
    generateMockQuestions(grade) {
        const questions = [];
        for (let i = 1; i <= 5; i++) {
            questions.push({
                id: `mock-q${i}-${grade}`,
                question_text: `Questão ${i} para o ${grade}º ano`,
                options: [
                    { text: `Opção A (correta)`, isCorrect: true },
                    { text: `Opção B`, isCorrect: false },
                    { text: `Opção C`, isCorrect: false },
                    { text: `Opção D`, isCorrect: false }
                ]
            });
        }
        return questions;
    }
};