// src/utils/validators.js - VERSÃO CORRIGIDA E COMPLETA

export const validators = {
    /**
     * Verifica se um ID é válido. Aceita UUIDs padrão do banco,
     * bem como identificadores customizados para dados mock ou locais.
     * @param {string} id - O identificador a ser validado.
     * @returns {boolean}
     */
    isValidUUID(id) {
        if (typeof id !== 'string' || id.trim() === '') {
            return false;
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        // Permite UUIDs válidos OU strings que começam com 'mock-' ou 'local-'
        return uuidRegex.test(id) || id.startsWith('mock-') || id.startsWith('local-');
    },

    /**
     * Verifica se a pontuação é um número válido dentro do intervalo esperado.
     * @param {number} score - A pontuação obtida.
     * @param {number} maxScore - O número total de questões.
     * @returns {boolean}
     */
    isValidScore(score, maxScore) {
        return typeof score === 'number' && score >= 0 && score <= maxScore;
    },

    /**
     * Verifica se a duração é um número não negativo.
     * @param {number} duration - A duração em segundos.
     * @returns {boolean}
     */
    isValidDuration(duration) {
        return typeof duration === 'number' && duration >= 0;
    },

    /**
     * Valida a estrutura essencial de um objeto de submissão antes de salvá-lo.
     * Esta função é crucial para a função de importação, pois ignora campos extras
     * e foca apenas nos dados necessários para o banco.
     * @param {object} data - O objeto da submissão.
     * @returns {{isValid: boolean, errors: string[]}}
     */
    validateSubmission(data) {
        const errors = [];

        if (!data) {
            return { isValid: false, errors: ['O objeto de submissão não pode ser nulo.'] };
        }

        if (!this.isValidUUID(data.studentId)) {
            errors.push('ID do estudante inválido ou ausente.');
        }
        if (!this.isValidUUID(data.assessmentId)) {
            errors.push('ID da avaliação inválido ou ausente.');
        }
        if (typeof data.totalQuestions !== 'number' || data.totalQuestions <= 0) {
            errors.push('O número total de questões é inválido.');
        }
        // A validação de 'score' agora depende do 'totalQuestions' ser válido primeiro
        if (!this.isValidScore(data.score, data.totalQuestions)) {
            errors.push('A pontuação é inválida ou está fora do intervalo permitido.');
        }
        if (!this.isValidDuration(data.totalDuration)) {
            errors.push('A duração total é inválida ou ausente.');
        }
        if (!Array.isArray(data.answerLog)) {
            // Permite answerLog vazio, mas deve ser um array se existir
            errors.push('O log de respostas (answerLog) deve ser um array.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};