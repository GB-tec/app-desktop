// script.js - Script de interface para Electron
const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

// Alternar entre formulários de login e cadastro
if (registerBtn) {
    registerBtn.addEventListener("click", () => {
        container.classList.add("active");
    });
}

if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        container.classList.remove("active");
    });
}

// Função para detectar se está no Electron
function isElectron() {
    return typeof window !== 'undefined' && 
           window.process && 
           window.process.type === 'renderer';
}

// Função para navegar entre páginas no Electron
async function navigateToPage(page) {
    if (isElectron()) {
        try {
            // Se estiver no Electron, usar window.location.href diretamente
            window.location.href = page;
        } catch (error) {
            console.error('Erro na navegação:', error);
            // Fallback: recarregar a página com o novo arquivo
            window.location.replace(page);
        }
    } else {
        // No navegador normal
        window.location.href = page;
    }
}

// Adicionar estilos CSS para loading
const loadingStyles = `
    .btn-loading {
        position: relative;
        pointer-events: none;
    }
    
    .btn-loading::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    .btn-loading .btn-text {
        opacity: 0;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
    
    .error-message {
        color: #dc3545;
        font-size: 14px;
        margin-top: 10px;
        text-align: center;
        display: none;
    }
    
    .success-message {
        color: #28a745;
        font-size: 14px;
        margin-top: 10px;
        text-align: center;
        display: none;
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = loadingStyles;
document.head.appendChild(styleSheet);

// Função para mostrar loading no botão
function showButtonLoading(button, loadingText = 'Carregando...') {
    if (!button) return;
    
    const originalText = button.innerHTML;
    button.classList.add('btn-loading');
    button.innerHTML = `<span class="btn-text">${originalText}</span>`;
    button.disabled = true;
    
    return () => {
        button.classList.remove('btn-loading');
        button.innerHTML = originalText;
        button.disabled = false;
    };
}

// Função para mostrar mensagens de erro/sucesso
function showMessage(container, message, type = 'error') {
    let messageElement = container.querySelector('.error-message, .success-message');
    
    if (!messageElement) {
        messageElement = document.createElement('div');
        container.appendChild(messageElement);
    }
    
    messageElement.className = type === 'error' ? 'error-message' : 'success-message';
    messageElement.textContent = message;
    messageElement.style.display = 'block';
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
        if (messageElement) {
            messageElement.style.display = 'none';
        }
    }, 5000);
}

// Event listener para quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script carregado, configurando eventos...');
    
    // Verificar se está autenticado ao carregar a página
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user && (window.location.pathname.includes('index.html') || window.location.pathname === '/')) {
                console.log('Usuário já autenticado, redirecionando...');
                navigateToPage('dashboard.html');
            }
        });
    }
    
    // Configurar evento do botão de login
    const btnLogin = document.querySelector('.btn-login');
    if (btnLogin) {
        btnLogin.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const formContainer = this.closest('.sign-in');
            const emailInput = formContainer.querySelector('input[type="email"]');
            const passwordInput = formContainer.querySelector('input[type="password"]');
            
            if (!emailInput || !passwordInput) {
                console.error('Campos de entrada não encontrados');
                return;
            }
            
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!email || !password) {
                showMessage(formContainer, 'Por favor, preencha todos os campos', 'error');
                return;
            }
            
            // Mostrar loading
            const resetButton = showButtonLoading(this);
            
            try {
                // Fazer login usando Firebase
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                    const user = userCredential.user;
                    
                    console.log('Login realizado com sucesso:', user.email);
                    showMessage(formContainer, 'Login realizado com sucesso!', 'success');
                    
                    // Aguardar um pouco antes de redirecionar para mostrar a mensagem
                    setTimeout(() => {
                        navigateToPage('dashboard.html');
                    }, 1000);
                    
                } else {
                    throw new Error('Firebase não está disponível');
                }
                
            } catch (error) {
                console.error('Erro no login:', error);
                
                let errorMessage = 'Erro no login';
                if (error.code) {
                    switch (error.code) {
                        case 'auth/user-not-found':
                            errorMessage = 'Usuário não encontrado';
                            break;
                        case 'auth/wrong-password':
                            errorMessage = 'Senha incorreta';
                            break;
                        case 'auth/invalid-email':
                            errorMessage = 'Email inválido';
                            break;
                        case 'auth/user-disabled':
                            errorMessage = 'Conta desabilitada';
                            break;
                        case 'auth/too-many-requests':
                            errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
                            break;
                        default:
                            errorMessage = error.message || 'Erro desconhecido';
                    }
                } else {
                    errorMessage = error.message || 'Erro desconhecido';
                }
                
                showMessage(formContainer, errorMessage, 'error');
                
            } finally {
                resetButton();
            }
        });
    }
    
    // Configurar evento do formulário de cadastro
    const signUpForm = document.querySelector('.sign-up form');
    if (signUpForm) {
        signUpForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const passwordInput = this.querySelector('input[type="password"]');
            const submitButton = this.querySelector('button[type="submit"]') || this.querySelector('button');
            
            if (!emailInput || !passwordInput) {
                console.error('Campos de entrada não encontrados no formulário de cadastro');
                return;
            }
            
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!email || !password) {
                showMessage(this, 'Por favor, preencha todos os campos', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage(this, 'A senha deve ter pelo menos 6 caracteres', 'error');
                return;
            }
            
            // Mostrar loading
            const resetButton = showButtonLoading(submitButton);
            
            try {
                // Criar conta usando Firebase
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;
                    
                    console.log('Conta criada com sucesso:', user.email);
                    
                    // Criar documento do usuário no Firestore
                    if (firebase.firestore) {
                        await firebase.firestore().collection('usuarios').doc(user.uid).set({
                            email: user.email,
                            dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
                            ativo: true
                        });
                    }
                    
                    showMessage(this, 'Conta criada com sucesso!', 'success');
                    
                    // Aguardar um pouco antes de redirecionar
                    setTimeout(() => {
                        navigateToPage('dashboard.html');
                    }, 1500);
                    
                } else {
                    throw new Error('Firebase não está disponível');
                }
                
            } catch (error) {
                console.error('Erro no cadastro:', error);
                
                let errorMessage = 'Erro no cadastro';
                if (error.code) {
                    switch (error.code) {
                        case 'auth/email-already-in-use':
                            errorMessage = 'Este email já está em uso';
                            break;
                        case 'auth/invalid-email':
                            errorMessage = 'Email inválido';
                            break;
                        case 'auth/weak-password':
                            errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
                            break;
                        case 'auth/network-request-failed':
                            errorMessage = 'Erro de conexão. Verifique sua internet';
                            break;
                        default:
                            errorMessage = error.message || 'Erro desconhecido';
                    }
                } else {
                    errorMessage = error.message || 'Erro desconhecido';
                }
                
                showMessage(this, errorMessage, 'error');
                
            } finally {
                resetButton();
            }
        });
    }
    
    // Configurar validação em tempo real dos campos
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !isValidEmail(email)) {
                this.style.borderColor = '#dc3545';
                this.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
            } else {
                this.style.borderColor = '';
                this.style.boxShadow = '';
            }
        });
        
        input.addEventListener('input', function() {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        });
    });
    
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const password = this.value.trim();
            if (password && password.length < 6) {
                this.style.borderColor = '#dc3545';
                this.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
            } else {
                this.style.borderColor = '';
                this.style.boxShadow = '';
            }
        });
        
        input.addEventListener('input', function() {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        });
    });
    
    // Permitir login/cadastro com Enter
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const submitButton = this.querySelector('button[type="submit"]') || this.querySelector('button');
                if (submitButton) {
                    submitButton.click();
                }
            }
        });
    });
});

// Função para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Função para limpar mensagens de erro/sucesso
function clearMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => msg.style.display = 'none');
}

// Limpar mensagens quando trocar de formulário
if (registerBtn) {
    registerBtn.addEventListener("click", clearMessages);
}

if (loginBtn) {
    loginBtn.addEventListener("click", clearMessages);
}

console.log('Script carregado com sucesso!');