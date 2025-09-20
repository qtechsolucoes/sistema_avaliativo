// tests/validators.test.js - Exemplo de testes
import { validators } from '../src/utils/validators.js';

describe('Validators', () => {
    describe('isValidUUID', () => {
        test('deve aceitar UUID válido', () => {
            const uuid = '123e4567-e89b-12d3-a456-426614174000';
            expect(validators.isValidUUID(uuid)).toBe(true);
        });
        
        test('deve rejeitar UUID inválido', () => {
            expect(validators.isValidUUID('invalid')).toBe(false);
            expect(validators.isValidUUID('')).toBe(false);
            expect(validators.isValidUUID(null)).toBe(false);
        });
    });
    
    describe('validateSubmission', () => {
        test('deve validar submissão correta', () => {
            const submission = {
                studentId: '123e4567-e89b-12d3-a456-426614174000',
                assessmentId: '123e4567-e89b-12d3-a456-426614174001',
                score: 8,
                totalQuestions: 10,
                totalDuration: 300,
                answerLog: [
                    { questionId: 'q1', isCorrect: true, duration: 30 }
                ]
            };
            
            const result = validators.validateSubmission(submission);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        
        test('deve detectar erros na submissão', () => {
            const submission = {
                studentId: 'invalid',
                assessmentId: 'invalid',
                score: -1,
                totalQuestions: 10,
                totalDuration: -100,
                answerLog: 'not-an-array'
            };
            
            const result = validators.validateSubmission(submission);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});