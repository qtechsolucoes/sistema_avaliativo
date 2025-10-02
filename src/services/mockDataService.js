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
                name: 'Ana Silva',
                full_name: 'Ana Silva',
                adaptation_details: null
            },
            {
                id: `student-2-${classId}`,
                name: 'João Santos',
                full_name: 'João Santos',
                adaptation_details: {
                    diagnosis: ["TDAH"],
                    suggestions: ["Textos curtos", "Poucas alternativas"],
                    difficulties: ["Concentração"]
                }
            },
            {
                id: `student-3-${classId}`,
                name: 'Maria Costa',
                full_name: 'Maria Costa',
                adaptation_details: {
                    diagnosis: ["TEA"],
                    suggestions: ["Atividades visuais", "Rotina estruturada"],
                    difficulties: ["Comunicação", "Interação social"]
                }
            }
        ];
        console.log('🧪 MOCK DATA: Retornando estudantes de teste:', mockStudents);
        return mockStudents;
    },
    
    getAssessmentData(grade, discipline = 'Artes') {
        // Gera questões e seleciona 10 aleatórias (simula comportamento real)
        const allQuestions = this.generateMockQuestions(grade);
        const selectedQuestions = this.selectRandomQuestions(allQuestions, 10);

        return {
            id: `mock-assessment-${grade}`,
            title: `Avaliação de ${discipline} - ${grade}º Ano`,
            baseText: `Texto base para ${discipline} do ${grade}º ano.`,
            questions: selectedQuestions
        };
    },

    generateMockQuestions(grade) {
        const questions = [];
        // Gera 15 questões para ter um pool maior
        for (let i = 1; i <= 15; i++) {
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
    },

    /**
     * Seleciona N questões aleatórias
     * @param {Array} questions - Array de questões
     * @param {number} count - Número de questões a selecionar
     * @returns {Array} - Questões selecionadas
     */
    selectRandomQuestions(questions, count) {
        if (questions.length <= count) {
            return [...questions];
        }

        // Fisher-Yates shuffle
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled.slice(0, count);
    },

    saveSubmission(submissionData) {
        // Migra submissões antigas se necessário
        this.migrateOldSubmissions();

        // Salva localmente como fallback
        const timestamp = new Date().toISOString();
        const submission = {
            ...submissionData,
            localTimestamp: timestamp,
            isLocal: true
        };

        // Salva no localStorage
        try {
            // Salva tanto em 'pending_results' (para exportação) quanto em 'localSubmissions' (backup)
            const existingSubmissions = JSON.parse(localStorage.getItem('localSubmissions') || '[]');
            const pendingResults = JSON.parse(localStorage.getItem('pending_results') || '[]');

            existingSubmissions.push(submission);
            pendingResults.push(submission);

            localStorage.setItem('localSubmissions', JSON.stringify(existingSubmissions));
            localStorage.setItem('pending_results', JSON.stringify(pendingResults));

            console.log('📁 Submissão salva localmente:', submission);
            console.log('📊 Total de submissões pendentes:', pendingResults.length);
            return { success: true, synced: false, isLocal: true };
        } catch (error) {
            console.error('Erro ao salvar submissão localmente:', error);
            return { success: false, error: error.message };
        }
    },

    migrateOldSubmissions() {
        try {
            const oldSubmissions = JSON.parse(localStorage.getItem('localSubmissions') || '[]');
            const pendingResults = JSON.parse(localStorage.getItem('pending_results') || '[]');

            // Se há submissões antigas que não estão em pending_results
            if (oldSubmissions.length > 0 && pendingResults.length === 0) {
                console.log('🔄 Migrando submissões antigas para exportação...');
                localStorage.setItem('pending_results', JSON.stringify(oldSubmissions));
                console.log(`✅ ${oldSubmissions.length} submissões migradas`);
            }
        } catch (error) {
            console.warn('Erro ao migrar submissões antigas:', error);
        }
    }
};