// src/teacher/offlineGenerator.js - VERSÃO ATUALIZADA E ROBUSTA

import { getDataForOfflineFile } from '../database.js';
import { logService } from '../services/logService.js';

/**
 * Ponto de entrada para gerar o arquivo offline.
 * @param {HTMLElement} statusElement - Elemento para exibir o status.
 * @param {HTMLButtonElement} buttonElement - Botão que iniciou a ação.
 */
export async function generateOfflineFile(statusElement, buttonElement) {
    if (!confirm("Esta operação irá gerar um arquivo HTML completo para uso offline, contendo todos os dados necessários. Deseja continuar?")) {
        return;
    }
    const generator = new OfflineFileGenerator(statusElement, buttonElement);
    await generator.generate();
}

/**
 * Classe responsável por gerar um arquivo HTML autônomo.
 * NOVA LÓGICA: Lê dinamicamente os scripts do index.html em vez de usar uma lista manual.
 */
class OfflineFileGenerator {
    constructor(statusElement, buttonElement) {
        this.statusElement = statusElement;
        this.buttonElement = buttonElement;
    }

    async generate() {
        this.buttonElement.disabled = true;
        this.updateStatus('Iniciando processo...', '#64748b');

        try {
            // Passo 1: Carregar o HTML principal para análise
            this.updateStatus('1/4: Analisando a estrutura da aplicação...');
            const mainHtmlContent = await fetch('/index.html').then(res => res.text());
            const parser = new DOMParser();
            const mainDoc = parser.parseFromString(mainHtmlContent, 'text/html');

            // Passo 2: Carregar dinamicamente todos os scripts e CSS referenciados no HTML
            this.updateStatus('2/4: Carregando todos os arquivos (JS e CSS)...');
            const assets = await this.loadAssets(mainDoc);

            // Passo 3: Buscar todos os dados necessários do banco
            this.updateStatus('3/4: Coletando dados do servidor...');
            const serverData = await getDataForOfflineFile();

            // Passo 4: Construir o arquivo HTML final
            this.updateStatus('4/4: Compilando o arquivo final...');
            const finalHTML = this.buildFinalHTML(mainDoc, assets, serverData);

            // Iniciar o download
            this.downloadFile(finalHTML);
            this.showSuccess(serverData);

        } catch (error) {
            this.showError(error);
            logService.critical('Falha ao gerar arquivo offline.', { error });
        } finally {
            this.buttonElement.disabled = false;
            setTimeout(() => this.clearStatus(), 10000);
        }
    }

    /**
     * Carrega todos os assets (JS, CSS) referenciados no documento HTML.
     * @param {Document} doc - O documento HTML parseado.
     * @returns {Promise<object>} Um objeto contendo o conteúdo dos assets.
     */
    async loadAssets(doc) {
        const scriptTags = Array.from(doc.querySelectorAll('script[src]'));
        const cssLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'));

        const scriptPromises = scriptTags.map(tag =>
            fetch(tag.src).then(res => res.text()).catch(e => `/* Falha ao carregar ${tag.src} */`)
        );
        const cssPromises = cssLinks.map(link =>
            fetch(link.href).then(res => res.text()).catch(e => `/* Falha ao carregar ${link.href} */`)
        );

        // Carrega também os arquivos de configuração offline
        const offlineConfigPromise = fetch('/offline-config.js')
            .then(res => res.text())
            .catch(() => '// Configuração offline não encontrada');

        const offlineSubmissionServicePromise = fetch('/src/services/offlineSubmissionService.js')
            .then(res => res.text())
            .catch(() => '// Serviço de submissão offline não encontrado');

        const [scripts, css, offlineConfig, offlineService] = await Promise.all([
            Promise.all(scriptPromises),
            Promise.all(cssPromises),
            offlineConfigPromise,
            offlineSubmissionServicePromise
        ]);

        return {
            scripts: scripts.join('\n\n// --- Fim do Arquivo --- \n\n'),
            css: css.join('\n\n'),
            offlineConfig: offlineConfig,
            offlineSubmissionService: offlineService
        };
    }

    /**
     * Constrói o HTML final injetando CSS, dados e o script compilado.
     * @param {Document} doc - O documento HTML original parseado.
     * @param {object} assets - O conteúdo do CSS e JS.
     * @param {object} serverData - Os dados do banco de dados.
     * @returns {string} O conteúdo HTML final como string.
     */
    buildFinalHTML(doc, assets, serverData) {
        // Remove os links de script e CSS originais
        doc.querySelectorAll('script[src], link[rel="stylesheet"]').forEach(el => el.remove());

        // Remove a área de professor, que não é necessária para o aluno
        const teacherElements = ['#teacher-area-screen', '#teacher-dashboard', '#teacher-login-link'];
        teacherElements.forEach(selector => {
            const el = doc.querySelector(selector);
            if (el) el.remove();
        });

        // Remove links para CDNs de ícones, pois não funcionarão offline
        doc.querySelectorAll('script[src*="heroicons"]').forEach(el => el.remove());
        
        // Remove "defer" do script principal para garantir execução na ordem
        const mainScriptTag = doc.getElementById('main-script');
        if(mainScriptTag) mainScriptTag.removeAttribute('defer');

        // Cria o script que será injetado
        const injectedJS = `
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO DO SERVIDOR LOCAL ---
    ${assets.offlineConfig}

    // --- DADOS EMBUTIDOS DO SERVIDOR ---
    // Estes dados simulam a resposta do banco de dados para o modo offline.
    const OFFLINE_DATA = ${JSON.stringify(serverData)};
    window.IS_OFFLINE_MODE = true;
    console.log('--- MODO OFFLINE ATIVADO ---', {
        alunos: OFFLINE_DATA.students.length,
        avaliacoes: OFFLINE_DATA.assessments.length,
        servidor: window.OFFLINE_SERVER_CONFIG?.serverURL || 'Não configurado'
    });

    // --- SERVIÇO DE SUBMISSÃO OFFLINE ---
    try {
        ${assets.offlineSubmissionService.replace(/^import .* from '.*';/gm, '').replace(/^export /gm, '')}

        // Instancia o serviço globalmente para uso no quiz.js
        window.offlineSubmissionService = new OfflineSubmissionService();

        // Testa conectividade com o servidor ao iniciar
        window.offlineSubmissionService.checkServerStatus().then(isOnline => {
            if (isOnline) {
                console.log('✅ Servidor local detectado e acessível');
            } else {
                console.warn('⚠️ Servidor local não acessível. Resultados serão salvos localmente.');
            }
        });
    } catch (e) {
        console.warn('Serviço de submissão offline não disponível:', e.message);
    }

    // --- CÓDIGO COMPILADO DA APLICAÇÃO ---
    // Todo o código JavaScript da aplicação é combinado aqui.
    try {
        // Remove imports/exports, que não funcionam em um script único
        const combinedJs = \`${assets.scripts}\`
            .replace(/^import .* from '.*';/gm, '')
            .replace(/^export /gm, '');

        // Executa o código combinado
        (new Function(combinedJs))();
    } catch (e) {
        console.error('Erro ao executar o script offline compilado:', e);
        document.body.innerHTML = '<h1>Erro crítico ao carregar a aplicação offline. Verifique o console.</h1><pre>' + e.stack + '</pre>';
    }
});
        `;

        // Injeta o CSS inline dentro do <head>
        const styleTag = doc.createElement('style');
        styleTag.textContent = assets.css;
        doc.head.appendChild(styleTag);

        // Injeta o JS combinado com os dados no final do <body>
        const scriptTag = doc.createElement('script');
        scriptTag.textContent = injectedJS;
        doc.body.appendChild(scriptTag);

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

    // Funções de feedback na UI
    updateStatus(message, color) { this.statusElement.textContent = message; this.statusElement.style.color = color; }
    showSuccess(data) { this.updateStatus(`Sucesso! Arquivo gerado com ${data.students.length} alunos e ${data.assessments.length} avaliações.`, 'green'); }
    showError(error) { this.updateStatus(`Erro: ${error.message}`, 'red'); }
    clearStatus() { this.updateStatus('', ''); }
}