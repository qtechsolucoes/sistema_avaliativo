// offline-config.js - Configuração inteligente do servidor local

/**
 * CONFIGURAÇÃO DO SERVIDOR LOCAL PARA MODO OFFLINE
 *
 * Este arquivo é incorporado no HTML offline gerado.
 * Configure o IP do seu computador na rede local.
 */

window.OFFLINE_SERVER_CONFIG = {
    // ========================================
    // 🔧 CONFIGURAÇÃO PRINCIPAL
    // ========================================

    /**
     * IP do servidor local
     *
     * Como descobrir seu IP:
     *
     * WINDOWS:
     *   1. Abra o Prompt de Comando
     *   2. Digite: ipconfig
     *   3. Procure por "Adaptador de Rede sem Fio"
     *   4. Anote o "Endereço IPv4"
     *
     * Exemplos comuns:
     *   - MyPublicWiFi: 192.168.137.1
     *   - Hotspot móvel: 192.168.43.1
     *   - Rede doméstica: 192.168.0.X ou 192.168.1.X
     *
     * MAC/LINUX:
     *   1. Abra o Terminal
     *   2. Digite: ifconfig (ou ip addr)
     *   3. Procure por "inet" no adaptador Wi-Fi
     */
    serverIP: "192.168.137.1",  // ⬅️ ALTERE AQUI!

    // Porta do servidor (não alterar sem modificar server.js)
    serverPort: 3000,

    // ========================================
    // ⚙️ CONFIGURAÇÕES AVANÇADAS
    // ========================================

    // Timeout para tentativas de envio (ms)
    timeout: 5000,  // 5 segundos

    // Número máximo de tentativas de envio
    maxRetries: 3,

    // Intervalo entre tentativas (ms)
    retryDelay: 2000,  // 2 segundos

    // ========================================
    // 🤖 PROPRIEDADES COMPUTADAS
    // ========================================

    /**
     * URL completa do servidor (gerada automaticamente)
     * NÃO ALTERE ESTA PROPRIEDADE
     */
    get serverURL() {
        return `http://${this.serverIP}:${this.serverPort}`;
    },

    /**
     * Valida se a configuração está correta
     * @returns {object} - {isValid: boolean, errors: string[]}
     */
    validate() {
        const errors = [];

        // Valida IP
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipPattern.test(this.serverIP)) {
            errors.push('serverIP não está em formato válido (ex: 192.168.1.100)');
        } else {
            const parts = this.serverIP.split('.');
            if (parts.some(part => parseInt(part) > 255 || parseInt(part) < 0)) {
                errors.push('serverIP contém octetos inválidos (devem estar entre 0-255)');
            }
        }

        // Valida porta
        if (typeof this.serverPort !== 'number' || this.serverPort < 1 || this.serverPort > 65535) {
            errors.push('serverPort deve estar entre 1 e 65535');
        }

        // Valida timeout
        if (typeof this.timeout !== 'number' || this.timeout < 1000) {
            errors.push('timeout deve ser >= 1000ms');
        }

        // Valida maxRetries
        if (typeof this.maxRetries !== 'number' || this.maxRetries < 1) {
            errors.push('maxRetries deve ser >= 1');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Testa conectividade com o servidor
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${this.serverURL}/status`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Servidor acessível:', data);
                return true;
            }

            console.warn('⚠️ Servidor respondeu mas com erro:', response.status);
            return false;

        } catch (error) {
            console.error('❌ Servidor não acessível:', error.message);
            return false;
        }
    },

    /**
     * Exibe informações de debug no console
     */
    debug() {
        console.log('🔍 Configuração do Servidor Offline:');
        console.log('  URL completa:', this.serverURL);
        console.log('  IP:', this.serverIP);
        console.log('  Porta:', this.serverPort);
        console.log('  Timeout:', this.timeout, 'ms');
        console.log('  Max tentativas:', this.maxRetries);
        console.log('  Delay entre tentativas:', this.retryDelay, 'ms');

        const validation = this.validate();
        console.log('  Validação:', validation.isValid ? '✅ OK' : '❌ ERRO');

        if (!validation.isValid) {
            console.error('  Erros:', validation.errors);
        }

        return validation;
    }
};

// Validação automática ao carregar
(function() {
    const config = window.OFFLINE_SERVER_CONFIG;
    const validation = config.validate();

    if (!validation.isValid) {
        console.error('🚨 CONFIGURAÇÃO INVÁLIDA DO SERVIDOR OFFLINE:');
        validation.errors.forEach(error => console.error(`  ❌ ${error}`));
        console.error('\n💡 Corrija o arquivo offline-config.js antes de gerar o HTML offline');
    } else {
        console.log('✅ Configuração do servidor offline válida');
        console.log(`📡 Servidor esperado em: ${config.serverURL}`);
    }
})();

// Disponibiliza função de teste global
if (typeof window !== 'undefined') {
    window.testOfflineServer = function() {
        window.OFFLINE_SERVER_CONFIG.testConnection().then(isOnline => {
            if (isOnline) {
                alert('✅ Servidor está acessível e funcionando!');
            } else {
                alert('❌ Servidor não está acessível.\n\nVerifique:\n1. Servidor está rodando (node server.js)?\n2. IP está correto em offline-config.js?\n3. Chromebook está conectado na rede?');
            }
        });
    };

    console.log('💡 Para testar conexão, execute: testOfflineServer()');
}
