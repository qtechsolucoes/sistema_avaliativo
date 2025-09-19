// src/database.js - VERSÃO CORRIGIDA

// src/database.js - VERSÃO CORRIGIDA COM MELHOR DEBUG

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let supabaseClient;
const { createClient } = supabase;

// CORREÇÃO: Debug detalhado da inicialização
console.log('=== INICIALIZANDO SUPABASE ===');
console.log('URL fornecida:', SUPABASE_URL);
console.log('Key fornecida:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NÃO FORNECIDA');

if (SUPABASE_URL && SUPABASE_ANON_KEY && 
    SUPABASE_URL !== 'https://seu-projeto.supabase.co' && 
    SUPABASE_ANON_KEY !== 'sua-chave-anonima-aqui') {
    try {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase inicializado com sucesso');
        
        // TESTE de conexão
        supabaseClient.from('students').select('count', { count: 'exact', head: true })
            .then(({ count, error }) => {
                if (error) {
                    console.error('❌ Erro na conexão de teste:', error);
                } else {
                    console.log(`✅ Conexão testada - ${count} estudantes encontrados`);
                }
            });
            
    } catch (e) {
        console.error("❌ Erro ao inicializar Supabase:", e);
        supabaseClient = null;
    }
} else {
    console.warn("⚠️ Credenciais do Supabase não configuradas - usando modo offline");
    supabaseClient = null;
}

// ===================================================================================
// FUNÇÕES DE BUSCA DE DADOS ESTRUTURAIS
// ===================================================================================

/**
 * Busca as turmas de um determinado ano e período letivo.
 */
export async function getClassesByGrade(grade, periodName = "3º Bimestre", year = 2025) {
    console.log(`=== BUSCANDO TURMAS ===`);
    console.log(`Grade: ${grade}, Período: ${periodName}, Ano: ${year}`);
    console.log(`Supabase cliente disponível:`, !!supabaseClient);
    
    if (!supabaseClient) {
        console.warn('⚠️ Supabase não disponível - usando dados mock para turmas');
        const mockData = createMockClasses(grade);
        console.log('Mock classes criadas:', mockData);
        return mockData;
    }
    
    try {
        console.log('🔍 Buscando período acadêmico...');
        const { data: periodData, error: periodError } = await supabaseClient
            .from('academic_periods')
            .select('id')
            .eq('year', year)
            .eq('name', periodName)
            .single();

        if (periodError) {
            console.warn('⚠️ Período acadêmico não encontrado:', periodError);
            console.log('Tentando buscar TODOS os períodos para debug...');
            
            const { data: allPeriods, error: allPeriodsError } = await supabaseClient
                .from('academic_periods')
                .select('*');
            
            if (allPeriodsError) {
                console.error('❌ Erro ao buscar períodos:', allPeriodsError);
            } else {
                console.log('📅 Períodos disponíveis no banco:', allPeriods);
            }
            
            return createMockClasses(grade);
        }

        console.log('✅ Período encontrado:', periodData);

        console.log('🔍 Buscando turmas...');
        const { data, error } = await supabaseClient
            .from('classes')
            .select('id, name')
            .eq('grade', grade)
            .eq('academic_period_id', periodData.id);

        if (error) {
            console.error('❌ Erro ao buscar turmas:', error);
            throw error;
        }
        
        console.log(`✅ Turmas encontradas no Supabase:`, data);
        
        // Garante que sempre retorna um array
        return data && data.length > 0 ? data : createMockClasses(grade);
        
    } catch (error) {
        console.error("❌ Erro geral ao buscar turmas:", error.message);
        return createMockClasses(grade);
    }
}

/**
 * NOVA FUNÇÃO: Cria turmas mock para funcionamento offline
 */
function createMockClasses(grade) {
    return [
        { id: `mock-class-${grade}-A`, name: 'A' },
        { id: `mock-class-${grade}-B`, name: 'B' }
    ];
}

/**
 * Busca os alunos matriculados numa turma específica, ordenados por nome.
 * @param {string} classId - O ID da turma.
 * @returns {Promise<Array>} - Lista de objetos de aluno.
 */
export async function getStudentsByClass(classId) {
    if (!supabaseClient) {
        console.warn('Modo offline: retornando alunos mock');
        return createMockStudents(classId);
    }
    
    try {
        // CORREÇÃO: Query melhorada com melhor tratamento de erros
        const { data, error } = await supabaseClient
            .from('class_enrollments')
            .select(`
                students (
                    id, 
                    full_name, 
                    adaptation_details
                )
            `)
            .eq('class_id', classId)
            .order('full_name', { foreignTable: 'students', ascending: true });

        if (error) throw error;
        
        // CORREÇÃO: Validação robusta dos dados retornados
        if (!data || data.length === 0) {
            console.warn('Nenhum aluno encontrado para a turma, usando dados mock');
            return createMockStudents(classId);
        }

        // CORREÇÃO: Filtra e valida dados antes de retornar
        const validStudents = data
            .map(enrollment => enrollment.students)
            .filter(student => student && student.id && student.full_name);

        return validStudents.length > 0 ? validStudents : createMockStudents(classId);
        
    } catch (error) {
        console.error("Erro ao buscar alunos da turma:", error.message);
        return createMockStudents(classId);
    }
}

/**
 * NOVA FUNÇÃO: Cria alunos mock baseados na estrutura real do banco
 */
function createMockStudents(classId) {
    const baseStudents = [
        { 
            id: `mock-student-1-${classId}`, 
            full_name: 'Ana Silva', 
            adaptation_details: null 
        },
        { 
            id: `mock-student-2-${classId}`, 
            full_name: 'João Santos', 
            adaptation_details: {
                "diagnosis": ["TDAH", "Transtorno de aprendizagem"],
                "suggestions": ["Textos curtos", "Poucas opções de alternativas"],
                "difficulties": ["Atenção", "Concentração"]
            }
        },
        { 
            id: `mock-student-3-${classId}`, 
            full_name: 'Maria Costa', 
            adaptation_details: {
                "diagnosis": ["TEA", "Deficiência Motora"],
                "suggestions": ["Atividades para coordenação motora", "Pareamento"],
                "difficulties": ["Coordenação motora fina"]
            }
        },
        { 
            id: `mock-student-4-${classId}`, 
            full_name: 'Pedro Lima', 
            adaptation_details: null 
        },
        { 
            id: `mock-student-5-${classId}`, 
            full_name: 'Sofia Oliveira', 
            adaptation_details: {
                "diagnosis": ["Síndrome de Down"],
                "suggestions": ["Coordenação motora", "Relação números/quantidades"],
                "difficulties": ["Atenção e concentração"]
            }
        },
        { 
            id: `mock-student-6-${classId}`, 
            full_name: 'Carlos Mendes', 
            adaptation_details: {
                "diagnosis": ["Deficiência Intelectual"],
                "suggestions": ["Atividades com textos curtos", "Poucas alternativas de respostas"],
                "difficulties": ["Interpretação textual", "Cálculos matemáticos"]
            }
        }
    ];
    
    console.log('Dados mock criados com alunos atípicos (estrutura real):', 
                baseStudents.filter(s => s.adaptation_details).length);
    return baseStudents;
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
    if (!supabaseClient) {
        console.warn('Modo offline: retornando avaliação mock');
        return createMockAssessment(grade, disciplineName);
    }
    
    try {
        // 1. Busca a avaliação usando a função RPC
        const { data: assessmentData, error: assessmentError } = await supabaseClient
            .rpc('get_assessment_by_details', {
                p_grade: grade,
                p_discipline_name: disciplineName,
                p_period_name: periodName,
                p_year: year
            })
            .single();

        if (assessmentError || !assessmentData) {
            console.warn('Avaliação não encontrada no banco, usando dados mock:', assessmentError);
            return createMockAssessment(grade, disciplineName);
        }

        // 2. Busca as questões associadas
        const { data: questionsData, error: questionsError } = await supabaseClient
            .from('assessment_questions')
            .select(`
                questions (
                    id,
                    question_text,
                    options,
                    grade,
                    discipline_id
                )
            `)
            .eq('assessment_id', assessmentData.id)
            .order('question_order');

        if (questionsError) {
            console.warn('Erro ao buscar questões, usando mock:', questionsError);
            return createMockAssessment(grade, disciplineName);
        }

        // CORREÇÃO: Valida e processa as questões
        const validQuestions = questionsData
            .map(q => q.questions)
            .filter(question => question && question.id && question.question_text)
            .map(question => processQuestionOptions(question));

        if (validQuestions.length === 0) {
            console.warn('Nenhuma questão válida encontrada, usando mock');
            return createMockAssessment(grade, disciplineName);
        }

        return {
            id: assessmentData.id,
            title: assessmentData.title,
            baseText: assessmentData.base_text || 'Texto base não disponível.',
            questions: validQuestions
        };

    } catch (error) {
        console.error("Erro ao buscar dados da avaliação:", error.message);
        return createMockAssessment(grade, disciplineName);
    }
}

/**
 * NOVA FUNÇÃO: Processa as opções das questões para garantir estrutura correta
 */
function processQuestionOptions(question) {
    let options = [];
    
    try {
        // Se options for string JSON, faz parse
        if (typeof question.options === 'string') {
            options = JSON.parse(question.options);
        } else if (Array.isArray(question.options)) {
            options = question.options;
        } else {
            console.warn('Estrutura de opções inválida para questão:', question.id);
            options = [
                { text: 'Opção A', isCorrect: true },
                { text: 'Opção B', isCorrect: false }
            ];
        }
        
        // CORREÇÃO: Garante que há pelo menos uma opção correta
        const hasCorrectOption = options.some(opt => opt.isCorrect === true);
        if (!hasCorrectOption && options.length > 0) {
            options[0].isCorrect = true;
            console.warn('Questão sem resposta correta, marcando primeira opção:', question.id);
        }
        
    } catch (error) {
        console.error('Erro ao processar opções da questão:', question.id, error);
        options = [
            { text: 'Opção A', isCorrect: true },
            { text: 'Opção B', isCorrect: false }
        ];
    }
    
    return { ...question, options };
}

/**
 * NOVA FUNÇÃO: Cria avaliação mock para funcionamento offline
 */
function createMockAssessment(grade, disciplineName) {
    return {
        id: `mock-assessment-${grade}-${disciplineName.toLowerCase()}`,
        title: `Avaliação de ${disciplineName} - ${grade}º Ano`,
        baseText: `Este é um texto base de apoio para a avaliação de ${disciplineName} do ${grade}º ano. 
        
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
        
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`,
        questions: [
            {
                id: `mock-q1-${grade}`,
                question_text: `Qual é a principal característica da arte do ${grade}º ano de ensino?`,
                options: [
                    { text: 'Expressão criativa e desenvolvimento técnico', isCorrect: true },
                    { text: 'Apenas técnica sem criatividade', isCorrect: false },
                    { text: 'Somente teoria sem prática', isCorrect: false },
                    { text: 'Imitação sem originalidade', isCorrect: false }
                ]
            },
            {
                id: `mock-q2-${grade}`,
                question_text: 'Como a cor influencia uma obra de arte?',
                options: [
                    { text: 'Não tem influência alguma', isCorrect: false },
                    { text: 'Transmite emoções e sensações', isCorrect: true },
                    { text: 'Serve apenas para decoração', isCorrect: false },
                    { text: 'É sempre secundária à forma', isCorrect: false }
                ]
            },
            {
                id: `mock-q3-${grade}`,
                question_text: 'Qual a importância do desenho na formação artística?',
                options: [
                    { text: 'É dispensável na arte moderna', isCorrect: false },
                    { text: 'Desenvolve observação e coordenação motora', isCorrect: true },
                    { text: 'Só serve para copiar outros artistas', isCorrect: false },
                    { text: 'É útil apenas para arquitetura', isCorrect: false }
                ]
            }
        ]
    };
}

// ===================================================================================
// FUNÇÕES DE SALVAMENTO DE RESULTADOS - CORRIGIDAS
// ===================================================================================

/**
 * Salva uma submissão de prova completa com validação robusta.
 * @param {object} submissionData - Dados da submissão.
 * @returns {Promise<object>} - Um objeto indicando o estado da operação.
 */
export async function saveSubmission(submissionData) {
    // CORREÇÃO: Validação completa dos dados antes do salvamento
    const validationResult = validateSubmissionData(submissionData);
    if (!validationResult.isValid) {
        console.error('Dados de submissão inválidos:', validationResult.errors);
        return { success: false, synced: false, error: 'validation_failed', details: validationResult.errors };
    }

    if (!supabaseClient) {
        return saveSubmissionOffline(submissionData);
    }

    try {
        // CORREÇÃO: Chama a função RPC com dados validados
        const { error } = await supabaseClient.rpc('submit_assessment', {
            p_student_id: submissionData.studentId,
            p_assessment_id: submissionData.assessmentId,
            p_score: submissionData.score,
            p_total_questions: submissionData.totalQuestions,
            p_total_duration: submissionData.totalDuration,
            p_answers: submissionData.answerLog
        });

        if (error) {
            if (error.code === 'P0001') {
                return { success: false, synced: false, error: 'duplicate' };
            }
            throw error;
        }

        // CORREÇÃO: Remove dados locais após sucesso online
        removeFromPendingResults(submissionData);
        
        return { success: true, synced: true, error: null };

    } catch (error) {
        console.error("Falha na sincronização:", error.message);
        return saveSubmissionOffline(submissionData);
    }
}

/**
 * NOVA FUNÇÃO: Validação robusta dos dados de submissão
 */
function validateSubmissionData(data) {
    const errors = [];
    
    if (!data.studentId || typeof data.studentId !== 'string') {
        errors.push('studentId inválido');
    }
    
    if (!data.assessmentId || typeof data.assessmentId !== 'string') {
        errors.push('assessmentId inválido');
    }
    
    if (typeof data.score !== 'number' || data.score < 0) {
        errors.push('score inválido');
    }
    
    if (typeof data.totalQuestions !== 'number' || data.totalQuestions <= 0) {
        errors.push('totalQuestions inválido');
    }
    
    if (data.score > data.totalQuestions) {
        errors.push('score não pode ser maior que totalQuestions');
    }
    
    if (typeof data.totalDuration !== 'number' || data.totalDuration < 0) {
        errors.push('totalDuration inválido');
    }
    
    if (!Array.isArray(data.answerLog)) {
        errors.push('answerLog deve ser um array');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * NOVA FUNÇÃO: Salvamento offline melhorado
 */
function saveSubmissionOffline(submissionData) {
    try {
        const localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');
        
        // CORREÇÃO: Verifica duplicatas locais
        const isDuplicate = localResults.some(result => 
            result.studentId === submissionData.studentId && 
            result.assessmentId === submissionData.assessmentId
        );
        
        if (isDuplicate) {
            return { success: false, synced: false, error: 'duplicate_local' };
        }
        
        // Adiciona timestamp para controle
        const dataWithTimestamp = {
            ...submissionData,
            localTimestamp: Date.now()
        };
        
        localResults.push(dataWithTimestamp);
        localStorage.setItem('pending_results', JSON.stringify(localResults));
        
        return { success: true, synced: false, error: 'offline' };
        
    } catch (error) {
        console.error('Erro ao salvar offline:', error);
        return { success: false, synced: false, error: 'storage_failed' };
    }
}

/**
 * NOVA FUNÇÃO: Remove submissão dos dados pendentes
 */
function removeFromPendingResults(submissionData) {
    try {
        const localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');
        const filtered = localResults.filter(result => 
            !(result.studentId === submissionData.studentId && 
              result.assessmentId === submissionData.assessmentId)
        );
        localStorage.setItem('pending_results', JSON.stringify(filtered));
    } catch (error) {
        console.error('Erro ao limpar dados pendentes:', error);
    }
}

// ===================================================================================
// FUNÇÕES PARA O PAINEL DO PROFESSOR - CORRIGIDAS
// ===================================================================================

/**
 * Busca todos os resultados com melhor tratamento de erros.
 * @returns {Promise<Array>} - Lista de todas as submissões com detalhes.
 */
export async function getAllSubmissionsForDashboard() {
    if (!supabaseClient) {
        console.warn('Modo offline: retornando submissões locais');
        return getLocalSubmissions();
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('submissions')
            .select(`
                id,
                student_id,
                assessment_id,
                score,
                total_questions,
                total_duration_seconds,
                submitted_at,
                students (
                    id,
                    full_name
                ),
                assessments (
                    id,
                    title
                )
            `)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        
        // CORREÇÃO: Filtra dados inválidos
        const validSubmissions = (data || []).filter(submission => 
            submission.students && 
            submission.assessments && 
            submission.students.full_name &&
            submission.assessments.title
        );
        
        return validSubmissions;
        
    } catch (error) {
        console.error("Erro ao buscar submissões:", error.message);
        return getLocalSubmissions();
    }
}

/**
 * NOVA FUNÇÃO: Busca submissões locais para modo offline
 */
function getLocalSubmissions() {
    try {
        const localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');
        
        return localResults.map((result, index) => ({
            id: `local-${index}`,
            student_id: result.studentId,
            assessment_id: result.assessmentId,
            score: result.score,
            total_questions: result.totalQuestions,
            total_duration_seconds: result.totalDuration,
            submitted_at: new Date(result.localTimestamp || Date.now()).toISOString(),
            students: {
                id: result.studentId,
                full_name: `Aluno Local ${index + 1}`
            },
            assessments: {
                id: result.assessmentId,
                title: 'Avaliação Local'
            }
        }));
    } catch (error) {
        console.error('Erro ao carregar submissões locais:', error);
        return [];
    }
}

/**
 * Busca os detalhes das respostas de uma submissão específica.
 * @param {string} submissionId - O ID da submissão.
 * @returns {Promise<Array>} - Lista de respostas detalhadas.
 */
export async function getSubmissionAnswers(submissionId) {
    if (!supabaseClient || submissionId.startsWith('local-')) {
        console.warn('Modo offline ou submissão local: retornando respostas mock');
        return createMockAnswers(submissionId);
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('submission_answers')
            .select(`
                id,
                question_id,
                is_correct,
                duration_seconds,
                questions (
                    question_text
                )
            `)
            .eq('submission_id', submissionId);
            
        if (error) throw error;
        
        return data || [];
        
    } catch (error) {
        console.error("Erro ao buscar respostas da submissão:", error.message);
        return createMockAnswers(submissionId);
    }
}

/**
 * NOVA FUNÇÃO: Cria respostas mock para submissões locais
 */
function createMockAnswers(submissionId) {
    return [
        {
            id: `mock-answer-1-${submissionId}`,
            question_id: 'mock-question-1',
            is_correct: true,
            duration_seconds: 30,
            questions: {
                question_text: 'Questão exemplo 1'
            }
        },
        {
            id: `mock-answer-2-${submissionId}`,
            question_id: 'mock-question-2',
            is_correct: false,
            duration_seconds: 45,
            questions: {
                question_text: 'Questão exemplo 2'
            }
        }
    ];
}

// ===================================================================================
// NOVAS FUNÇÕES: UTILITÁRIOS E SINCRONIZAÇÃO
// ===================================================================================

/**
 * NOVA FUNÇÃO: Sincroniza todos os dados pendentes
 */
export async function syncPendingSubmissions() {
    if (!supabaseClient) {
        return { success: false, error: 'offline_mode' };
    }
    
    try {
        const localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');
        
        if (localResults.length === 0) {
            return { success: true, synced: 0, errors: [] };
        }
        
        let syncedCount = 0;
        const errors = [];
        
        for (const result of localResults) {
            try {
                const syncResult = await saveSubmission(result);
                if (syncResult.success && syncResult.synced) {
                    syncedCount++;
                }
            } catch (error) {
                errors.push({
                    studentId: result.studentId,
                    error: error.message
                });
            }
        }
        
        return {
            success: true,
            synced: syncedCount,
            total: localResults.length,
            errors
        };
        
    } catch (error) {
        console.error('Erro na sincronização:', error);
        return { success: false, error: error.message };
    }
}

/**
 * NOVA FUNÇÃO: Limpa dados locais antigos
 */
export function cleanOldLocalData(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 dias
    try {
        const localResults = JSON.parse(localStorage.getItem('pending_results') || '[]');
        const now = Date.now();
        
        const filtered = localResults.filter(result => {
            const age = now - (result.localTimestamp || 0);
            return age < maxAge;
        });
        
        localStorage.setItem('pending_results', JSON.stringify(filtered));
        
        return {
            removed: localResults.length - filtered.length,
            remaining: filtered.length
        };
        
    } catch (error) {
        console.error('Erro ao limpar dados antigos:', error);
        return { removed: 0, remaining: 0 };
    }
}