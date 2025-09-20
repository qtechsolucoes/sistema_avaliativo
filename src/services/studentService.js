// src/services/studentService.js - Serviço de alunos
import { getSupabaseClient, isSupabaseAvailable } from './supabaseClient.js';
import { mockDataService } from './mockDataService.js';

export async function getStudentsByClass(classId) {
    if (!classId) {
        throw new Error('ID da turma é obrigatório');
    }
    
    if (!isSupabaseAvailable()) {
        return mockDataService.getStudentsByClass(classId);
    }
    
    const client = getSupabaseClient();
    
    try {
        const { data, error } = await client
            .from('class_enrollments')
            .select(`
                student:students!inner (
                    id, 
                    full_name, 
                    adaptation_details
                )
            `)
            .eq('class_id', classId)
            .order('student(full_name)');
        
        if (error) throw error;
        
        // Extrai e valida os dados
        const students = data?.map(e => e.student).filter(s => s?.id && s?.full_name);
        
        return students?.length > 0 ? students : mockDataService.getStudentsByClass(classId);
        
    } catch (error) {
        console.error('Erro ao buscar alunos:', error);
        return mockDataService.getStudentsByClass(classId);
    }
}