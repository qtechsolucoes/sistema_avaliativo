// src/services/dataService.js (NOVO ARQUIVO)

import { getSupabaseClient, isSupabaseAvailable } from './supabaseClient.js';
import { mockDataService } from './mockDataService.js';

// Interface implícita para os serviços de dados
class DataServiceInterface {
    async getClassesByGrade(grade) { throw new Error("Not implemented"); }
    async getStudentsByClass(classId) { throw new Error("Not implemented"); }
    // ... outros métodos
}

class OnlineDataService extends DataServiceInterface {
    constructor(client) {
        super();
        this.client = client;
    }

    async getClassesByGrade(grade, periodName = "3º Bimestre", year = 2025) {
        // ... lógica de busca no Supabase (como já existe)
    }
    // ...
}

class OfflineDataService extends DataServiceInterface {
    async getClassesByGrade(grade) {
        return mockDataService.getClassesByGrade(grade);
    }
    // ...
}

// Factory para obter o serviço de dados correto
function getDataService() {
    if (isSupabaseAvailable()) {
        return new OnlineDataService(getSupabaseClient());
    }
    return new OfflineDataService();
}

export const dataService = getDataService();