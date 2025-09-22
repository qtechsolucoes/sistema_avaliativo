// src/utils/validators.js - VERSÃO CORRIGIDA, COMPLETA E SEGURA

import { HTMLSanitizer } from './sanitizer.js';

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

        // Regex mais flexível para UUIDs (versões 1-5)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        // Permite UUIDs válidos OU strings que começam com 'mock-' ou 'local-'
        const isValidUUID = uuidRegex.test(id);
        const isMockId = id.startsWith('mock-') || id.startsWith('local-');

        // Debug: Log de validação para ajudar a diagnosticar
        if (!isValidUUID && !isMockId) {
            console.debug('UUID inválido:', { id, length: id.length, pattern: 'UUID v1-5 expected' });
        }

        return isValidUUID || isMockId;
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

        // Debug: Mostra os IDs que estão sendo validados
        console.debug('Validando submissão:', {
            studentId: data.studentId,
            assessmentId: data.assessmentId,
            studentIdType: typeof data.studentId,
            assessmentIdType: typeof data.assessmentId
        });

        if (!this.isValidUUID(data.studentId)) {
            errors.push('ID do estudante inválido ou ausente.');
            console.debug('StudentId falhou na validação:', data.studentId);
        }
        if (!this.isValidUUID(data.assessmentId)) {
            errors.push('ID da avaliação inválido ou ausente.');
            console.debug('AssessmentId falhou na validação:', data.assessmentId);
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
    },

    /**
     * Valida e sanitiza input de texto do usuário
     * @param {string} text - Texto a ser validado
     * @param {number} maxLength - Tamanho máximo permitido
     * @param {boolean} allowHTML - Se permite HTML básico
     * @returns {{isValid: boolean, sanitized: string, errors: string[]}}
     */
    validateUserText(text, maxLength = 1000, allowHTML = false) {
        const errors = [];

        if (typeof text !== 'string') {
            return { isValid: false, sanitized: '', errors: ['Texto deve ser uma string'] };
        }

        // Sanitiza o texto
        const sanitized = allowHTML
            ? HTMLSanitizer.stripHTML(text) // Remove HTML se não permitido
            : HTMLSanitizer.sanitizeUserInput(text, maxLength);

        // Valida tamanho
        if (sanitized.length > maxLength) {
            errors.push(`Texto muito longo. Máximo ${maxLength} caracteres.`);
        }

        // Verifica caracteres suspeitos se não permite HTML
        if (!allowHTML && /<[^>]*>/.test(text)) {
            errors.push('HTML não é permitido neste campo.');
        }

        return {
            isValid: errors.length === 0,
            sanitized,
            errors
        };
    },

    /**
     * Valida dados de estudante
     * @param {object} student - Dados do estudante
     * @returns {{isValid: boolean, errors: string[]}}
     */
    validateStudentData(student) {
        const errors = [];

        if (!student || typeof student !== 'object') {
            return { isValid: false, errors: ['Dados do estudante inválidos'] };
        }

        // Valida nome
        const nameValidation = this.validateUserText(student.name || '', 100);
        if (!nameValidation.isValid) {
            errors.push('Nome inválido: ' + nameValidation.errors.join(', '));
        }

        // Valida grade
        if (!student.grade || typeof student.grade !== 'string') {
            errors.push('Ano/série é obrigatório');
        }

        // Valida classId se fornecido
        if (student.classId && !this.isValidUUID(student.classId)) {
            errors.push('ID da turma inválido');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Valida dados de avaliação
     * @param {object} assessment - Dados da avaliação
     * @returns {{isValid: boolean, errors: string[]}}
     */
    validateAssessmentData(assessment) {
        const errors = [];

        if (!assessment || typeof assessment !== 'object') {
            return { isValid: false, errors: ['Dados da avaliação inválidos'] };
        }

        // Valida ID
        if (!this.isValidUUID(assessment.id)) {
            errors.push('ID da avaliação inválido');
        }

        // Valida título
        const titleValidation = this.validateUserText(assessment.title || '', 200);
        if (!titleValidation.isValid) {
            errors.push('Título inválido: ' + titleValidation.errors.join(', '));
        }

        // Valida questões
        if (!Array.isArray(assessment.questions)) {
            errors.push('Lista de questões deve ser um array');
        } else if (assessment.questions.length === 0) {
            errors.push('Avaliação deve ter pelo menos uma questão');
        } else {
            // Valida cada questão
            assessment.questions.forEach((question, index) => {
                const questionErrors = this.validateQuestionData(question, index + 1);
                errors.push(...questionErrors);
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Valida dados de uma questão
     * @param {object} question - Dados da questão
     * @param {number} questionNumber - Número da questão para erro
     * @returns {string[]} Lista de erros
     */
    validateQuestionData(question, questionNumber = 0) {
        const errors = [];
        const prefix = questionNumber > 0 ? `Questão ${questionNumber}: ` : '';

        if (!question || typeof question !== 'object') {
            return [`${prefix}Dados da questão inválidos`];
        }

        // Valida ID
        if (!this.isValidUUID(question.id)) {
            errors.push(`${prefix}ID inválido`);
        }

        // Valida texto da questão
        const textValidation = this.validateUserText(question.question_text || '', 2000, true);
        if (!textValidation.isValid) {
            errors.push(`${prefix}Texto inválido: ${textValidation.errors.join(', ')}`);
        }

        // Valida opções
        if (!Array.isArray(question.options)) {
            errors.push(`${prefix}Opções devem ser um array`);
        } else if (question.options.length < 2) {
            errors.push(`${prefix}Deve ter pelo menos 2 opções`);
        } else {
            const correctOptions = question.options.filter(opt => opt.isCorrect === true);
            if (correctOptions.length !== 1) {
                errors.push(`${prefix}Deve ter exatamente 1 opção correta`);
            }

            // Valida cada opção
            question.options.forEach((option, optIndex) => {
                if (!option.text || typeof option.text !== 'string') {
                    errors.push(`${prefix}Opção ${optIndex + 1}: texto inválido`);
                }
                if (typeof option.isCorrect !== 'boolean') {
                    errors.push(`${prefix}Opção ${optIndex + 1}: campo isCorrect deve ser boolean`);
                }
            });
        }

        return errors;
    },

    /**
     * Valida estrutura de resposta do log
     * @param {object} answer - Resposta do log
     * @returns {{isValid: boolean, errors: string[]}}
     */
    validateAnswerLog(answer) {
        const errors = [];

        if (!answer || typeof answer !== 'object') {
            return { isValid: false, errors: ['Resposta inválida'] };
        }

        if (!this.isValidUUID(answer.questionId)) {
            errors.push('ID da questão inválido');
        }

        if (typeof answer.isCorrect !== 'boolean') {
            errors.push('Campo isCorrect deve ser boolean');
        }

        if (!this.isValidDuration(answer.duration)) {
            errors.push('Duração inválida');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};