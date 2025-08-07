// Clase para manejar usuarios
class UserManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
    }

    // Cargar usuarios desde localStorage
    loadUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }

    // Guardar usuarios en localStorage
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // Crear nuevo usuario
    createUser(username, email, password) {
        // Verificar si el usuario ya existe
        if (this.users.find(user => user.username === username)) {
            throw new Error('El usuario ya existe');
        }

        // Verificar si el email ya existe
        if (this.users.find(user => user.email === email)) {
            throw new Error('El email ya está registrado');
        }

        // Crear nuevo usuario
        const newUser = {
            id: Date.now(),
            username,
            email,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();
        return newUser;
    }

    // Autenticar usuario por email
    loginUser(email, password) {
        const user = this.users.find(u => u.email === email);
        
        if (!user) {
            throw new Error('Email no encontrado');
        }

        if (user.password !== this.hashPassword(password)) {
            throw new Error('Contraseña incorrecta');
        }

        this.currentUser = user;
        return user;
    }

    // Hash simple de contraseña (en producción usar bcrypt)
    hashPassword(password) {
        return btoa(password); // Codificación base64 simple
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
loginForm.addEventListener('submit', function(e) {
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
        const user = userManager.loginUser(email, password);
        showMessage(`¡Bienvenido ${user.username}!`);
        
        // Simular redirección después de login exitoso
        setTimeout(() => {
            alert('Login exitoso! Redirigiendo al dashboard...');
            // Aquí puedes redirigir a la página principal
            // window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Manejar registro
registerForm.addEventListener('submit', function(e) {
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
        const newUser = userManager.createUser(username, email, password);
        showMessage(`¡Usuario ${newUser.username} creado exitosamente!`);
        
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
        showMessage(`Ya estás logueado como ${userManager.currentUser.username}`);
    }
});

// Función para crear usuario de prueba (opcional)
function createTestUser() {
    try {
        userManager.createUser('admin', 'admin@test.com', '123456');
        console.log('Usuario de prueba creado: admin@test.com/123456');
    } catch (error) {
        console.log('Usuario de prueba ya existe');
    }
}

// Crear usuario de prueba si no hay usuarios
if (userManager.users.length === 0) {
    createTestUser();
}
