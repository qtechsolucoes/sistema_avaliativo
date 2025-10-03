// src/config.js - CONFIGURAÇÃO SEGURA

/**
 * Sistema de configuração seguro
 * Usa variáveis de ambiente quando disponíveis, com fallbacks seguros
 */

// Função para obter variáveis de ambiente de forma segura
function getEnvVar(name, defaultValue = '') {
    // Primeiro, tenta localStorage (usado por setDevConfig)
    const localValue = localStorage.getItem(name);
    if (localValue) {
        return localValue;
    }

    // Em aplicações client-side, process.env não está disponível
    // Para desenvolvimento, usamos credenciais hardcoded temporariamente
    // Em produção, estas devem vir de variáveis de ambiente do servidor
    const envVars = {
        'SUPABASE_URL': 'https://vvpzwypeydzpwyrpvqcf.supabase.co',
        'SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cHp3eXBleWR6cHd5cnB2cWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTgyMzIsImV4cCI6MjA3Mzc3NDIzMn0.gHDGSdIKuKUGeYazg247fRhFxGB0_NLhsKXwNQz84Cg'
    };

    return envVars[name] || defaultValue;
}

// Configurações do Supabase
export const SUPABASE_URL = getEnvVar('SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY');

// Validação das configurações
export function validateConfig() {
    const errors = [];

    if (!SUPABASE_URL) {
        errors.push('SUPABASE_URL não está configurada');
    } else if (!SUPABASE_URL.startsWith('https://')) {
        errors.push('SUPABASE_URL deve usar HTTPS');
    }

    if (!SUPABASE_ANON_KEY) {
        errors.push('SUPABASE_ANON_KEY não está configurada');
    } else if (SUPABASE_ANON_KEY.length < 50) {
        errors.push('SUPABASE_ANON_KEY parece inválida (muito curta)');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings: []
    };
}

// Configuração de desenvolvimento (apenas para testes locais)
export function setDevConfig(url, key) {
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        localStorage.setItem('SUPABASE_URL', url);
        localStorage.setItem('SUPABASE_ANON_KEY', key);
        console.warn('⚠️ Configurações de desenvolvimento definidas. Recarregue a página para aplicar!');

        // Pergunta se quer recarregar
        if (confirm('Configurações salvas! Recarregar a página para aplicar as mudanças?')) {
            window.location.reload();
        }

        return true;
    }
    console.error('❌ Configurações de desenvolvimento só podem ser definidas em localhost/127.0.0.1');
    return false;
}

// Função de debug para verificar configuração
export function debugConfig() {
    const currentUrl = getEnvVar('SUPABASE_URL');
    const currentKey = getEnvVar('SUPABASE_ANON_KEY');

    console.log('🔍 Debug da Configuração:');
    console.log('  URL do localStorage:', localStorage.getItem('SUPABASE_URL'));
    console.log('  Key do localStorage:', localStorage.getItem('SUPABASE_ANON_KEY'));
    console.log('  URL atual:', currentUrl);
    console.log('  Key atual:', currentKey ? `${currentKey.substring(0, 20)}...` : 'NÃO DEFINIDA');

    const validation = validateConfig();
    console.log('  Validação:', validation);

    return {
        url: currentUrl,
        keyLength: currentKey?.length || 0,
        validation,
        hasLocalStorage: !!localStorage.getItem('SUPABASE_URL')
    };
}

// Disponibiliza funções globalmente para debug
if (typeof window !== 'undefined') {
    window.setDevConfig = setDevConfig;
    window.debugConfig = debugConfig;

    // Adiciona comando de configuração rápida
    window.configSupabase = () => {
        console.log('🔧 Para configurar o Supabase, execute:');
        console.log('setDevConfig("https://sua-url.supabase.co", "sua-chave-aqui")');
        console.log('');
        console.log('📋 Para usar as credenciais do exemplo:');
        console.log('setDevConfig("https://vvpzwypeydzpwyrpvqcf.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cHp3eXBleWR6cHd5cnB2cWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTgyMzIsImV4cCI6MjA3Mzc3NDIzMn0.gHDGSdIKuKUGeYazg247fRhFxGB0_NLhsKXwNQz84Cg")');
    };

    // Adiciona função para ativar debug facilmente
    window.enableDebug = () => {
        localStorage.setItem('debugMode', 'true');
        console.log('🐛 Debug mode ativado! Recarregue a página para ver os logs detalhados.');
        if (confirm('Debug ativado! Recarregar a página?')) {
            window.location.reload();
        }
    };
}

// Log seguro de configuração (sem expor credenciais)
const validation = validateConfig();
console.log('✅ Config carregado:', {
    url: SUPABASE_URL ? '✓ Configurado' : '❌ NÃO CONFIGURADO',
    key: SUPABASE_ANON_KEY ? '✓ Configurado' : '❌ NÃO CONFIGURADO',
    isValid: validation.isValid,
    errors: validation.errors
});

if (!validation.isValid) {
    console.error('❌ Configuração inválida:', validation.errors);
    console.log('💡 Para configurar, use: configSupabase() no console');
}

// Log das funções disponíveis
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.log('🛠️ Funções de debug disponíveis:');
    console.log('  - configSupabase() - Mostra como configurar');
    console.log('  - debugConfig() - Mostra status atual');
    console.log('  - setDevConfig(url, key) - Define credenciais');
    console.log('  - testDB() - Testa integração completa do banco');
    console.log('  - testConnection() - Testa conectividade básica');
}