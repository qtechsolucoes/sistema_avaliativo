// src/services/localServerClient.js
// Cliente para se comunicar com o servidor local em cache

import { logService } from './logService.js';

// Detecta automaticamente o servidor local
const SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : window.location.protocol === 'https:'
        ? `https://${window.location.hostname}`  // HTTPS sem porta (Render usa porta 443 por padrão)
        : `http://${window.location.hostname}:${window.location.port || 8000}`;

console.log(`🌐 Cliente configurado para: ${SERVER_URL}`);

class LocalServerClient {
    constructor() {
        this.baseURL = SERVER_URL;
        this.isAvailable = false;
        this.checkAvailability();
    }

    async checkAvailability() {
        try {
            const response = await fetch(`${this.baseURL}/api/status`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                this.isAvailable = data.cacheReady;
                logService.info('Servidor local disponível', data);
                console.log('✅ Conectado ao servidor local com cache!');
                return true;
            }
        } catch (error) {
            logService.warn('Servidor local não disponível', error);
            console.log('⚠️ Servidor local não detectado - usando conexão direta');
            this.isAvailable = false;
        }
        return false;
    }

    async getClassesByGrade(grade) {
        try {
            logService.info('Buscando turmas do servidor local', { grade });

            const response = await fetch(`${this.baseURL}/api/classes/${grade}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const classes = await response.json();
            logService.info(`Recebidas ${classes.length} turmas do servidor local`);
            return classes;

        } catch (error) {
            logService.error('Erro ao buscar turmas do servidor local', error);
            throw error;
        }
    }

    async getStudentsByClass(classId) {
        try {
            logService.info('Buscando estudantes do servidor local', { classId });

            const response = await fetch(`${this.baseURL}/api/students/${classId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const students = await response.json();
            logService.info(`Recebidos ${students.length} estudantes do servidor local`);
            return students;

        } catch (error) {
            logService.error('Erro ao buscar estudantes do servidor local', error);
            throw error;
        }
    }

    async getAssessmentData(grade, disciplineName = 'Artes') {
        try {
            logService.info('Buscando avaliação do servidor local', { grade, disciplineName });

            const response = await fetch(`${this.baseURL}/api/assessment/${grade}?discipline=${encodeURIComponent(disciplineName)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const assessment = await response.json();
            logService.info(`Recebida avaliação com ${assessment.questions.length} questões do servidor local`);
            return assessment;

        } catch (error) {
            logService.error('Erro ao buscar avaliação do servidor local', error);
            throw error;
        }
    }

    async saveSubmission(submissionData) {
        try {
            logService.info('Enviando submissão para servidor local', {
                studentId: submissionData.studentId,
                assessmentId: submissionData.assessmentId
            });

            const response = await fetch(`${this.baseURL}/api/submission`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            logService.info('Submissão processada pelo servidor local', result);
            return result;

        } catch (error) {
            logService.error('Erro ao enviar submissão para servidor local', error);
            throw error;
        }
    }

    async getCompletedSubmissions(classId) {
        try {
            logService.info('Buscando submissões completadas do servidor local', { classId });

            const response = await fetch(`${this.baseURL}/api/completed-submissions/${classId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const completed = await response.json();
            logService.info(`Recebidas ${completed.length} submissões completadas do servidor local`);
            return completed;

        } catch (error) {
            logService.error('Erro ao buscar submissões completadas do servidor local', error);
            throw error;
        }
    }

    async reloadCache() {
        try {
            logService.info('Solicitando recarga do cache no servidor local');

            const response = await fetch(`${this.baseURL}/api/reload-cache`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            logService.info('Cache recarregado com sucesso', result);
            return result;

        } catch (error) {
            logService.error('Erro ao recarregar cache do servidor local', error);
            throw error;
        }
    }
}

export const localServerClient = new LocalServerClient();
