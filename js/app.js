// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Clase para manejar la comunicación con la API
class ApiService {
    static async makeRequest(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('Error en API:', error);
            throw error;
        }
    }

    // Login de usuario
    static async login(email, password) {
        return this.makeRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    // Registro de usuario
    static async register(usuario, email, password, confirmPassword) {
        return this.makeRequest('/register', {
            method: 'POST',
            body: JSON.stringify({ 
                newUsuario: usuario, 
                newEmail: email, 
                newPassword: password, 
                confirmPassword 
            })
        });
    }

    // Obtener citas
    static async getCitas() {
        return this.makeRequest('/citas');
    }

    // Crear cita
    static async createCita(cita) {
        return this.makeRequest('/citas', {
            method: 'POST',
            body: JSON.stringify(cita)
        });
    }

    // Actualizar cita
    static async updateCita(id, cita) {
        return this.makeRequest(`/citas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(cita)
        });
    }

    // Eliminar cita
    static async deleteCita(id) {
        return this.makeRequest(`/citas/${id}`, {
            method: 'DELETE'
        });
    }
}

// Clase para manejar usuarios
class UserManager {
    constructor() {
        this.currentUser = null;
    }

    // Autenticar usuario
    async loginUser(email, password) {
        try {
            const response = await ApiService.login(email, password);
            this.currentUser = response.usuario;
            return response.usuario;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Registrar usuario
    async registerUser(username, email, password, confirmPassword) {
        try {
            const response = await ApiService.register(username, email, password, confirmPassword);
            return response.usuario;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Verificar si hay usuario logueado
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Cerrar sesión
    logout() {
        this.currentUser = null;
    }
}

// Inicializar el gestor de usuarios
const userManager = new UserManager();

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');

// Función para mostrar mensajes
function showMessage(message, type = 'success') {
    // Crear alerta Bootstrap
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Insertar al inicio del formulario activo
    const activeForm = loginForm.style.display !== 'none' ? loginForm : registerForm;
    activeForm.insertBefore(alertDiv, activeForm.firstChild);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Función para limpiar formularios
function clearForms() {
    loginForm.reset();
    registerForm.reset();
}

// Función para cambiar entre formularios
function toggleForms() {
    const loginVisible = loginForm.style.display !== 'none';
    
    if (loginVisible) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }
    
    clearForms();
}

// Event listeners
showRegisterBtn.addEventListener('click', toggleForms);
showLoginBtn.addEventListener('click', toggleForms);

// Manejar login
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return;
    }

    try {
        const user = await userManager.loginUser(email, password);
        showMessage(`¡Bienvenido ${user.usuario}!`);
        
        // Guardar usuario en localStorage y redirigir al dashboard
        localStorage.setItem('currentUser', JSON.stringify(user));
        setTimeout(() => {
            window.location.href = 'view/dashboard.html';
        }, 1000);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Manejar registro
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('newUsuario').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validaciones
    if (!username || !email || !password || !confirmPassword) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }

    if (username.length < 3) {
        showMessage('El usuario debe tener al menos 3 caracteres', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return;
    }

    try {
        const newUser = await userManager.registerUser(username, email, password, confirmPassword);
        showMessage(`¡Usuario ${newUser.usuario} creado exitosamente!`);
        
        // Cambiar al formulario de login
        setTimeout(() => {
            toggleForms();
        }, 2000);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Verificar si ya hay un usuario logueado al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    if (userManager.isLoggedIn()) {
        showMessage(`Ya estás logueado como ${userManager.currentUser.usuario}`);
    }
});
