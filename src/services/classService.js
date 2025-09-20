// src/services/classService.js - Serviço de turmas
import { getSupabaseClient, isSupabaseAvailable } from './supabaseClient.js';
import { mockDataService } from './mockDataService.js';

export async function getClassesByGrade(grade, periodName = "3º Bimestre", year = 2025) {
    // Validação de entrada
    if (!grade || grade < 1 || grade > 12) {
        throw new Error(`Grade inválido: ${grade}`);
    }
    
    if (!isSupabaseAvailable()) {
        return mockDataService.getClassesByGrade(grade);
    }
    
    const client = getSupabaseClient();
    
    try {
        // Busca período acadêmico
        const { data: period, error: periodError } = await client
            .from('academic_periods')
            .select('id')
            .eq('year', year)
            .eq('name', periodName)
            .maybeSingle(); // Usa maybeSingle ao invés de single
        
        if (periodError || !period) {
            console.warn('Período não encontrado, usando mock');
            return mockDataService.getClassesByGrade(grade);
        }
        
        // Busca turmas
        const { data: classes, error } = await client
            .from('classes')
            .select('id, name')
            .eq('grade', grade)
            .eq('academic_period_id', period.id)
            .order('name');
        
        if (error) throw error;
        
        return classes?.length > 0 ? classes : mockDataService.getClassesByGrade(grade);
        
    } catch (error) {
        console.error('Erro ao buscar turmas:', error);
        return mockDataService.getClassesByGrade(grade);
    }
}