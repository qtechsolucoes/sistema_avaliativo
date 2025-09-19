// src/env.js

// Este objeto irá carregar as variáveis do seu arquivo .env
// Em um projeto real com um build tool como Vite, isso seria `import.meta.env`.
// Para simplificar e não exigir um build tool, vamos defini-las aqui,
// mas a ideia é que este arquivo NUNCA seja enviado para o Git.
export const env = {
    SUPABASE_URL: 'https://vvpzwypeydzpwyrpvqcf.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cHp3eXBleWR6cHd5cnB2cWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTgyMzIsImV4cCI6MjA3Mzc3NDIzMn0.gHDGSdIKuKUGeYazg247fRhFxGB0_NLhsKXwNQz84Cg',
    ADMIN_PASSWORD: 'admin123',
    UNLOCK_PASSWORD: 'unlock123'
};