// src/services/cacheService.js - Sistema de cache para melhor performance
class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttl = 5 * 60 * 1000; // 5 minutos padrão
    }
    
    set(key, value, customTTL) {
        const ttl = customTTL || this.ttl;
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    clear(pattern) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }
    
    async getOrFetch(key, fetchFn, customTTL) {
        const cached = this.get(key);
        if (cached !== null) return cached;
        
        try {
            const value = await fetchFn();
            this.set(key, value, customTTL);
            return value;
        } catch (error) {
            console.error(`Erro ao buscar ${key}:`, error);
            throw error;
        }
    }
}

export const cacheService = new CacheService();