// src/utils/validators.js - Validadores centralizados
export const validators = {
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    },
    
    isValidGrade(grade) {
        return Number.isInteger(grade) && grade >= 1 && grade <= 12;
    },
    
    isValidScore(score, maxScore) {
        return Number.isInteger(score) && score >= 0 && score <= maxScore;
    },
    
    isValidDuration(duration) {
        return Number.isInteger(duration) && duration >= 0 && duration <= 3600 * 4; // Max 4 horas
    },
    
    validateSubmission(data) {
        const errors = [];
        
        if (!this.isValidUUID(data.studentId)) {
            errors.push('ID do estudante inválido');
        }
        
        if (!this.isValidUUID(data.assessmentId)) {
            errors.push('ID da avaliação inválido');
        }
        
        if (!this.isValidScore(data.score, data.totalQuestions)) {
            errors.push('Pontuação inválida');
        }
        
        if (!this.isValidDuration(data.totalDuration)) {
            errors.push('Duração inválida');
        }
        
        if (!Array.isArray(data.answerLog)) {
            errors.push('Log de respostas deve ser um array');
        } else {
            data.answerLog.forEach((answer, index) => {
                if (!answer.questionId) {
                    errors.push(`Resposta ${index} sem ID da questão`);
                }
                if (typeof answer.isCorrect !== 'boolean') {
                    errors.push(`Resposta ${index} sem indicação de correção`);
                }
            });
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};