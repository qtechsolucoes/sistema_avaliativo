// src/services/classService.js - Serviço de turmas (atualizado para usar dataService)
import { dataService } from './dataService.js';

/**
 * Busca turmas por ano/série
 * Agora delega para o dataService unificado
 */
export async function getClassesByGrade(grade, periodName = "3º Bimestre", year = 2025) {
    // Validação de entrada
    if (!grade || grade < 1 || grade > 12) {
        throw new Error(`Grade inválido: ${grade}`);
    }

    return dataService.getClassesByGrade(grade, periodName, year);
}