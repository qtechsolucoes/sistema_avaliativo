// src/services/dataService.js - Serviço de dados unificado

import { getSupabaseClient, isSupabaseAvailable, testSupabaseConnection } from './supabaseClient.js';
import { mockDataService } from './mockDataService.js';
import { logService } from './logService.js';

/**
 * Serviço de dados online (Supabase)
 */
class OnlineDataService {
    constructor(client) {
        this.client = client;
        this.isConnected = false;
    }

    async ensureConnection() {
        if (!this.isConnected) {
            this.isConnected = await testSupabaseConnection();
        }
        return this.isConnected;
    }

    async getClassesByGrade(grade, periodName = "3º Bimestre", year = 2025) {
        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou, usando dados mock para turmas');
            return mockDataService.getClassesByGrade(grade);
        }

        try {
            logService.info('Buscando turmas no Supabase', { grade, periodName, year });

            // Busca período acadêmico
            const { data: period, error: periodError } = await this.client
                .from('academic_periods')
                .select('id')
                .eq('year', year)
                .eq('name', periodName)
                .maybeSingle();

            if (periodError) {
                logService.warn('Erro ao buscar período acadêmico', periodError);
                return mockDataService.getClassesByGrade(grade);
            }

            if (!period) {
                logService.warn('Período acadêmico não encontrado', { year, periodName });
                return mockDataService.getClassesByGrade(grade);
            }

            // Busca turmas
            const { data: classes, error } = await this.client
                .from('classes')
                .select('id, name')
                .eq('grade', grade)
                .eq('academic_period_id', period.id)
                .order('name');

            if (error) {
                logService.error('Erro ao buscar turmas', error);
                return mockDataService.getClassesByGrade(grade);
            }

            logService.info(`Encontradas ${classes?.length || 0} turmas no Supabase`);
            return classes?.length > 0 ? classes : mockDataService.getClassesByGrade(grade);

        } catch (error) {
            logService.error('Falha crítica ao buscar turmas', error);
            return mockDataService.getClassesByGrade(grade);
        }
    }

    async getStudentsByClass(classId) {
        // Verifica se o modo mock foi forçado para testes
        if (localStorage.getItem('forceMockData') === 'true') {
            logService.info('🧪 MODO MOCK FORÇADO - Usando dados de teste com adaptações');
            return mockDataService.getStudentsByClass(classId);
        }

        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou, usando dados mock para estudantes');
            return mockDataService.getStudentsByClass(classId);
        }

        try {
            logService.info('Buscando estudantes no Supabase', { classId });

            // Primeira tentativa: consulta com join explícito
            let { data: enrollments, error } = await this.client
                .from('class_enrollments')
                .select(`
                    student_id,
                    students:student_id (
                        id,
                        full_name,
                        adaptation_details
                    )
                `)
                .eq('class_id', classId);

            // Se houver erro na primeira consulta, tenta formato alternativo
            if (error) {
                logService.warn('Primeira consulta falhou, tentando formato alternativo:', error);

                const alternativeQuery = await this.client
                    .from('class_enrollments')
                    .select(`
                        students (
                            id,
                            full_name,
                            adaptation_details
                        )
                    `)
                    .eq('class_id', classId);

                enrollments = alternativeQuery.data;
                error = alternativeQuery.error;
            }

            if (error) {
                logService.error('Todas as consultas de estudantes falharam', error);
                return mockDataService.getStudentsByClass(classId);
            }

            // Debug: mostra os dados brutos
            logService.debug('Dados brutos dos enrollments:', enrollments);
            logService.debug('Número de enrollments retornados:', enrollments?.length || 0);

            // Debug adicional: mostra estrutura detalhada
            if (enrollments && enrollments.length > 0) {
                logService.debug('Primeiro enrollment completo:', JSON.stringify(enrollments[0], null, 2));
                logService.debug('Tipos de dados no primeiro enrollment:', {
                    type: typeof enrollments[0],
                    keys: Object.keys(enrollments[0] || {}),
                    hasStudents: 'students' in (enrollments[0] || {}),
                    studentsType: typeof enrollments[0]?.students,
                    studentsContent: enrollments[0]?.students
                });
            }

            // Verifica se há dados válidos
            if (!enrollments || enrollments.length === 0) {
                logService.warn('Nenhum enrollment encontrado para a turma', { classId });
                return mockDataService.getStudentsByClass(classId);
            }

            // Transforma os dados para o formato esperado com validação robusta
            const students = [];

            enrollments.forEach((enrollment, index) => {
                logService.debug(`Processando enrollment ${index + 1}:`, enrollment);

                // Verifica se o enrollment tem dados de estudante
                if (!enrollment || !enrollment.students) {
                    logService.warn(`Enrollment ${index + 1} sem dados de estudante:`, enrollment);
                    return; // Pula este enrollment
                }

                const studentData = enrollment.students;
                logService.debug('Dados do estudante extraídos:', studentData);

                // Verifica se os campos necessários estão presentes
                if (!studentData.id) {
                    logService.warn(`Estudante sem ID no enrollment ${index + 1}:`, studentData);
                    return; // Pula este estudante
                }

                if (!studentData.full_name) {
                    logService.warn(`Estudante sem full_name no enrollment ${index + 1}:`, studentData);
                    // Continua mesmo sem nome, usando placeholder
                }

                const student = {
                    id: studentData.id,
                    name: studentData.full_name || `Estudante ${studentData.id}`,
                    adaptation_details: studentData.adaptation_details,
                    special_needs: studentData.adaptation_details ? true : false
                };

                logService.debug(`Estudante processado:`, student);
                students.push(student);
            });

            // Ordena por nome
            students.sort((a, b) => a.name?.localeCompare(b.name) || 0);

            logService.info(`Encontrados ${students?.length || 0} estudantes no Supabase`);

            // Log forçado para debug (sempre aparece)
            console.log('🔍 ESTRUTURA DOS ESTUDANTES PROCESSADOS:');
            students.forEach((student, index) => {
                if (index < 3) { // Mostra apenas os 3 primeiros
                    console.log(`Estudante ${index + 1}:`, {
                        id: student.id,
                        name: student.name,
                        nameType: typeof student.name,
                        nameValue: JSON.stringify(student.name),
                        adaptation_details: student.adaptation_details,
                        special_needs: student.special_needs
                    });
                }
            });

            // Salva lista de estudantes para uso no bloqueio
            if (students?.length > 0) {
                sessionStorage.setItem(`students_${classId}`, JSON.stringify(students));
                return students;
            } else {
                return mockDataService.getStudentsByClass(classId);
            }

        } catch (error) {
            logService.error('Falha crítica ao buscar estudantes', error);
            return mockDataService.getStudentsByClass(classId);
        }
    }

    async getAssessmentData(grade, disciplineName = 'Artes', periodName = '3º Bimestre', year = 2025) {
        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou, usando dados mock para avaliação');
            return mockDataService.getAssessmentData(grade, disciplineName);
        }

        try {
            logService.info('Buscando avaliação no Supabase', { grade, disciplineName, periodName, year });

            // Usa RPC function se disponível
            const { data: assessment, error: rpcError } = await this.client
                .rpc('get_assessment_by_details', {
                    p_grade: grade,
                    p_discipline_name: disciplineName,
                    p_period_name: periodName,
                    p_year: year
                })
                .maybeSingle();

            if (rpcError) {
                logService.warn('Erro na busca RPC de avaliação', rpcError);
                return mockDataService.getAssessmentData(grade, disciplineName);
            }

            if (!assessment) {
                logService.warn('Avaliação não encontrada via RPC', { grade, disciplineName });
                return mockDataService.getAssessmentData(grade, disciplineName);
            }

            // Busca detalhes completos da avaliação conforme schema real
            const { data: assessmentData, error: queryError } = await this.client
                .from('assessments')
                .select(`
                    id,
                    title,
                    base_text,
                    assessment_questions!inner (
                        question_order,
                        questions!inner (
                            id,
                            question_text,
                            options
                        )
                    )
                `)
                .eq('id', assessment.id)
                .single();

            if (queryError) {
                logService.error('Erro ao buscar detalhes da avaliação', queryError);
                return mockDataService.getAssessmentData(grade, disciplineName);
            }

            // Processa questões conforme schema real
            const allQuestions = (assessmentData.assessment_questions || [])
                .map(aq => ({
                    ...aq.questions,
                    order: aq.question_order
                }))
                .filter(q => q && q.id && q.question_text)
                .map(q => this.processQuestionOptions(q));

            if (allQuestions.length === 0) {
                logService.warn('Nenhuma questão válida encontrada', { assessmentId: assessment.id });
                return mockDataService.getAssessmentData(grade, disciplineName);
            }

            // Seleciona 10 questões aleatórias (ou todas se houver menos de 10)
            const selectedQuestions = this.selectRandomQuestions(allQuestions, 10);

            logService.info(`Avaliação com ${allQuestions.length} questões disponíveis - ${selectedQuestions.length} questões selecionadas aleatoriamente`);
            return {
                id: assessmentData.id,
                title: assessmentData.title,
                baseText: assessmentData.base_text || 'Texto de apoio não disponível.',
                questions: selectedQuestions
            };

        } catch (error) {
            logService.error('Falha crítica ao buscar avaliação', error);
            return mockDataService.getAssessmentData(grade, disciplineName);
        }
    }

    /**
     * Seleciona N questões aleatórias de um array
     * Usa algoritmo Fisher-Yates para garantir aleatoriedade justa
     * @param {Array} questions - Array de questões
     * @param {number} count - Número de questões a selecionar
     * @returns {Array} - Array com questões selecionadas aleatoriamente
     */
    selectRandomQuestions(questions, count) {
        // Se houver menos questões que o solicitado, retorna todas
        if (questions.length <= count) {
            logService.info(`Total de questões (${questions.length}) <= solicitado (${count}), retornando todas`);
            return [...questions];
        }

        // Cria cópia do array para não modificar o original
        const shuffled = [...questions];

        // Algoritmo Fisher-Yates para embaralhar
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Retorna apenas as N primeiras questões embaralhadas
        const selected = shuffled.slice(0, count);

        logService.info(`Selecionadas ${selected.length} questões aleatórias de ${questions.length} disponíveis`);
        return selected;
    }

    processQuestionOptions(question) {
        let options = [];
        try {
            options = typeof question.options === 'string'
                ? JSON.parse(question.options)
                : (question.options || []);

            if (!Array.isArray(options)) {
                throw new Error('Options não é um array');
            }

            // Verifica se há opção correta
            const hasCorrectOption = options.some(opt => opt.isCorrect === true);
            if (!hasCorrectOption && options.length > 0) {
                options[0].isCorrect = true;
                logService.warn('Questão sem resposta correta, primeira opção marcada como correta', {
                    questionId: question.id
                });
            }

        } catch (error) {
            logService.error('Erro ao processar opções da questão', { questionId: question.id, error });
            options = [
                { text: 'Erro ao carregar opções', isCorrect: true },
                { text: 'Questão inválida', isCorrect: false }
            ];
        }

        return {
            ...question,
            options
        };
    }

    async saveSubmission(submissionData) {
        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou, salvando localmente');
            return this.saveOffline(submissionData);
        }

        try {
            logService.info('Salvando submissão no Supabase', {
                studentId: submissionData.studentId,
                assessmentId: submissionData.assessmentId
            });

            // Estratégia 1: Tentar RPC primeiro (mais provável de funcionar com RLS)
            let error = null;

            try {
                logService.debug('Tentando submissão via RPC submit_assessment');

                const rpcResult = await this.client.rpc('submit_assessment', {
                    p_student_id: submissionData.studentId,
                    p_assessment_id: submissionData.assessmentId,
                    p_score: submissionData.score,
                    p_total_questions: submissionData.totalQuestions,
                    p_total_duration: submissionData.totalDuration,
                    p_answers: submissionData.answerLog
                });

                if (!rpcResult.error) {
                    logService.info('Submissão salva com sucesso via RPC');
                    return { success: true, synced: true, method: 'rpc' };
                }

                error = rpcResult.error;
                logService.warn('RPC falhou, tentando inserção direta:', error);

            } catch (rpcError) {
                error = rpcError;
                logService.warn('Erro na chamada RPC:', rpcError);
            }

            // Estratégia 2: Não usar inserção direta - schema requer uso da função RPC
            // A tabela submissions não tem coluna answers, as respostas vão para submission_answers
            // Apenas a função submit_assessment pode fazer isso corretamente

            logService.info('Inserção direta não disponível - schema requer uso de RPC submit_assessment');
            error = rpcResult.error;

            // Análise do erro
            if (error.code === 'P0001') {
                // Erro personalizado da função RPC para submissão duplicada
                logService.warn('Tentativa de submissão duplicada bloqueada pelo banco', {
                    studentId: submissionData.studentId
                });
                return { success: true, synced: true, error: 'duplicate' };
            }

            if (error.code === '42501' || error.status === 401 ||
                error.message?.includes('RLS') || error.message?.includes('permission')) {
                // Erro de RLS/Autenticação - Problema de configuração do Supabase
                logService.error('ERRO RLS/Auth: Função submit_assessment sem permissão', {
                    studentId: submissionData.studentId,
                    error: error.message,
                    code: error.code,
                    status: error.status
                });

                console.error('🚨 CONFIGURAÇÃO NECESSÁRIA NO SUPABASE:');
                console.error('1️⃣ Habilitar autenticação anônima em Authentication > Settings');
                console.error('2️⃣ OU configurar RLS adequado para função submit_assessment');
                console.error('3️⃣ OU desabilitar RLS temporariamente: ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;');

                return this.saveOfflineWithWarning(submissionData);
            }

            throw error;

        } catch (error) {
            logService.error('Erro ao salvar submissão no Supabase', error);
            return this.saveOffline(submissionData);
        }
    }

    async tryAnonymousAuthAndRetry(submissionData) {
        try {
            logService.info('Tentando autenticação anônima para resolver RLS...');

            // Tenta reinicializar autenticação anônima
            const { initializeAnonymousSession } = await import('./supabaseClient.js');
            const authSuccess = await initializeAnonymousSession(this.client);

            if (!authSuccess) {
                logService.warn('Autenticação anônima falhou - não é possível resolver RLS');
                return { success: false };
            }

            // Retry da submissão após autenticação
            logService.info('Tentando submissão novamente após autenticação anônima...');

            const submissionRecord = {
                student_id: submissionData.studentId,
                assessment_id: submissionData.assessmentId,
                score: submissionData.score,
                total_questions: submissionData.totalQuestions,
                total_duration_seconds: submissionData.totalDuration,
                answers: submissionData.answerLog,
                submitted_at: new Date().toISOString()
            };

            const retryResult = await this.client
                .from('submissions')
                .insert(submissionRecord);

            if (!retryResult.error) {
                logService.info('✅ Submissão bem-sucedida após autenticação anônima!');
                return { success: true, synced: true, method: 'auth_retry' };
            } else {
                logService.error('Retry após autenticação também falhou:', retryResult.error);
                return { success: false };
            }

        } catch (error) {
            logService.error('Erro durante tentativa de autenticação e retry:', error);
            return { success: false };
        }
    }

    saveOffline(submissionData) {
        // Implementa salvamento offline como fallback
        return mockDataService.saveSubmission(submissionData);
    }

    saveOfflineWithWarning(submissionData) {
        // Salva offline mas marca como sistema comprometido
        const result = mockDataService.saveSubmission(submissionData);
        result.systemCompromised = true;
        result.rlsError = true;
        result.message = 'Submissão salva apenas localmente devido a erro RLS - dados não centralizados';

        // Exibe notificação crítica para o usuário
        this.showRLSWarning();

        return result;
    }

    showRLSWarning() {
        // Cria notificação crítica visível para o usuário
        const warning = document.createElement('div');
        warning.id = 'rls-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #dc2626;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            z-index: 9999;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
            max-width: 90vw;
            text-align: center;
        `;
        warning.innerHTML = `
            🚨 ATENÇÃO: Dados não estão sendo centralizados!<br>
            <small style="font-weight: normal; opacity: 0.9;">
                Configure autenticação no Supabase ou desabilite RLS
            </small>
        `;

        // Remove warning anterior se existir
        const existing = document.getElementById('rls-warning');
        if (existing) existing.remove();

        document.body.appendChild(warning);

        // Remove após 10 segundos
        setTimeout(() => {
            if (warning.parentNode) warning.remove();
        }, 10000);
    }

    async tryAnonymousAuthAndRetry(submissionData) {
        try {
            logService.info('Tentando autenticação anônima para bypass RLS');

            // Força nova sessão anônima
            const { data, error } = await this.client.auth.signInAnonymously();

            if (error) {
                logService.warn('Autenticação anônima falhou:', error);
                return { success: false };
            }

            logService.info('Sessão anônima criada, tentando submissão novamente');

            // Retry com nova sessão
            const rpcResult = await this.client.rpc('submit_assessment', {
                p_student_id: submissionData.studentId,
                p_assessment_id: submissionData.assessmentId,
                p_score: submissionData.score,
                p_total_questions: submissionData.totalQuestions,
                p_total_duration: submissionData.totalDuration,
                p_answers: submissionData.answerLog
            });

            if (!rpcResult.error) {
                logService.info('Submissão salva com sucesso após autenticação anônima');
                return { success: true, synced: true, method: 'anonymous-auth' };
            }

            logService.warn('Submissão ainda falhou após autenticação anônima:', rpcResult.error);
            return { success: false };

        } catch (error) {
            logService.error('Erro na tentativa de autenticação anônima:', error);
            return { success: false };
        }
    }

    async getCompletedSubmissions(classId) {
        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou - sistema centralizado requer Supabase');
            console.warn('⚠️ Sistema centralizado: Sem Supabase, nenhum estudante será bloqueado');
            return [];
        }

        try {
            logService.info('Buscando submissões completadas APENAS no Supabase (fonte única)', { classId });

            // Busca submissões de estudantes desta turma
            // Primeiro, busca IDs dos estudantes da turma
            const { data: enrollments, error: enrollError } = await this.client
                .from('class_enrollments')
                .select('student_id')
                .eq('class_id', classId);

            if (enrollError) {
                logService.error('Erro ao buscar enrollments para submissões', enrollError);
                return [];
            }

            if (!enrollments || enrollments.length === 0) {
                logService.info('Nenhum estudante encontrado na turma');
                return [];
            }

            const studentIds = enrollments.map(e => e.student_id);

            // Agora busca submissões desses estudantes
            const { data: submissions, error } = await this.client
                .from('submissions')
                .select('student_id')
                .in('student_id', studentIds);

            if (error) {
                logService.error('Erro ao buscar submissões completadas', error);
                return [];
            }

            // Transforma os dados para o formato esperado
            const completedSubmissions = submissions?.map(s => ({
                studentId: s.student_id,
                source: 'supabase' // Marca origem dos dados
            })) || [];

            // Debug: Mostra IDs dos estudantes que completaram
            const completedIds = completedSubmissions.map(s => s.studentId);
            logService.info(`FONTE ÚNICA: ${completedSubmissions.length} submissões completadas no Supabase`);
            logService.debug('IDs bloqueados (apenas Supabase):', completedIds);

            console.log('🎯 SISTEMA CENTRALIZADO: Bloqueio baseado apenas em dados do Supabase');
            console.log(`📊 ${completedSubmissions.length} estudantes bloqueados pela fonte única`);

            // MUDANÇA CRÍTICA: Retorna APENAS dados do Supabase
            return completedSubmissions;

        } catch (error) {
            logService.error('Falha crítica ao buscar submissões completadas', error);
            return [];
        }
    }


    getLocalCompletedSubmissions(classId) {
        try {
            // Busca submissões locais
            const localSubmissions = JSON.parse(localStorage.getItem('localSubmissions') || '[]');
            const pendingResults = JSON.parse(localStorage.getItem('pending_results') || '[]');

            // Combina ambas as fontes locais
            const allLocalSubmissions = [...localSubmissions, ...pendingResults];

            // Filtra por turma (busca estudantes desta turma)
            const studentsInClass = JSON.parse(sessionStorage.getItem(`students_${classId}`) || '[]');
            const studentIdsInClass = new Set(studentsInClass.map(s => s.id));

            const completedLocal = allLocalSubmissions
                .filter(submission => studentIdsInClass.has(submission.studentId))
                .map(submission => ({ studentId: submission.studentId }));

            // Remove duplicatas
            const uniqueCompleted = completedLocal.filter((submission, index, arr) =>
                arr.findIndex(s => s.studentId === submission.studentId) === index
            );

            logService.info(`Encontradas ${uniqueCompleted.length} submissões locais completadas`);
            return uniqueCompleted;

        } catch (error) {
            logService.warn('Erro ao buscar submissões locais:', error);
            return [];
        }
    }

    async getAllSubmissionsForDashboard() {
        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou para dashboard - retornando array vazio');
            console.warn('⚠️ Dashboard só funcionará com dados do Supabase - verifique conexão');
            return [];
        }

        try {
            logService.info('Carregando todas as submissões para dashboard (apenas Supabase)');

            // Busca submissões com dados completos dos relacionamentos
            const { data: submissions, error } = await this.client
                .from('submissions')
                .select(`
                    id,
                    student_id,
                    assessment_id,
                    score,
                    total_questions,
                    total_duration_seconds,
                    submitted_at,
                    students!inner(
                        full_name,
                        class_enrollments!inner(
                            classes!inner(
                                name,
                                grade,
                                academic_periods!inner(
                                    name,
                                    year
                                )
                            )
                        )
                    ),
                    assessments!inner(
                        title,
                        disciplines!inner(name)
                    )
                `)
                .order('submitted_at', { ascending: false });

            if (error) {
                logService.error('Erro ao carregar submissões para dashboard:', error);
                return [];
            }

            if (!submissions || submissions.length === 0) {
                logService.info('Nenhuma submissão encontrada no Supabase para dashboard');
                return [];
            }

            // Transforma dados para formato esperado pelo dashboard
            const formattedSubmissions = submissions.map(submission => {
                // Pega a primeira classe (estudantes podem estar em múltiplas classes)
                const firstEnrollment = submission.students.class_enrollments?.[0];
                const classData = firstEnrollment?.classes;
                const academicPeriod = classData?.academic_periods;

                return {
                    id: submission.id,
                    student_id: submission.student_id,
                    student_name: submission.students.full_name,
                    student_class: classData?.name || 'Sem Turma',
                    student_grade: classData?.grade?.toString() || '0',
                    assessment_id: submission.assessment_id,
                    assessment_title: submission.assessments.title,
                    discipline_name: submission.assessments.disciplines?.name || 'N/A',
                    academic_period: academicPeriod?.name || 'N/A',
                    academic_year: academicPeriod?.year || new Date().getFullYear(),
                    score: submission.score,
                    total_questions: submission.total_questions,
                    percentage: Math.round((submission.score / submission.total_questions) * 100),
                    total_duration_seconds: submission.total_duration_seconds,
                    submitted_at: submission.submitted_at,
                    source: 'supabase' // Marca origem dos dados
                };
            });

            logService.info(`Dashboard carregado com ${formattedSubmissions.length} submissões do Supabase`);
            return formattedSubmissions;

        } catch (error) {
            logService.error('Erro crítico ao carregar submissões para dashboard:', error);
            return [];
        }
    }

    async getSubmissionAnswers(submissionId) {
        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou para respostas - retornando array vazio');
            return [];
        }

        try {
            logService.info('Carregando respostas da submissão:', submissionId);

            // Busca respostas com dados das questões
            // Nota: schema tem apenas question_id, is_correct, duration_seconds (sem selected_option)
            const { data: answers, error } = await this.client
                .from('submission_answers')
                .select(`
                    question_id,
                    is_correct,
                    duration_seconds,
                    questions!inner(
                        question_text
                    )
                `)
                .eq('submission_id', submissionId)
                .order('question_id');

            if (error) {
                logService.error('Erro ao carregar respostas da submissão:', error);
                return [];
            }

            logService.info(`Carregadas ${answers?.length || 0} respostas para submissão ${submissionId}`);
            return answers || [];

        } catch (error) {
            logService.error('Erro crítico ao carregar respostas:', error);
            return [];
        }
    }

    // ===================================================================================
    // FUNÇÕES PARA CONTEÚDO ADAPTATIVO
    // ===================================================================================

    async getAdaptiveSupportTexts(adaptationType, grade) {
        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou para textos adaptativos - usando mock');
            return this.getMockAdaptiveTexts(adaptationType, grade);
        }

        try {
            logService.info('Buscando textos de apoio adaptativos', { adaptationType, grade });

            const { data: texts, error } = await this.client
                .from('adaptive_support_texts')
                .select('*')
                .eq('adaptation_type', adaptationType)
                .eq('grade', grade)
                .order('created_at');

            if (error) {
                logService.error('Erro ao buscar textos adaptativos:', error);
                return this.getMockAdaptiveTexts(adaptationType, grade);
            }

            logService.info(`Encontrados ${texts?.length || 0} textos adaptativos`);
            return texts || [];

        } catch (error) {
            logService.error('Erro crítico ao buscar textos adaptativos:', error);
            return this.getMockAdaptiveTexts(adaptationType, grade);
        }
    }

    async getAdaptiveQuestions(adaptationType, grade) {
        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou para questões adaptativas - usando mock');
            return this.getMockAdaptiveQuestions(adaptationType, grade);
        }

        try {
            logService.info('Buscando questões adaptativas', { adaptationType, grade });

            const { data: questions, error } = await this.client
                .from('adaptive_questions')
                .select('*')
                .eq('adaptation_type', adaptationType)
                .eq('grade', grade)
                .order('created_at');

            if (error) {
                logService.error('Erro ao buscar questões adaptativas:', error);
                return this.getMockAdaptiveQuestions(adaptationType, grade);
            }

            // Processa as opções das questões
            const processedQuestions = (questions || []).map(q => ({
                ...q,
                options: this.processAdaptiveQuestionOptions(q.options)
            }));

            logService.info(`Encontradas ${processedQuestions.length} questões adaptativas`);
            return processedQuestions;

        } catch (error) {
            logService.error('Erro crítico ao buscar questões adaptativas:', error);
            return this.getMockAdaptiveQuestions(adaptationType, grade);
        }
    }

    async getAdaptiveGames(adaptationType, grade) {
        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou para jogos adaptativos - usando mock');
            return this.getMockAdaptiveGames(adaptationType, grade);
        }

        try {
            logService.info('Buscando jogos adaptativos', { adaptationType, grade });

            const { data: games, error } = await this.client
                .from('adaptive_games')
                .select('*')
                .eq('adaptation_type', adaptationType)
                .eq('grade', grade)
                .order('difficulty_level', { ascending: true });

            if (error) {
                logService.error('Erro ao buscar jogos adaptativos:', error);
                return this.getMockAdaptiveGames(adaptationType, grade);
            }

            logService.info(`Encontrados ${games?.length || 0} jogos adaptativos`);
            return games || [];

        } catch (error) {
            logService.error('Erro crítico ao buscar jogos adaptativos:', error);
            return this.getMockAdaptiveGames(adaptationType, grade);
        }
    }

    async getAdaptiveFeedback(adaptationType, feedbackType) {
        if (!(await this.ensureConnection())) {
            logService.warn('Conexão Supabase falhou para feedback adaptativo - usando mock');
            return this.getMockAdaptiveFeedback(adaptationType, feedbackType);
        }

        try {
            logService.info('Buscando feedback adaptativo', { adaptationType, feedbackType });

            const { data: feedback, error } = await this.client
                .from('adaptive_feedback')
                .select('*')
                .eq('adaptation_type', adaptationType)
                .eq('feedback_type', feedbackType);

            if (error) {
                logService.error('Erro ao buscar feedback adaptativo:', error);
                return this.getMockAdaptiveFeedback(adaptationType, feedbackType);
            }

            logService.info(`Encontrado feedback adaptativo: ${feedback?.length || 0} items`);
            return feedback || [];

        } catch (error) {
            logService.error('Erro crítico ao buscar feedback adaptativo:', error);
            return this.getMockAdaptiveFeedback(adaptationType, feedbackType);
        }
    }

    processAdaptiveQuestionOptions(options) {
        try {
            let processedOptions = [];

            if (typeof options === 'string') {
                processedOptions = JSON.parse(options);
            } else if (Array.isArray(options)) {
                processedOptions = options;
            } else {
                logService.warn('Formato de opções não reconhecido:', typeof options);
                return [
                    { text: 'Opção A', isCorrect: true },
                    { text: 'Opção B', isCorrect: false }
                ];
            }

            // Verifica se há pelo menos uma resposta correta
            const hasCorrectAnswer = processedOptions.some(opt => opt.isCorrect === true);
            if (!hasCorrectAnswer && processedOptions.length > 0) {
                processedOptions[0].isCorrect = true;
                logService.warn('Questão adaptativa sem resposta correta - primeira opção marcada como correta');
            }

            return processedOptions;

        } catch (error) {
            logService.error('Erro ao processar opções de questão adaptativa:', error);
            return [
                { text: 'Erro ao carregar opções', isCorrect: true },
                { text: 'Questão inválida', isCorrect: false }
            ];
        }
    }

    // ===================================================================================
    // DADOS MOCK PARA CONTEÚDO ADAPTATIVO (FALLBACK)
    // ===================================================================================

    getMockAdaptiveTexts(adaptationType, grade) {
        const mockTexts = {
            'tea': {
                6: [{
                    id: 'tea-6-1',
                    title: 'O que é Cultura?',
                    simplified_text: 'Cultura é tudo que as pessoas fazem juntas.\n\nExemplos de cultura:\n• Como cozinhamos\n• Como dançamos\n• Como falamos\n• Como nos vestimos\n\nCada grupo tem sua cultura.\nTodas as culturas são importantes.',
                    visual_elements: 'ícones: casa, comida, dança, roupa',
                    interaction_hints: 'Leia devagar, uma informação por vez'
                }]
            },
            'tdah': {
                6: [{
                    id: 'tdah-6-1',
                    title: 'Cultura em Ação!',
                    simplified_text: 'CULTURA = o que fazemos em grupo!\n\nFATOS RÁPIDOS:\n✓ Comida típica = cultura\n✓ Dança regional = cultura\n✓ Jeito de falar = cultura\n✓ Festas locais = cultura\n\nMISSÃO: Encontre exemplos de cultura ao seu redor!',
                    visual_elements: 'cores vibrantes, ícones energéticos',
                    interaction_hints: 'Tarefas rápidas, pausas para movimento'
                }]
            },
            'down': {
                6: [{
                    id: 'down-6-1',
                    title: 'Nossa Cultura é Linda!',
                    simplified_text: 'Cultura é como nossa família vive!\n\nNA NOSSA CASA:\n• Comida gostosa que mamãe faz\n• Música que papai gosta\n• Brincadeiras com irmãos\n• Festas com parentes\n\nCADA FAMÍLIA É ESPECIAL!\nSua cultura é importante e bonita!\n\nVocê faz parte da nossa cultura!',
                    visual_elements: 'fotos de família, cores alegres, corações',
                    interaction_hints: 'Reforço positivo, conexão pessoal'
                }]
            }
        };

        return mockTexts[adaptationType]?.[grade] || [];
    }

    getMockAdaptiveQuestions(adaptationType, grade) {
        const mockQuestions = {
            'tea': {
                6: [{
                    id: 'tea-q-6-1',
                    question_text: 'O que é cultura?',
                    options: [
                        { text: 'Tudo que as pessoas fazem juntas', isCorrect: true },
                        { text: 'Apenas leis do país', isCorrect: false }
                    ],
                    visual_aids: 'diagrama simples de conceitos',
                    difficulty_level: 1,
                    success_feedback: 'Correto! Cultura é o que fazemos em grupo.',
                    encouragement_feedback: 'Quase lá! Pense no que sua família faz junto.'
                }]
            },
            'tdah': {
                6: [{
                    id: 'tdah-q-6-1',
                    question_text: 'DESAFIO RÁPIDO: A sombrinha do frevo é que tipo de cultura?',
                    options: [
                        { text: 'Material (você pode tocar!)', isCorrect: true },
                        { text: 'Imaterial (não pode tocar)', isCorrect: false }
                    ],
                    visual_aids: 'gif de sombrinha do frevo',
                    difficulty_level: 2,
                    success_feedback: 'ACERTOU! A sombrinha é material!',
                    encouragement_feedback: 'Quase! Material = você pode pegar!'
                }]
            },
            'down': {
                9: [{
                    id: 'down-q-9-1',
                    question_text: 'Qual dança é rápida e usa instrumentos de sopro?',
                    options: [
                        { text: 'FREVO!', isCorrect: true },
                        { text: 'Ciranda', isCorrect: false }
                    ],
                    visual_aids: 'vídeos de dança, sons de instrumentos',
                    difficulty_level: 1,
                    success_feedback: 'PARABÉNS! Você é um expert em frevo!',
                    encouragement_feedback: 'Quase acertou! O frevo é bem rápido e animado!'
                }]
            }
        };

        return mockQuestions[adaptationType]?.[grade] || [];
    }

    getMockAdaptiveGames(adaptationType, grade) {
        const mockGames = {
            'down': {
                6: [{
                    id: 'down-game-6-1',
                    game_type: 'memory',
                    title: 'Jogo da Memória Cultural',
                    description: 'Encontre os pares entre cultura material e imaterial!',
                    content: 'Pares: Violão-Música, Panela-Receita, Fantasia-Dança, Livro-História',
                    instructions: 'Encontre os pares! Cada cultura material tem sua cultura imaterial.',
                    learning_objectives: 'Distinguir cultura material de imaterial, Desenvolver memória visual',
                    estimated_duration_minutes: 5,
                    difficulty_level: 1,
                    rewards: '3 estrelas, Badge: Detetive Cultural'
                }]
            },
            'tea': {
                8: [{
                    id: 'tea-game-8-1',
                    game_type: 'sequence',
                    title: 'Linha do Tempo Medieval',
                    description: 'Coloque os eventos da música medieval em ordem.',
                    content: 'Eventos: 1-Canto Gregoriano, 2-Trovadores, 3-Polifonia',
                    instructions: 'Arraste os eventos para a ordem correta na linha do tempo.',
                    learning_objectives: 'Compreender evolução musical medieval, Desenvolver sequência lógica',
                    estimated_duration_minutes: 4,
                    difficulty_level: 2,
                    rewards: 'Badge: Historiador Musical'
                }]
            },
            'tdah': {
                9: [{
                    id: 'tdah-game-9-1',
                    game_type: 'match',
                    title: 'Ritmos PE - Correspondência Turbo!',
                    description: 'Conecte cada ritmo com suas características rapidamente!',
                    content: 'FREVO: Rápido, Sombrinha, Sopros | MARACATU: Tambores, Cortejo, Reis | CIRANDA: Roda, Praia, Mãos dadas',
                    instructions: 'MISSÃO: Conecte o ritmo com suas características o mais rápido possível!',
                    learning_objectives: 'Identificar características dos ritmos, Desenvolver agilidade mental',
                    estimated_duration_minutes: 3,
                    difficulty_level: 2,
                    rewards: 'Bônus de velocidade, Ranks: Novato, Bom, Expert, Mestre PE'
                }]
            }
        };

        return mockGames[adaptationType]?.[grade] || [];
    }

    getMockAdaptiveFeedback(adaptationType, feedbackType) {
        const mockFeedback = {
            'tea': {
                'success': [{ content: 'Correto! Você entendeu.', visual_style: 'green_check', animation_type: 'simple_check' }],
                'encouragement': [{ content: 'Tente novamente. Você consegue.', visual_style: 'blue_support', animation_type: 'gentle_pulse' }]
            },
            'tdah': {
                'success': [{ content: 'ACERTOU! Você é rápido!', visual_style: 'orange_burst', animation_type: 'energetic_bounce' }],
                'celebration': [{ content: 'MISSÃO CUMPRIDA! Você é incrível!', visual_style: 'rainbow_confetti', animation_type: 'celebration_burst' }]
            },
            'down': {
                'success': [{ content: 'Parabéns! Você é muito inteligente!', visual_style: 'hearts_stars', animation_type: 'warm_celebration' }],
                'encouragement': [{ content: 'Muito bem! Continue tentando!', visual_style: 'smile_thumbs', animation_type: 'encouraging_bounce' }]
            }
        };

        return mockFeedback[adaptationType]?.[feedbackType] || [];
    }
}

/**
 * Serviço de dados offline (Mock)
 */
class OfflineDataService {
    async getClassesByGrade(grade) {
        logService.info('Usando dados mock para turmas (modo offline)');
        return mockDataService.getClassesByGrade(grade);
    }

    async getStudentsByClass(classId) {
        logService.info('Usando dados mock para estudantes (modo offline)');
        return mockDataService.getStudentsByClass(classId);
    }

    async getAssessmentData(grade, disciplineName) {
        logService.info('Usando dados mock para avaliação (modo offline)');
        return mockDataService.getAssessmentData(grade, disciplineName);
    }

    async saveSubmission(submissionData) {
        logService.info('Salvando submissão em modo offline');
        return mockDataService.saveSubmission(submissionData);
    }

    async getCompletedSubmissions(classId) {
        logService.info('Buscando submissões completadas em modo offline');
        // Em modo offline, não temos histórico de submissões
        return [];
    }
}

/**
 * Factory que retorna o serviço apropriado
 */
function createDataService() {
    if (isSupabaseAvailable()) {
        logService.info('Usando OnlineDataService (Supabase)');
        return new OnlineDataService(getSupabaseClient());
    } else {
        logService.info('Usando OfflineDataService (Mock)');
        return new OfflineDataService();
    }
}

// Exporta instância singleton
export const dataService = createDataService();

// Função para recriar o serviço (útil para reconexão)
export function recreateDataService() {
    return createDataService();
}