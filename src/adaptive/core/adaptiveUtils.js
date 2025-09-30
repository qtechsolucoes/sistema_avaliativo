// src/adaptive/core/adaptiveUtils.js
// Funções de utilidade para o Sistema Adaptativo

/**
 * Analisa os detalhes de adaptação, que podem ser uma string JSON ou um objeto.
 * @param {string|object} adaptationDetails - Os detalhes da adaptação.
 * @returns {object|null} - O objeto de adaptação parseado ou null.
 */
export function parseAdaptationDetails(adaptationDetails) {
    if (!adaptationDetails) return null;
    try {
        if (typeof adaptationDetails === 'string') {
            return JSON.parse(adaptationDetails);
        }
        // Retorna o próprio objeto se já for um objeto
        return adaptationDetails;
    } catch (error) {
        console.warn('Erro ao analisar detalhes de adaptação:', error);
        return null;
    }
}

/**
 * Determina o tipo de adaptação principal (ex: 'tea', 'tdah') com base nos dados do aluno.
 * Esta é a função centralizada para evitar duplicação de código.
 * @param {object} adaptationDetailsObject - O objeto de adaptação já parseado.
 * @returns {string} - O tipo de adaptação principal.
 */
export function determineAdaptationType(adaptationDetailsObject) {
    // Se não houver detalhes, retorna um padrão seguro.
    if (!adaptationDetailsObject) {
        return 'intellectual';
    }

    // Usa os campos do JSON para análise. Garante que os campos existam antes de usar.
    const diagnosis = (adaptationDetailsObject.diagnosis || []).join(' ').toLowerCase();
    const difficulties = (adaptationDetailsObject.difficulties || []).join(' ').toLowerCase();
    const suggestions = (adaptationDetailsObject.suggestions || []).join(' ').toLowerCase();

    const allText = `${diagnosis} ${difficulties} ${suggestions}`;

    if (allText.includes('tea') || allText.includes('autis')) return 'tea';
    if (allText.includes('tdah') || allText.includes('déficit') || allText.includes('hiperativ')) return 'tdah';
    if (allText.includes('síndrome de down') || allText.includes('down')) return 'down';
    if (allText.includes('visual') || allText.includes('visão') || allText.includes('cegueira')) return 'visual';
    if (allText.includes('motor') || allText.includes('física') || allText.includes('coordenação')) return 'motor';

    return 'intellectual'; // Fallback padrão
}