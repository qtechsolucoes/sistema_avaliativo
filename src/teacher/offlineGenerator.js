// src/teacher/offlineGenerator.js - Gerador de arquivo HTML offline
import { 
    getAllStudentsFromAllClasses,
    getAllClassesFromAllGrades,
    getAllAssessmentsData,
    getAllSubmissionsForDashboard 
} from '../database.js';
import { logService } from '../services/logService.js';

export async function generateOfflineFile(statusElement, buttonElement) {
    const confirmMsg = 
        "Esta operação irá gerar um arquivo HTML completo para uso offline.\n\n" +
        "O arquivo incluirá TODOS os dados atuais do Supabase.\n\n" +
        "Deseja continuar?";
    
    if (!confirm(confirmMsg)) return;
    
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
        
        try {
            // Coleta dados
            const data = await this.collectAllData();
            
            // Carrega templates
            const templates = await this.loadTemplates();
            
            // Gera HTML final
            const finalHTML = this.buildOfflineHTML(templates, data);
            
            // Faz download
            this.downloadFile(finalHTML);
            
            this.showSuccess(data);
            
        } catch (error) {
            this.showError(error);
        } finally {
            this.buttonElement.disabled = false;
            this.clearStatus(5000);
        }
    }

    async collectAllData() {
        this.updateStatus("Coletando dados dos alunos...");
        const students = await getAllStudentsFromAllClasses();
        
        this.updateStatus("Coletando dados das turmas...");
        const classes = await getAllClassesFromAllGrades();
        
        this.updateStatus("Coletando dados das avaliações...");
        const assessments = await getAllAssessmentsData();
        
        this.updateStatus("Coletando submissões existentes...");
        const submissions = await getAllSubmissionsForDashboard();
        
        logService.info('Dados coletados para arquivo offline', {
            students: students.length,
            classes: classes.length,
            assessments: assessments.length,
            submissions: submissions.length
        });
        
        return { students, classes, assessments, submissions };
    }

    async loadTemplates() {
        const htmlResponse = await fetch('./index.html');
        if (!htmlResponse.ok) throw new Error('Erro ao carregar template HTML');
        const html = await htmlResponse.text();

        const cssResponse = await fetch('./styles/main.css');
        if (!cssResponse.ok) throw new Error('Erro ao carregar CSS');
        const css = await cssResponse.text();

        return { html, css };
    }

    buildOfflineHTML(templates, data) {
        let html = templates.html;
        
        // Injeta CSS inline
        html = html.replace(
            '<link rel="stylesheet" href="styles/main.css">',
            `<style>${templates.css}</style>`
        );
        
        // Injeta JavaScript com dados
        const offlineJS = this.generateOfflineJavaScript(data);
        html = html.replace(
            '<script type="module" src="src/main.js"></script>',
            `<script>${offlineJS}</script>`
        );
        
        // Remove elementos desnecessários
        html = this.removeTeacherElements(html);
        
        return html;
    }

    generateOfflineJavaScript(data) {
        return `
// Sistema Offline Gerado em ${new Date().toISOString()}
const OFFLINE_DATA = ${JSON.stringify(data, null, 2)};
console.log('Sistema offline carregado:', {
    alunos: OFFLINE_DATA.students.length,
    turmas: OFFLINE_DATA.classes.length,
    avaliacoes: OFFLINE_DATA.assessments.length
});

// Código mínimo do sistema offline
${this.getMinimalOfflineCode()}
        `;
    }

    getMinimalOfflineCode() {
        // Retorna apenas o código essencial para funcionamento offline
        return `
// Implementação mínima para funcionamento offline
(function() {
    // Código do sistema offline aqui
    console.log('Sistema offline ativo');
})();
        `;
    }

    removeTeacherElements(html) {
        // Remove elementos relacionados ao professor
        const patterns = [
            /<div id="teacher-dashboard"[^>]*>[\s\S]*?(?=<div id="[^"]*"|$)/g,
            /<div id="teacher-area-screen"[^>]*>[\s\S]*?(?=<div id="[^"]*"|$)/g,
            /<a[^>]*id="teacher-login-link"[^>]*>.*?<\/a>/gs
        ];
        
        patterns.forEach(pattern => {
            html = html.replace(pattern, '');
        });
        
        return html;
    }

    downloadFile(html) {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `plataforma_offline_${this.getTimestamp()}.html`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    getTimestamp() {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        return `${date}_${time}`;
    }

    updateStatus(message) {
        this.statusElement.textContent = message;
        this.statusElement.style.color = '#64748b';
    }

    showSuccess(data) {
        const message = `Arquivo gerado! ${data.students.length} alunos, ${data.classes.length} turmas`;
        this.statusElement.textContent = message;
        this.statusElement.style.color = 'green';
        logService.info('Arquivo offline gerado com sucesso');
    }

    showError(error) {
        this.statusElement.textContent = `Erro: ${error.message}`;
        this.statusElement.style.color = 'red';
        logService.error('Erro ao gerar arquivo offline', error);
    }

    clearStatus(delay) {
        setTimeout(() => {
            this.statusElement.textContent = "";
            this.statusElement.style.color = '';
        }, delay);
    }
}