const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo de configurações
const CONFIG_PATH = path.join(__dirname, 'config', 'download-config.json');

// ===== CÓDIGO DE DEPURAÇÃO DE CAMINHOS =====
console.log("======================================================");
console.log("INICIANDO DEPURACAO DE CAMINHOS...");
console.log(` - Caminho do script ( __dirname ): ${__dirname}`);

// Listar arquivos e pastas no diretório do script
try {
    const arquivosNoDiretorio = fs.readdirSync(__dirname);
    console.log(" - Arquivos/Pastas encontrados em __dirname:", arquivosNoDiretorio);
} catch (e) {
    console.error("   - ❌ Erro ao ler __dirname:", e.message);
}

// Verificar se a pasta 'automacoes' existe
const pastaAutomacoesPrevista = path.join(__dirname, 'automacoes');
console.log(` - Caminho previsto para 'automacoes': ${pastaAutomacoesPrevista}`);
const pastaAutomacoesExiste = fs.existsSync(pastaAutomacoesPrevista);
console.log(` - A pasta 'automacoes' existe? -> ${pastaAutomacoesExiste}`);

if (pastaAutomacoesExiste) {
    try {
        const arquivosEmAutomacoes = fs.readdirSync(pastaAutomacoesPrevista);
        console.log(" - Conteudo da pasta 'automacoes':", arquivosEmAutomacoes);
    } catch (e) {
        console.error("   - Erro ao ler a pasta 'automacoes':", e.message);
    }
}
console.log("======================================================");

// Variáveis para automações
let executarAutomacaoSefazNF55;
let executarAutomacaoPrefeituraMensal;

// Carregar automação SEFAZ NF55
try {
    const caminhoSefaz = path.join(__dirname, 'automacoes', 'sefazNF55.js');
    console.log(`Tentando carregar SEFAZ de: ${caminhoSefaz}`);
    
    if (fs.existsSync(caminhoSefaz)) {
        ({ executarAutomacaoSefazNF55 } = require(caminhoSefaz));
        console.log('✅ Automação REAL SEFAZ NF55 carregada com sucesso.');
    } else {
        throw new Error(`Arquivo não encontrado em: ${caminhoSefaz}`);
    }
} catch (error) {
    console.error('❌ FALHA CRÍTICA ao carregar automacoes/sefazNF55.js. O servidor usará o modo simulado.', error.message);
    executarAutomacaoSefazNF55 = null;
}

// Carregar automação Prefeitura
try {
    const caminhoPrefeitura = path.join(__dirname, 'automacoes', 'nfseMensal.js');
    console.log(`Tentando carregar automacao Prefeitura de: ${caminhoPrefeitura}`);
    ({ executarAutomacaoPrefeituraMensal } = require(caminhoPrefeitura));
    console.log('✅ Automação NFS-e Mensal carregada');
} catch (error) {
    console.log('❌ Automação NFS-e Mensal não encontrada, usando modo simulado');
    console.error('   Erro detalhado:', error.message);
}

const app = express();
const PORT = 3000;

// Middlewares (apenas uma vez)
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Log de todas as requisições (apenas uma vez)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ENDPOINT DE STATUS (apenas uma vez)
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        message: 'Servidor funcionando corretamente',
        version: '1.0.0',
        automacoes: {
            sefazNF55: executarAutomacaoSefazNF55 ? 'CARREGADA' : 'SIMULADA',
            prefeituraMensal: executarAutomacaoPrefeituraMensal ? 'CARREGADA' : 'SIMULADA'
        }
    });
});

// ENDPOINT PARA SESSÕES ATIVAS
app.get('/api/sessions', (req, res) => {
    res.json({
        totalSessions: 0,
        sessions: [],
        message: 'Nenhuma sessao ativa no momento'
    });
});

// ENDPOINT PARA AUTOMAÇÕES DO SEFAZ
app.post('/api/execute-automation-sefaz', async (req, res) => {
    try {
        const { valorConsulta, nomeEmpresa, tipoAutomacao, credenciais } = req.body;

        console.log(`>>> Recebida requisição para: ${tipoAutomacao} | Empresa: ${nomeEmpresa}`);
        console.log(`>>> Valor para consulta: ${valorConsulta}`);

        // Validações essenciais
        if (!credenciais?.sefaz?.crc || !credenciais?.sefaz?.senha) {
            return res.status(400).json({
                success: false,
                message: `${nomeEmpresa} - Credenciais do SEFAZ não configuradas`,
                status: 'ERRO_CREDENCIAIS'
            });
        }

        if (!valorConsulta) {
            return res.status(400).json({
                success: false,
                message: `Nenhum valor (CNPJ, IE ou CPF) foi fornecido para a consulta.`
            });
        }

        let resultado;

        switch (tipoAutomacao) {
            case 'SEFAZ_NF55':
                if (executarAutomacaoSefazNF55) {
                    console.log('>>> Disparando automação REAL SEFAZ NF55...');
                    resultado = await executarAutomacaoSefazNF55(valorConsulta, nomeEmpresa, credenciais);
                } else {
                    console.log('>>> ATENÇÃO: Executando em MODO SIMULADO pois o arquivo da automação não foi carregado.');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    resultado = {
                        success: true,
                        message: `${nomeEmpresa} - NF-e modelo 55 processadas com sucesso (simulado)`,
                        status: 'SUCESSO_SIMULADO'
                    };
                }
                break;

            case 'SEFAZ_NFCE':
                await new Promise(resolve => setTimeout(resolve, 2000));
                resultado = {
                    success: true,
                    message: `${nomeEmpresa} - NFC-e processadas com sucesso`,
                    status: 'SUCESSO'
                };
                break;

            case 'SEFAZ_CTE':
                await new Promise(resolve => setTimeout(resolve, 2000));
                resultado = {
                    success: true,
                    message: `${nomeEmpresa} - CT-e processados com sucesso`,
                    status: 'SUCESSO'
                };
                break;

            default:
                resultado = {
                    success: false,
                    message: `Tipo de automacao nao implementado: ${tipoAutomacao}`,
                    status: 'NAO_IMPLEMENTADO'
                };
        }

        res.json(resultado);

    } catch (error) {
        console.error('Erro geral no endpoint /api/execute-automation-sefaz:', error);
        res.status(500).json({
            success: false,
            message: `Erro interno no servidor: ${error.message}`,
            status: 'ERRO_SERVIDOR'
        });
    }
});

// ENDPOINT PARA AUTOMAÇÕES DA PREFEITURA
app.post('/api/execute-automation-prefeitura', async (req, res) => {
    try {
        // 1. Extraia 'valorConsulta' que o frontend envia.
        const { valorConsulta, nomeEmpresa, tipoAutomacao, credenciais } = req.body;

        // 2. Atribua 'valorConsulta' às variáveis que a função de automação espera.
        const cnpj = valorConsulta;
        const cnpjFormatado = valorConsulta; // Pode usar o mesmo valor para ambos

        console.log(`Iniciando automacao PREFEITURA: ${tipoAutomacao} para ${nomeEmpresa}`);
        console.log(`>>> CNPJ recebido (valorConsulta): ${valorConsulta}`); // Log para confirmar

        // Validar credenciais da prefeitura
        if (!credenciais?.prefeitura?.usuario || !credenciais?.prefeitura?.senha) {
            // ... (resto do código continua igual)
            return res.json({
                success: false,
                message: `${nomeEmpresa} - Credenciais da prefeitura nao configuradas`,
                status: 'ERRO_CREDENCIAIS'
            });
        }

        let resultado;

        switch (tipoAutomacao) {
            case 'PREFEITURA_MENSAL':
                if (executarAutomacaoPrefeituraMensal) {
                    try {
                        console.log('Executando automacao PREFEITURA_MENSAL REAL...');
                        resultado = await executarAutomacaoPrefeituraMensal(cnpj, nomeEmpresa, cnpjFormatado, credenciais);
                    } catch (error) {
                        console.error('Erro na automacao PREFEITURA_MENSAL:', error);
                        resultado = {
                            success: false,
                            message: `${nomeEmpresa} - Falha na automacao PREFEITURA_MENSAL: ${error.message}`,
                            status: 'ERRO_EXECUCAO'
                        };
                    }
                } else {
                    console.log('Executando automacao PREFEITURA_MENSAL em modo SIMULADO');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    resultado = {
                        success: true,
                        message: `${nomeEmpresa} - NFS-e mensal processada com sucesso (modo simulado)`,
                        status: 'SUCESSO_SIMULADO'
                    };
                }
                break;

            case 'PREFEITURA_ANUAL':
                await new Promise(resolve => setTimeout(resolve, 2000));
                resultado = {
                    success: true,
                    message: `${nomeEmpresa} - NFS-e anual processada com sucesso`,
                    status: 'SUCESSO'
                };
                break;

            case 'PREFEITURA_DARF':
                await new Promise(resolve => setTimeout(resolve, 2000));
                resultado = {
                    success: true,
                    message: `${nomeEmpresa} - DARF processado com sucesso`,
                    status: 'SUCESSO'
                };
                break;

            default:
                resultado = {
                    success: false,
                    message: `Tipo de automacao nao implementado: ${tipoAutomacao}`,
                    status: 'NAO_IMPLEMENTADO'
                };
        }

        res.json(resultado);

    } catch (error) {
        console.error('Erro na automacao da prefeitura:', error);
        res.json({
            success: false,
            message: `Erro na automacao da prefeitura: ${error.message}`,
            status: 'ERRO_SERVIDOR'
        });
    }
});

// ENDPOINT PARA AUTOMAÇÕES DE CERTIDÕES
app.post('/api/execute-automation-certidoes', async (req, res) => {
    try {
        const { cnpj, nomeEmpresa, cnpjFormatado, tipoAutomacao, credenciais } = req.body;

        console.log(`Iniciando automacao CERTIDÕES: ${tipoAutomacao} para ${nomeEmpresa}`);

        // Validar certificado digital para certidões
        if (!credenciais?.certificadoDigital?.nome || !credenciais?.certificadoDigital?.senha) {
            return res.json({
                success: false,
                message: `${nomeEmpresa} - Certificado digital nao configurado`,
                status: 'ERRO_CREDENCIAIS'
            });
        }

        // Simular processamento
        await new Promise(resolve => setTimeout(resolve, 2000));

        let resultado;
        switch (tipoAutomacao) {
            case 'CERTIDAO_ECAC':
                resultado = {
                    success: true,
                    message: `${nomeEmpresa} - Certidao ECAC obtida com sucesso`,
                    status: 'SUCESSO'
                };
                break;
            case 'CERTIDAO_MUNICIPAL':
                resultado = {
                    success: true,
                    message: `${nomeEmpresa} - Certidao Municipal obtida com sucesso`,
                    status: 'SUCESSO'
                };
                break;
            case 'CERTIDAO_SEFAZ':
                resultado = {
                    success: true,
                    message: `${nomeEmpresa} - Certidao SEFAZ obtida com sucesso`,
                    status: 'SUCESSO'
                };
                break;
            case 'CERTIDAO_FGTS':
                resultado = {
                    success: true,
                    message: `${nomeEmpresa} - Certidao FGTS obtida com sucesso`,
                    status: 'SUCESSO'
                };
                break;
            default:
                resultado = {
                    success: false,
                    message: `Tipo de automacao nao implementado: ${tipoAutomacao}`,
                    status: 'NAO_IMPLEMENTADO'
                };
        }

        res.json(resultado);

    } catch (error) {
        console.error('Erro na automacao de certidões:', error);
        res.json({
            success: false,
            message: `Erro na automacao de certidões: ${error.message}`,
            status: 'ERRO_SERVIDOR'
        });
    }
});

// ENDPOINT DE TESTE ESPECÍFICO PARA SEFAZ NF55
app.post('/api/test-sefaz-nf55', async (req, res) => {
    try {
        const { valorConsulta, nomeEmpresa, credenciais } = req.body;

        console.log('TESTE: Executando automacao SEFAZ NF55...');

        if (!credenciais?.sefaz?.crc || !credenciais?.sefaz?.senha) {
            return res.json({
                success: false,
                message: 'Credenciais SEFAZ nao fornecidas para teste',
                status: 'ERRO_CREDENCIAIS'
            });
        }

        if (executarAutomacaoSefazNF55) {
            const resultado = await executarAutomacaoSefazNF55(valorConsulta, nomeEmpresa, credenciais);
            console.log('TESTE FINALIZADO:', resultado.status);
            res.json({
                ...resultado,
                testMode: true,
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                success: false,
                message: 'Automação SEFAZ NF55 não carregada - usando modo simulado',
                status: 'SIMULADO',
                testMode: true
            });
        }

    } catch (error) {
        console.error('Erro no teste SEFAZ NF55:', error);
        res.json({
            success: false,
            message: `Erro no teste: ${error.message}`,
            status: 'ERRO_TESTE',
            testMode: true,
            error: error.message
        });
    }
});

// Endpoints de configuração
app.post('/api/salvar-configuracoes', async (req, res) => {
    try {
        const configuracoes = req.body;

        if (!configuracoes || typeof configuracoes !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Dados de configuracao inválidos'
            });
        }

        const configDir = path.dirname(CONFIG_PATH);
        try {
            await fs.promises.access(configDir);
        } catch (error) {
            await fs.promises.mkdir(configDir, { recursive: true });
        }

        await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(configuracoes, null, 2), 'utf8');

        console.log('Configurações salvas em:', CONFIG_PATH);
        console.log('Configurações:', configuracoes);

        res.json({
            success: true,
            message: 'Configurações salvas com sucesso',
            caminho: CONFIG_PATH
        });

    } catch (error) {
        console.error('❌ Erro ao salvar configurações:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/configuracoes', async (req, res) => {
    try {
        await fs.promises.access(CONFIG_PATH);
        const dadosArquivo = await fs.promises.readFile(CONFIG_PATH, 'utf8');
        const configuracoes = JSON.parse(dadosArquivo);

        console.log('Configurações carregadas:', configuracoes);

        res.json({
            success: true,
            configuracoes: configuracoes
        });

    } catch (error) {
        console.log('Arquivo de configurações não encontrado, usando padrões');

        const configPadrao = {
            padraoNomeacao: 'empresa-ano-mes',
            pastaDestino: './downloads',
            notificarDownloads: true,
            notificarErros: true,
            extrairZip: true,
            manterZip: false
        };

        res.json({
            success: true,
            configuracoes: configPadrao
        });
    }
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.originalUrl,
        method: req.method,
        availableRoutes: [
            'GET /api/status',
            'GET /api/sessions',
            'POST /api/execute-automation-prefeitura',
            'POST /api/execute-automation-sefaz',
            'POST /api/execute-automation-certidoes',
            'POST /api/test-sefaz-nf55',
            'GET /api/configuracoes',
            'POST /api/salvar-configuracoes'
        ]
    });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Status: http://localhost:${PORT}/api/status`);
    console.log(`Teste SEFAZ: POST http://localhost:${PORT}/api/test-sefaz-nf55`);
    console.log(`Automações disponíveis:`);
    console.log(` ${executarAutomacaoSefazNF55 ? '✅' : '❌'} SEFAZ NF55 - ${executarAutomacaoSefazNF55 ? 'IMPLEMENTADO' : 'SIMULADO'}`);
    console.log(` ${executarAutomacaoPrefeituraMensal ? '✅' : '❌'} NFS-e Mensal - ${executarAutomacaoPrefeituraMensal ? 'IMPLEMENTADO' : 'SIMULADO'}`);
    console.log(` ⏳ Certidões - EM DESENVOLVIMENTO`);
    console.log(`Iniciado em: ${new Date().toLocaleString()}`);
});

// Tratamento de erro do servidor
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} já está em uso!`);
        console.log('Soluções:');
        console.log(' 1. Feche outros processos na porta 3000');
        console.log(' 2. Use: netstat -ano | findstr :3000');
        console.log(' 3. Mate o processo: taskkill /PID <PID> /F');
    } else {
        console.error('❌ Erro no servidor:', error);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('⏹️ Encerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado com sucesso');
        process.exit(0);
    });
});

module.exports = app;