// src/services/studentService.js - Serviço de alunos (atualizado para usar dataService)
import { dataService } from './dataService.js';

/**
 * Busca estudantes por turma
 * Agora delega para o dataService unificado
 */
export async function getStudentsByClass(classId) {
    if (!classId) {
        throw new Error('ID da turma é obrigatório');
    }

    return dataService.getStudentsByClass(classId);
}