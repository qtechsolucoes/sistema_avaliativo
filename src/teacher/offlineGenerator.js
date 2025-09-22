// src/teacher/offlineGenerator.js - VERSÃO CORRIGIDA E ROBUSTA

import { getDataForOfflineFile } from '../database.js';
import { logService } from '../services/logService.js';

// Ordem correta de "compilação" dos scripts para o modo offline.
// Arquivos sem dependências vêm primeiro.
const SCRIPT_LOAD_ORDER = [
    'src/services/logService.js',
    'src/state.js',
    'src/navigation.js',
    'src/utils/validators.js',
    'src/services/supabaseClient.js', // Precisa ser definido antes do database
    'src/services/mockDataService.js',
    'src/database.js',
    'src/services/cacheService.js',
    'src/services/classService.js',
    'src/services/studentService.js',
    'src/ui.js',
    'src/quiz.js',
    'src/adaptation.js',
    'src/login.js',
    'src/teacher/teacherAuth.js',
    'src/teacher/dataSync.js',
    'src/teacher/dashboard/dashboardData.js',
    'src/teacher/dashboard/dashboardCharts.js',
    'src/teacher/dashboard/dashboardTable.js',
    'src/teacher/dashboard/dashboardFilters.js',
    'src/teacher/dashboard/index.js',
    'src/teacher/index.js',
    'src/utils/errorHandler.js',
    'src/main.js' // Main.js por último, pois ele inicializa tudo
];

export async function generateOfflineFile(statusElement, buttonElement) {
    if (!confirm("Esta operação irá gerar um arquivo HTML completo para uso offline. Deseja continuar?")) {
        return;
    }
    const generator = new OfflineFileGenerator(statusElement, buttonElement);
    await generator.generate();
}

class OfflineFileGenerator {
    constructor(statusElement, buttonElement) {
        this.statusElement = statusElement;
        this.buttonElement = buttonElement;
    }

    async generate() {
        this.buttonElement.disabled = true;
        this.updateStatus('Iniciando...', '#64748b');

        try {
            // 1. Buscar todos os dados do banco
            this.updateStatus('Coletando dados do servidor...');
            const serverData = await getDataForOfflineFile();

            // 2. Buscar todos os templates (HTML, CSS, JS)
            this.updateStatus('Carregando arquivos da aplicação...');
            const templates = await this.loadTemplates();

            // 3. Juntar tudo em um único arquivo HTML
            this.updateStatus('Compilando arquivo final...');
            const finalHTML = this.buildFinalHTML(templates, serverData);

            // 4. Iniciar o download
            this.downloadFile(finalHTML);
            this.showSuccess(serverData);

        } catch (error) {
            this.showError(error);
            logService.critical('Falha ao gerar arquivo offline.', { error });
        } finally {
            this.buttonElement.disabled = false;
            setTimeout(() => this.clearStatus(), 7000);
        }
    }

    async loadTemplates() {
        // Carrega o conteúdo de todos os arquivos JS em paralelo
        const scriptPromises = SCRIPT_LOAD_ORDER.map(path =>
            fetch(`/${path}`)
            .then(res => {
                if (!res.ok) throw new Error(`Falha ao carregar ${path}`);
                return res.text();
            })
        );

        // Carrega HTML e CSS
        const htmlPromise = fetch('/index.html').then(res => res.text());
        const cssPromise = fetch('/styles/main.css').then(res => res.text());

        const [html, css, ...scripts] = await Promise.all([htmlPromise, cssPromise, ...scriptPromises]);

        // Mapeia os scripts de volta para seus nomes de arquivo
        const scriptContents = SCRIPT_LOAD_ORDER.reduce((acc, path, index) => {
            acc[path] = scripts[index];
            return acc;
        }, {});

        return { html, css, scripts: scriptContents };
    }

    buildFinalHTML(templates, serverData) {
        // Remove todos os "import" e "export" do código JS
        let combinedJs = SCRIPT_LOAD_ORDER.map(path => {
            const content = templates.scripts[path];
            return content
                .replace(/^import .* from '.*';/gm, '') // Remove imports
                .replace(/^export /gm, ''); // Remove exports
        }).join('\n\n// --- Fim do Arquivo --- \n\n');

        // Cria o script que será injetado no HTML
        const injectedJS = `
document.addEventListener('DOMContentLoaded', () => {
    // --- DADOS EMBUTIDOS DO SERVIDOR ---
    const OFFLINE_DATA = ${JSON.stringify(serverData)};
    window.IS_OFFLINE_MODE = true;
    console.log('--- MODO OFFLINE ATIVADO ---', {
        alunos: OFFLINE_DATA.students.length,
        avaliacoes: OFFLINE_DATA.assessments.length
    });

    // --- CÓDIGO COMPILADO DA APLICAÇÃO ---
    try {
        ${combinedJs}
    } catch (e) {
        console.error('Erro ao executar o script offline compilado:', e);
        document.body.innerHTML = '<h1>Erro crítico ao carregar a aplicação offline.</h1>';
    }
});
        `;

        let html = templates.html;

        // Injeta o CSS inline
        html = html.replace('<link rel="stylesheet" href="styles/main.css">', `<style>${templates.css}</style>`);
        
        // Substitui o script original pelo nosso script compilado e com dados
        // Usamos um ID para encontrar o script e substituí-lo
        html = html.replace(
            '<script type="module" src="src/main.js" id="main-script"></script>',
            `<script>${injectedJS}</script>`
        );

        // Removemos elementos de professor
        const doc = new DOMParser().parseFromString(html, 'text/html');
        ['#teacher-area-screen', '#teacher-dashboard', '#teacher-login-link'].forEach(sel => {
            const el = doc.querySelector(sel);
            if (el) el.remove();
        });

        return doc.documentElement.outerHTML;
    }

    downloadFile(htmlContent) {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `plataforma_offline_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
    
    // Funções de feedback
    updateStatus(message, color) { this.statusElement.textContent = message; this.statusElement.style.color = color; }
    showSuccess(data) { this.updateStatus(`Sucesso! Arquivo gerado com ${data.students.length} alunos.`, 'green'); }
    showError(error) { this.updateStatus(`Erro: ${error.message}`, 'red'); }
    clearStatus() { this.updateStatus('', ''); }
}