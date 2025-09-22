// src/services/supabaseClient.js - Cliente Supabase isolado
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

let supabaseClient = null;

export function initializeSupabase() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('⚠️ Credenciais do Supabase não encontradas - modo offline');
        return null;
    }

    // Valida se as credenciais não são placeholders
    if (SUPABASE_URL.includes('sua-url-do-supabase') ||
        SUPABASE_URL === 'https://seu-projeto.supabase.co' ||
        SUPABASE_ANON_KEY.length < 50) {
        console.warn('⚠️ Credenciais do Supabase são placeholders - modo offline');
        return null;
    }

    try {
        // Verifica se o Supabase JS está disponível
        if (typeof window === 'undefined' || !window.supabase) {
            console.error('❌ Biblioteca do Supabase não carregada');
            return null;
        }

        const { createClient } = window.supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true, // Habilita sessão para passar RLS
                autoRefreshToken: true, // Mantém token válido
                storage: window.localStorage, // Usar localStorage para persistir
                storageKey: 'sb-sistema-avaliativo-auth-token'
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'X-Client-Info': 'sistema-avaliativo@2.0.1'
                }
            }
        });

        console.log('✅ Supabase inicializado com sucesso:', {
            url: SUPABASE_URL,
            keyLength: SUPABASE_ANON_KEY.length
        });

        // Inicializa sessão anônima se não houver usuário
        // COMENTADO: Sistema funciona perfeitamente com Security Definer nas funções RPC
        // initializeAnonymousSession(supabaseClient);

        return supabaseClient;
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        return null;
    }
}

export function getSupabaseClient() {
    if (!supabaseClient) {
        supabaseClient = initializeSupabase();
    }
    return supabaseClient;
}

export function isSupabaseAvailable() {
    return getSupabaseClient() !== null;
}

/**
 * Testa a conectividade com o Supabase
 * @returns {Promise<boolean>}
 */
export async function testSupabaseConnection() {
    const client = getSupabaseClient();

    if (!client) {
        console.log('🔌 Supabase não inicializado - usando modo offline');
        return false;
    }

    try {
        console.log('🔌 Testando conexão com Supabase...');

        // Testa uma consulta simples
        const { data, error } = await client
            .from('academic_periods')
            .select('id')
            .limit(1);

        if (error) {
            console.warn('⚠️ Erro ao testar conexão Supabase:', error.message);
            return false;
        }

        console.log('✅ Conexão com Supabase funcionando');
        return true;

    } catch (error) {
        console.warn('⚠️ Falha na conexão com Supabase:', error.message);
        return false;
    }
}

/**
 * Força reinicialização do cliente Supabase
 */
/**
 * Inicializa sessão anônima para permitir operações com RLS
 */
async function initializeAnonymousSession(client) {
    try {
        const { data: session } = await client.auth.getSession();

        if (!session?.session) {
            console.log('🔐 Criando sessão anônima para RLS...');

            // Tenta autenticação anônima (se habilitada no Supabase)
            const { data: anonData, error } = await client.auth.signInAnonymously();

            if (error) {
                console.warn('⚠️ Autenticação anônima falhou:', error.message);
                console.log('💡 Sugestão: Habilite autenticação anônima no Supabase ou desabilite RLS');
                console.log('📌 Sistema continuará funcionando, mas algumas operações podem falhar');
                // Não retorna erro - permite que o sistema continue
                return false; // Indica que autenticação falhou, mas sistema pode continuar
            } else {
                console.log('✅ Sessão anônima criada com sucesso');
                return true; // Indica que autenticação foi bem-sucedida
            }
        } else {
            console.log('✅ Sessão existente encontrada');
        }
    } catch (error) {
        console.warn('⚠️ Erro ao inicializar sessão anônima:', error.message);
    }
}

export function reinitializeSupabase() {
    supabaseClient = null;
    return initializeSupabase();
}