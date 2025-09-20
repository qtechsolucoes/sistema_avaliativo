// src/services/supabaseClient.js - Cliente Supabase isolado
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

let supabaseClient = null;

export function initializeSupabase() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || 
        SUPABASE_URL === 'https://seu-projeto.supabase.co') {
        console.warn('⚠️ Supabase não configurado - modo offline');
        return null;
    }
    
    try {
        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            },
            db: {
                schema: 'public'
            }
        });
        console.log('✅ Supabase inicializado');
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