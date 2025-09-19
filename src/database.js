// src/database.js

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let supabaseClient;
const { createClient } = supabase;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error("Erro ao inicializar Supabase. Verifique as suas credenciais.", e);
    }
} else {
    console.warn("Credenciais do Supabase não encontradas. A integração online está desabilitada.");
}

// ===================================================================================
// FUNÇÕES DE BUSCA DE DADOS ESTRUTURAIS
// ===================================================================================

/**
 * Busca as turmas de um determinado ano e período letivo.
 * @param {number} grade - O ano (ex: 6, 7).
 * @param {string} periodName - O nome do período (ex: "3º Bimestre").
 * @param {number} year - O ano letivo (ex: 2025).
 * @returns {Promise<Array>} - Lista de objetos de turma.
 */
export async function getClassesByGrade(grade, periodName = "3º Bimestre", year = 2025) {
    if (!supabaseClient) return [];
    try {
        const { data: periodData, error: periodError } = await supabaseClient
            .from('academic_periods')
            .select('id')
            .eq('year', year)
            .eq('name', periodName)
            .single();

        if (periodError) throw periodError;

        const { data, error } = await supabaseClient
            .from('classes')
            .select('id, name')
            .eq('grade', grade)
            .eq('academic_period_id', periodData.id);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Erro ao buscar turmas:", error.message);
        return [];
    }
}

/**
 * Busca os alunos matriculados numa turma específica, ordenados por nome.
 * @param {string} classId - O ID da turma.
 * @returns {Promise<Array>} - Lista de objetos de aluno.
 */
export async function getStudentsByClass(classId) {
    if (!supabaseClient) return [];
    try {
        const { data, error } = await supabaseClient
            .from('class_enrollments')
            // CORREÇÃO: Adicionado 'adaptation_details' ao select para buscar os dados de adaptação.
            .select('students(id, full_name, adaptation_details)')
            .eq('class_id', classId)
            .order('full_name', { foreignTable: 'students' });

        if (error) throw error;
        // Transforma o resultado para uma lista simples de alunos
        return data.map(enrollment => enrollment.students) || [];
    } catch (error) {
        console.error("Erro ao buscar alunos da turma:", error.message);
        return [];
    }
}

// ===================================================================================
// FUNÇÕES DE BUSCA DE DADOS DA AVALIAÇÃO
// ===================================================================================

/**
 * Busca os detalhes de uma avaliação e a sua lista de questões ordenada.
 * @param {number} grade - O ano da avaliação.
 * @param {string} disciplineName - O nome da disciplina.
 * @param {string} periodName - O nome do período.
 * @param {number} year - O ano letivo.
 * @returns {Promise<object|null>} - O objeto da avaliação com a lista de questões.
 */
export async function getAssessmentData(grade, disciplineName = 'Artes', periodName = '3º Bimestre', year = 2025) {
    if (!supabaseClient) return null;
    try {
        // 1. Encontra a avaliação correspondente
        const { data: assessmentData, error: assessmentError } = await supabaseClient
            .rpc('get_assessment_by_details', {
                p_grade: grade,
                p_discipline_name: disciplineName,
                p_period_name: periodName,
                p_year: year
            })
            .single();

        if (assessmentError || !assessmentData) throw assessmentError || new Error("Avaliação não encontrada.");

        // 2. Busca as questões associadas a essa avaliação
        const { data: questionsData, error: questionsError } = await supabaseClient
            .from('assessment_questions')
            .select('questions(*)')
            .eq('assessment_id', assessmentData.id)
            .order('question_order');

        if (questionsError) throw questionsError;

        // Monta o objeto final
        return {
            id: assessmentData.id,
            title: assessmentData.title,
            baseText: assessmentData.base_text,
            questions: questionsData.map(q => q.questions) // Extrai o objeto da questão
        };

    } catch (error) {
        console.error("Erro ao buscar dados da avaliação:", error.message);
        return null;
    }
}

// ===================================================================================
// FUNÇÕES DE SALVAMENTO DE RESULTADOS
// ===================================================================================

/**
 * Salva uma submissão de prova completa (resultado geral + respostas detalhadas).
 * Utiliza uma transação para garantir que tudo seja salvo ou nada seja salvo.
 * @param {object} submissionData - Dados da submissão.
 * @returns {Promise<object>} - Um objeto indicando o estado da operação.
 */
export async function saveSubmission(submissionData) {
    if (!supabaseClient) {
        // Lógica de salvamento offline continua a mesma
        const localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');
        localResults.push(submissionData);
        localStorage.setItem('pending_results', JSON.stringify(localResults));
        return { success: true, synced: false, error: 'offline' };
    }

    try {
        // Chama uma função no Supabase que executa a transação
        const { error } = await supabaseClient.rpc('submit_assessment', {
            p_student_id: submissionData.studentId,
            p_assessment_id: submissionData.assessmentId,
            p_score: submissionData.score,
            p_total_questions: submissionData.totalQuestions,
            p_total_duration: submissionData.totalDuration,
            p_answers: submissionData.answerLog // Envia o array de respostas
        });

        if (error) throw error;

        return { success: true, synced: true, error: null };

    } catch (error) {
        console.error("Falha na sincronização:", error.message);
        // Salva localmente se a transação online falhar
        const localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');
        localResults.push(submissionData);
        localStorage.setItem('pending_results', JSON.stringify(localResults));
        
        if (error.code === 'P0001') { // Erro customizado da nossa função (aluno já respondeu)
            return { success: false, synced: false, error: 'duplicate' };
        }
        return { success: true, synced: false, error: error.message };
    }
}

// ===================================================================================
// FUNÇÕES PARA O PAINEL DO PROFESSOR
// ===================================================================================

/**
 * Busca todos os resultados de todas as submissões para o painel.
 * @returns {Promise<Array>} - Lista de todas as submissões com detalhes.
 */
export async function getAllSubmissionsForDashboard() {
    if (!supabaseClient) return [];
    try {
        const { data, error } = await supabaseClient
            .from('submissions')
            .select(`
                *,
                students (full_name),
                assessments (title)
            `)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Erro ao buscar todas as submissões:", error.message);
        return [];
    }
}

/**
 * Busca os detalhes das respostas de uma submissão específica.
 * @param {string} submissionId - O ID da submissão.
 * @returns {Promise<Array>} - Lista de respostas detalhadas.
 */
export async function getSubmissionAnswers(submissionId) {
    if (!supabaseClient) return [];
    try {
        const { data, error } = await supabaseClient
            .from('submission_answers')
            .select('*, questions(question_text)')
            .eq('submission_id', submissionId);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Erro ao buscar respostas da submissão:", error.message);
        return [];
    }
}
