// auth.js - Sistema de Autenticação para Electron com "Manter-me conectado"

// Verificar se está rodando no Electron
function isElectron() {
    return typeof window !== 'undefined' && window.process && window.process.type === 'renderer';
}

// Usar Firebase já inicializado no HTML
const auth = firebase.auth();
const db = firebase.firestore();

// Configurar persistência do Firebase de forma mais segura
async function configurarPersistencia(manterConectado) {
    try {
        if (isElectron()) {
            console.log("Forçando persistência SESSION no Electron");
            return await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }
        if (manterConectado) {
            return await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        } else {
            return await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        }
    } catch (error) {
        console.error('Erro ao configurar persistência:', error);
        return Promise.resolve();
    }
}

// Função para salvar credenciais (apenas quando "manter conectado" está marcado)
function salvarCredenciais(email, senha, manter) {
    if (manter) {
        try {
            // Criptografar dados básicos (não é 100% seguro, mas melhor que texto plano)
            const dados = {
                email: btoa(email), // Base64 encoding básico
                autoLogin: true,
                timestamp: Date.now()
            };
            localStorage.setItem('loginData', JSON.stringify(dados));
        } catch (error) {
            console.warn('Não foi possível salvar credenciais:', error);
        }
    } else {
        try {
            localStorage.removeItem('loginData');
        } catch (error) {
            console.warn('Não foi possível remover credenciais:', error);
        }
    }
}

// Função para recuperar credenciais salvas
function recuperarCredenciais() {
    try {
        const dadosString = localStorage.getItem('loginData');
        if (!dadosString) return null;
        
        const dados = JSON.parse(dadosString);
        
        // Verificar se os dados não são muito antigos (30 dias)
        const trintaDias = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - dados.timestamp > trintaDias) {
            localStorage.removeItem('loginData');
            return null;
        }
        
        return {
            email: atob(dados.email), // Decodificar Base64
            autoLogin: dados.autoLogin
        };
    } catch (error) {
        console.error('Erro ao recuperar credenciais:', error);
        try {
            localStorage.removeItem('loginData');
        } catch (e) {
            console.warn('Não foi possível limpar credenciais inválidas');
        }
        return null;
    }
}

// Função para fazer login
async function fazerLogin(email, senha, manterConectado = false) {
    try {
        await configurarPersistencia(manterConectado);
        const userCredential = await auth.signInWithEmailAndPassword(email, senha);
        const user = userCredential.user;

        localStorage.setItem('userData', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Usuário',
            loginTime: Date.now()
        }));

        if (manterConectado) {
            localStorage.setItem('loginData', JSON.stringify({
                email: btoa(email),
                autoLogin: true,
                timestamp: Date.now()
            }));
        }

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);

        return { success: true, user: user };
    } catch (error) {
        console.error('Erro no login:', error);
        return { success: false, error: error.message };
    }
}


// Função para tentar login automático
async function tentarLoginAutomatico() {
    try {
        const credenciais = recuperarCredenciais();
        if (!credenciais || !credenciais.autoLogin) {
            return { success: false, message: 'Nenhuma credencial salva' };
        }
        
        console.log('Tentando login automático para:', credenciais.email);
        
        // Mostrar indicador de login automático
        mostrarIndicadorLoginAutomatico();
        
        // Aguardar um momento para o Firebase inicializar
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Verificar se já está logado (persistência do Firebase)
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                
                if (user) {
                    console.log('Usuário já autenticado via persistência:', user.email);
                    
                    // Salvar dados atualizados
                    const userData = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || 'Usuário',
                        loginTime: Date.now()
                    };
                    
                    try {
                        localStorage.setItem('userData', JSON.stringify(userData));
                    } catch (error) {
                        console.warn('Não foi possível salvar dados do usuário:', error);
                    }
                    
                    // Redirecionar para dashboard
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                    
                    resolve({ success: true, user: user, automatic: true });
                } else {
                    console.log('Usuário não está autenticado automaticamente');
                    resolve({ success: false, message: 'Sessão expirada' });
                }
            });
            
            // Timeout de segurança
            setTimeout(() => {
                resolve({ success: false, message: 'Timeout na verificação de autenticação' });
            }, 10000);
        });
        
    } catch (error) {
        console.error('Erro no login automático:', error);
        // Limpar credenciais se houver erro
        try {
            localStorage.removeItem('loginData');
        } catch (e) {
            console.warn('Não foi possível limpar credenciais após erro');
        }
        return { success: false, error: error.message };
    }
}

// Função para mostrar indicador de login automático
function mostrarIndicadorLoginAutomatico() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const loadingContent = overlay.querySelector('.loading-content p');
        if (loadingContent) {
            loadingContent.textContent = 'Fazendo login automaticamente...';
        }
        overlay.style.display = 'flex';
        
        // Esconder após 10 segundos se não conseguir fazer login
        setTimeout(() => {
            if (overlay.style.display === 'flex') {
                overlay.style.display = 'none';
            }
        }, 10000);
    }
}

// Função para criar conta
async function criarConta(email, senha) {
    try {
        // Usar persistência de sessão para contas novas (segurança)
        await configurarPersistencia(false);
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        const user = userCredential.user;
        
        console.log('Conta criada com sucesso:', user.email);
        
        // Criar documento do usuário no Firestore
        await db.collection('usuarios').doc(user.uid).set({
            email: user.email,
            dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
            ativo: true
        });
        
        // Salvar dados do usuário no localStorage
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Usuário',
            loginTime: Date.now()
        };
        
        try {
            localStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.warn('Não foi possível salvar dados do usuário:', error);
        }
        
        // Redirecionar para o dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
        
        return { success: true, user: user };
        
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        
        let mensagemErro = 'Erro desconhecido';
        switch (error.code) {
            case 'auth/email-already-in-use':
                mensagemErro = 'Este email já está em uso';
                break;
            case 'auth/invalid-email':
                mensagemErro = 'Email inválido';
                break;
            case 'auth/weak-password':
                mensagemErro = 'Senha muito fraca. Use pelo menos 6 caracteres';
                break;
            case 'auth/network-request-failed':
                mensagemErro = 'Erro de conexão. Verifique sua internet';
                break;
            default:
                mensagemErro = error.message;
        }
        
        return { success: false, error: mensagemErro };
    }
}

// Logout
function fazerLogout() {
    return auth.signOut().then(() => {
        localStorage.removeItem('userData');
        localStorage.removeItem('loginData');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    });
}

// Função para verificar se usuário está autenticado
function verificarAutenticacao() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            if (user) {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'Usuário',
                    loginTime: Date.now()
                };
                
                try {
                    localStorage.setItem('userData', JSON.stringify(userData));
                } catch (error) {
                    console.warn('Não foi possível salvar dados do usuário:', error);
                }
                
                resolve({ authenticated: true, user: user });
            } else {
                try {
                    localStorage.removeItem('userData');
                } catch (error) {
                    console.warn('Não foi possível remover dados do usuário:', error);
                }
                resolve({ authenticated: false, user: null });
            }
        });
        
        // Timeout de segurança
        setTimeout(() => {
            resolve({ authenticated: false, user: null, timeout: true });
        }, 15000);
    });
}

// Listener para mudanças no estado de autenticação
// Listener de autenticação simplificado
auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname.toLowerCase();

    if (user) {
        console.log('Usuário autenticado:', user.email);
        if (currentPage.includes('index.html') || currentPage === '/' || currentPage === '') {
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } else {
        console.log('Usuário não autenticado');
        // ❌ não redireciona mais para index.html automaticamente
        // só o logout manual faz isso
    }
});

// Função para mostrar alertas
function mostrarAlerta(mensagem, tipo = 'info') {
    console.log(`Alerta [${tipo}]:`, mensagem);
    
    if (typeof Swal !== 'undefined') {
        const icone = tipo === 'error' ? 'error' : tipo === 'success' ? 'success' : 'info';
        Swal.fire({
            title: tipo === 'error' ? 'Erro!' : tipo === 'success' ? 'Sucesso!' : 'Informação',
            text: mensagem,
            icon: icone,
            confirmButtonText: 'OK',
            timer: tipo === 'success' ? 3000 : 0,
            timerProgressBar: true
        });
    } else {
        alert(mensagem);
    }
}

// Event listeners para os formulários
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, configurando event listeners...');
    
    // Aguardar Firebase estar completamente carregado
    setTimeout(() => {
        inicializarSistemaAuth();
    }, 1500);
});

function inicializarSistemaAuth() {
    console.log('Inicializando sistema de autenticação...');
    
    // Verificar se há credenciais salvas e tentar login automático
    const credenciais = recuperarCredenciais();
    const currentPage = window.location.pathname.toLowerCase();
    
    if (credenciais && credenciais.autoLogin && 
        (currentPage.includes('index.html') || currentPage === '/' || currentPage === '')) {
        console.log('Tentando login automático...');
        tentarLoginAutomatico().then(resultado => {
            console.log('Resultado do login automático:', resultado);
            
            // Esconder overlay se não conseguiu fazer login automático
            if (!resultado.success) {
                const overlay = document.getElementById('loadingOverlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
            }
        });
    }
    
    // Verificar se está na página de login
    const container = document.getElementById('container');
    if (!container) {
        console.log('Não está na página de login');
        return;
    }
    
    console.log('Configurando página de login...');
    
    // Preencher campos se houver credenciais salvas (mas não auto login)
    if (credenciais && !credenciais.autoLogin) {
        const emailInput = document.querySelector('.sign-in input[type="email"]');
        if (emailInput && credenciais.email) {
            emailInput.value = credenciais.email;
        }
    }
    
    // Configurar alternância entre login e cadastro
    const registerBtn = document.getElementById('register');
    const loginBtn = document.getElementById('login');
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            console.log('Clicou em registrar');
            container.classList.add('active');
        });
    }
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('Clicou em login');
            container.classList.remove('active');
        });
    }
    
    // Event listener para o botão de login
    const btnLogin = document.querySelector('.btn-login');
    console.log('Botão de login encontrado:', !!btnLogin);
    
    if (btnLogin) {
        // Remover listeners existentes
        const novoBotao = btnLogin.cloneNode(true);
        btnLogin.parentNode.replaceChild(novoBotao, btnLogin);
        
        novoBotao.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão de login clicado!');
            
            const emailInput = document.querySelector('.sign-in input[type="email"]');
            const senhaInput = document.querySelector('.sign-in input[type="password"]');
            const manterConectadoCheckbox = document.getElementById('manterConectado');
            
            console.log('Elementos encontrados:', {
                email: !!emailInput,
                senha: !!senhaInput,
                checkbox: !!manterConectadoCheckbox
            });
            
            if (!emailInput || !senhaInput) {
                console.error('Campos de email ou senha não encontrados');
                mostrarAlerta('Erro: Campos não encontrados', 'error');
                return;
            }
            
            const email = emailInput.value.trim();
            const senha = senhaInput.value.trim();
            const manterConectado = manterConectadoCheckbox ? manterConectadoCheckbox.checked : false;
            
            console.log('Dados coletados:', { email, senhaLength: senha.length, manterConectado });
            
            if (!email || !senha) {
                mostrarAlerta('Por favor, preencha todos os campos', 'error');
                return;
            }
            
            // Validação básica de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                mostrarAlerta('Por favor, insira um email válido', 'error');
                return;
            }
            
            // Mostrar loading
            const textoOriginal = novoBotao.innerHTML;
            novoBotao.innerHTML = '<div class="spinner"></div>Entrando...';
            novoBotao.disabled = true;
            
            try {
                console.log('Iniciando processo de login...');
                const resultado = await fazerLogin(email, senha, manterConectado);
                
                if (resultado.success) {
                    mostrarAlerta('Login realizado com sucesso!', 'success');
                } else {
                    mostrarAlerta(resultado.error, 'error');
                }
            } catch (error) {
                console.error('Erro no login:', error);
                mostrarAlerta('Erro inesperado: ' + error.message, 'error');
            } finally {
                // Restaurar botão
                novoBotao.innerHTML = textoOriginal;
                novoBotao.disabled = false;
            }
        });
        
        console.log('Event listener do botão de login configurado');
    } else {
        console.error('Botão de login não encontrado!');
    }
    
    // Event listener para o formulário de cadastro
    const formCadastro = document.querySelector('.sign-up form');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const senhaInput = this.querySelector('input[type="password"]');
            const btnCadastro = this.querySelector('button');
            
            const email = emailInput.value.trim();
            const senha = senhaInput.value.trim();
            
            if (!email || !senha) {
                mostrarAlerta('Por favor, preencha todos os campos', 'error');
                return;
            }
            
            // Validação de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                mostrarAlerta('Por favor, insira um email válido', 'error');
                return;
            }
            
            // Validação de senha
            if (senha.length < 6) {
                mostrarAlerta('A senha deve ter pelo menos 6 caracteres', 'error');
                return;
            }
            
            // Mostrar loading
            const textoOriginal = btnCadastro.textContent;
            btnCadastro.innerHTML = '<div class="spinner"></div>Cadastrando...';
            btnCadastro.disabled = true;
            
            try {
                const resultado = await criarConta(email, senha);
                
                if (resultado.success) {
                    mostrarAlerta('Conta criada com sucesso!', 'success');
                } else {
                    mostrarAlerta(resultado.error, 'error');
                }
            } catch (error) {
                console.error('Erro no cadastro:', error);
                mostrarAlerta('Erro inesperado: ' + error.message, 'error');
            } finally {
                // Restaurar botão
                btnCadastro.textContent = textoOriginal;
                btnCadastro.disabled = false;
            }
        });
    }
    
    console.log('Sistema de autenti cação inicializado com sucesso!');
}

// Exportar funções para uso global
window.fazerLogin = fazerLogin;
window.criarConta = criarConta;
window.fazerLogout = fazerLogout;
window.verificarAutenticacao = verificarAutenticacao;
window.tentarLoginAutomatico = tentarLoginAutomatico;