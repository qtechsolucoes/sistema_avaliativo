// src/database.js - VERSÃO CORRIGIDA E COMPLETA

import { getSupabaseClient, isSupabaseAvailable } from './services/supabaseClient.js';
import { mockDataService } from './services/mockDataService.js';
import { logService } from './services/logService.js';
import { validators } from './utils/validators.js';

// ===================================================================================
// FUNÇÕES DE BUSCA DE DADOS ESTRUTURAIS (DELEGADAS)
// ===================================================================================

export { getClassesByGrade } from './services/classService.js';
export { getStudentsByClass } from './services/studentService.js';


// ===================================================================================
// FUNÇÕES DE BUSCA DA AVALIAÇÃO
// ===================================================================================

export async function getAssessmentData(grade, disciplineName = 'Artes', periodName = '3º Bimestre', year = 2025) {
    if (!isSupabaseAvailable()) {
        logService.warn('Supabase indisponível. Usando avaliação mock.');
        return mockDataService.getAssessmentData(grade, disciplineName);
    }

    const client = getSupabaseClient();

    try {
        const { data: assessment, error: rpcError } = await client
            .rpc('get_assessment_by_details', {
                p_grade: grade,
                p_discipline_name: disciplineName,
                p_period_name: periodName,
                p_year: year
            })
            .single();

        if (rpcError || !assessment) {
            logService.warn('Avaliação não encontrada via RPC, usando mock.', { grade, disciplineName, error: rpcError });
            return mockDataService.getAssessmentData(grade, disciplineName);
        }

        const { data: assessmentData, error: queryError } = await client
            .from('assessments')
            .select(`
                id,
                title,
                base_text,
                assessment_questions (
                    question_order,
                    questions (
                        id,
                        question_text,
                        options
                    )
                )
            `)
            .eq('id', assessment.id)
            .single();

        if (queryError) {
            logService.error('Erro ao buscar detalhes da avaliação e questões.', queryError);
            throw queryError;
        }

        const validQuestions = (assessmentData.assessment_questions || [])
            .map(aq => ({ ...aq.questions, order: aq.question_order }))
            .filter(q => q && q.id && q.question_text)
            .sort((a, b) => a.order - b.order)
            .map(processQuestionOptions);

        if (validQuestions.length === 0) {
            logService.warn('Nenhuma questão válida encontrada para a avaliação, usando mock.', { assessmentId: assessment.id });
            return mockDataService.getAssessmentData(grade, disciplineName);
        }

        return {
            id: assessmentData.id,
            title: assessmentData.title,
            baseText: assessmentData.base_text || 'Texto de apoio não disponível.',
            questions: validQuestions
        };

    } catch (error) {
        logService.error('Falha crítica ao buscar dados da avaliação.', { error });
        return mockDataService.getAssessmentData(grade, disciplineName);
    }
}

function processQuestionOptions(question) {
    let options = [];
    try {
        options = typeof question.options === 'string' ? JSON.parse(question.options) : (question.options || []);
        if (!Array.isArray(options)) throw new Error('Options is not an array.');
        
        const hasCorrectOption = options.some(opt => opt.isCorrect === true);
        if (!hasCorrectOption && options.length > 0) {
            options[0].isCorrect = true;
            logService.warn('Questão sem resposta correta definida. Marcando a primeira como correta.', { questionId: question.id });
        }
    } catch (error) {
        logService.error('Erro ao processar opções da questão. Usando fallback.', { questionId: question.id, error });
        options = [
            { text: 'Opção A (Fallback)', isCorrect: true },
            { text: 'Opção B (Fallback)', isCorrect: false },
        ];
    }
    return { ...question, options };
}

// ===================================================================================
// FUNÇÕES DE SALVAMENTO DE RESULTADOS
// ===================================================================================

export async function saveSubmission(submissionData) {
    const { isValid, errors } = validators.validateSubmission(submissionData);
    if (!isValid) {
        logService.error('Dados de submissão inválidos.', { errors, submissionData });
        return { success: false, synced: false, error: 'validation_failed', details: errors.join(', ') };
    }

    if (!isSupabaseAvailable()) {
        logService.warn('Aplicação offline. Salvando submissão localmente.');
        return saveSubmissionOffline(submissionData);
    }

    try {
        const client = getSupabaseClient();
        const { error } = await client.rpc('submit_assessment', {
            p_student_id: submissionData.studentId,
            p_assessment_id: submissionData.assessmentId,
            p_score: submissionData.score,
            p_total_questions: submissionData.totalQuestions,
            p_total_duration: submissionData.totalDuration,
            p_answers: submissionData.answerLog
        });

        if (error) {
            if (error.code === 'P0001') {
                logService.warn('Tentativa de submissão duplicada bloqueada pelo banco.', { studentId: submissionData.studentId });
                return { success: false, synced: false, error: 'duplicate' };
            }
            throw error;
        }

        logService.info('Submissão salva e sincronizada com sucesso.', { studentId: submissionData.studentId });
        removeFromPendingResults(submissionData.studentId, submissionData.assessmentId);
        return { success: true, synced: true, error: null };

    } catch (error) {
        logService.error('Falha ao sincronizar com Supabase. Salvando localmente.', { error });
        return saveSubmissionOffline(submissionData);
    }
}

function saveSubmissionOffline(submissionData) {
    try {
        const localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');
        const isDuplicate = localResults.some(r => r.studentId === submissionData.studentId && r.assessmentId === submissionData.assessmentId);

        if (isDuplicate) {
            logService.warn('Submissão duplicada já existe localmente.', { studentId: submissionData.studentId });
            return { success: false, synced: false, error: 'duplicate_local' };
        }

        const dataWithTimestamp = { ...submissionData, localTimestamp: new Date().toISOString() };
        localResults.push(dataWithTimestamp);
        localStorage.setItem('pending_results', JSON.stringify(localResults));

        logService.info('Submissão salva localmente.', { studentId: submissionData.studentId });
        return { success: true, synced: false, error: 'offline' };

    } catch (error) {
        logService.critical('Falha crítica ao salvar no localStorage.', { error });
        return { success: false, synced: false, error: 'storage_failed' };
    }
}

function removeFromPendingResults(studentId, assessmentId) {
    try {
        let localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');
        localResults = localResults.filter(r => !(r.studentId === studentId && r.assessmentId === assessmentId));
        localStorage.setItem('pending_results', JSON.stringify(localResults));
    } catch (error) {
        logService.error('Erro ao limpar submissão pendente do localStorage.', { error });
    }
}

// ===================================================================================
// FUNÇÕES PARA O PAINEL DO PROFESSOR
// ===================================================================================

export async function getAllSubmissionsForDashboard() {
    const onlineSubmissions = await fetchOnlineSubmissions();
    const localSubmissions = getLocalSubmissionsForDashboard();
    const allSubmissionsMap = new Map();

    onlineSubmissions.forEach(sub => allSubmissionsMap.set(`${sub.student_id}-${sub.assessment_id}`, sub));
    localSubmissions.forEach(sub => {
        const key = `${sub.student_id}-${sub.assessment_id}`;
        if (!allSubmissionsMap.has(key)) {
            allSubmissionsMap.set(key, sub);
        }
    });

    const combined = Array.from(allSubmissionsMap.values());
    return combined.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
}

async function fetchOnlineSubmissions() {
    if (!isSupabaseAvailable()) {
        logService.warn('Supabase indisponível. Não foi possível buscar submissões online.');
        return [];
    }
    try {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('submissions')
            .select(`
                id, student_id, assessment_id, score, total_questions, total_duration_seconds, submitted_at,
                students!inner(id, full_name, adaptation_details, class_enrollments!inner(classes!inner(id, name, grade))),
                assessments(id, title)
            `)
            .order('submitted_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(sub => {
            const studentClass = sub.students?.class_enrollments[0]?.classes;
            return {
                ...sub,
                student_class: studentClass?.name || 'N/A',
                student_grade: studentClass?.grade || 0,
            };
        });

    } catch (error) {
        logService.error("Erro ao buscar submissões online.", { error });
        return [];
    }
}

function getLocalSubmissionsForDashboard() {
    try {
        return (JSON.parse(localStorage.getItem('pending_results') || '[]')).map((result, index) => ({
            id: `local-${index}-${result.studentId}`,
            student_id: result.studentId,
            assessment_id: result.assessmentId,
            score: result.score,
            total_questions: result.totalQuestions,
            total_duration_seconds: result.totalDuration,
            submitted_at: result.localTimestamp,
            is_local: true,
            students: { id: result.studentId, full_name: result.studentName || `Aluno Local`, adaptation_details: result.adaptationDetails || null },
            assessments: { id: result.assessmentId, title: result.assessmentTitle || 'Avaliação Local' },
            student_class: result.className || 'N/A',
            student_grade: result.grade || 0
        }));
    } catch (error) {
        logService.error('Erro ao carregar submissões locais.', { error });
        return [];
    }
}

export async function getSubmissionAnswers(submissionId) {
    if (!isSupabaseAvailable() || String(submissionId).startsWith('local-')) {
        logService.warn('Submissão local ou offline, não é possível buscar respostas detalhadas.');
        return [];
    }
    try {
        const client = getSupabaseClient();
        const { data, error } = await client.from('submission_answers').select(`*, questions(question_text)`).eq('submission_id', submissionId);
        if (error) throw error;
        return data || [];
    } catch (error) {
        logService.error("Erro ao buscar respostas da submissão.", { submissionId, error });
        return [];
    }
}

// ===================================================================================
// FUNÇÕES PARA GERAÇÃO DE ARQUIVO OFFLINE
// ===================================================================================

export async function getDataForOfflineFile() {
    if (!isSupabaseAvailable()) {
        alert("É necessário estar online para gerar o arquivo offline.");
        throw new Error("Offline mode: Cannot fetch data for offline file.");
    }
    logService.info('Iniciando coleta de dados para arquivo offline...');
    const client = getSupabaseClient();
    const [students, classes, enrollments, assessments] = await Promise.all([
        client.from('students').select('*'),
        client.from('classes').select('*'),
        client.from('class_enrollments').select('*'),
        client.from('assessments').select(`*, assessment_questions(question_order, questions(*))`)
    ]);

    const errors = [students.error, classes.error, enrollments.error, assessments.error].filter(Boolean);
    if (errors.length > 0) {
        logService.critical('Erro ao buscar dados para o arquivo offline.', { errors });
        throw new Error("Falha ao buscar todos os dados do Supabase.");
    }

    logService.info('Coleta de dados para arquivo offline concluída.');
    return {
        students: students.data,
        classes: classes.data,
        enrollments: enrollments.data,
        assessments: assessments.data
    };
}