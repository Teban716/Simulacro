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

// Clase para manejar el dashboard
class DashboardManager {
    constructor() {
        this.citas = [];
        this.currentUser = this.getCurrentUser();
        this.initializeEventListeners();
        this.loadCitas();
    }

    // Obtener usuario actual desde localStorage
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    // Guardar usuario en localStorage
    saveCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Limpiar datos de sesión
    clearSession() {
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }

    // Inicializar event listeners
    initializeEventListeners() {
        // Botón de nueva cita
        document.getElementById('saveCitaBtn').addEventListener('click', () => {
            this.saveCita();
        });

        // Botón de cerrar sesión
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.clearSession();
        });

        // Filtros
        document.getElementById('filterEstado').addEventListener('change', () => {
            this.filterCitas();
        });

        document.getElementById('filterFecha').addEventListener('change', () => {
            this.filterCitas();
        });

        document.getElementById('filterPaciente').addEventListener('input', () => {
            this.filterCitas();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Modal de eliminación
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteCita();
        });
    }

    // Cargar citas desde la API
    async loadCitas() {
        try {
            console.log('🔄 Cargando citas...');
            this.citas = await ApiService.getCitas();
            console.log('✅ Citas cargadas:', this.citas);
            this.displayCitas();
            this.updateUserInfo();
        } catch (error) {
            console.error('❌ Error al cargar citas:', error);
            this.showMessage('Error al cargar las citas: ' + error.message, 'error');
        }
    }

    // Mostrar citas en la tabla
    displayCitas(citasToShow = this.citas) {
        console.log('📊 Mostrando citas:', citasToShow);
        const tbody = document.getElementById('citasTableBody');
        const noCitasMessage = document.getElementById('noCitasMessage');

        if (citasToShow.length === 0) {
            console.log('📭 No hay citas para mostrar');
            tbody.innerHTML = '';
            noCitasMessage.style.display = 'block';
            return;
        }

        console.log('✅ Mostrando', citasToShow.length, 'citas');
        noCitasMessage.style.display = 'none';
        tbody.innerHTML = citasToShow.map(cita => this.createCitaRow(cita)).join('');
    }

    // Crear fila de cita
    createCitaRow(cita) {
        const estadoClass = this.getEstadoClass(cita.estado);
        const estadoBadge = this.getEstadoBadge(cita.estado);
        
        return `
            <tr>
                <td>${cita.id}</td>
                <td>${cita.paciente}</td>
                <td>${cita.doctor}</td>
                <td>${this.formatDate(cita.fecha)}</td>
                <td>${cita.hora}</td>
                <td>${cita.motivo || '-'}</td>
                <td><span class="badge ${estadoClass}">${estadoBadge}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="dashboard.editCita(${cita.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dashboard.confirmDelete(${cita.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    // Obtener clase CSS para el estado
    getEstadoClass(estado) {
        const classes = {
            'pendiente': 'bg-warning',
            'confirmada': 'bg-success',
            'cancelada': 'bg-danger'
        };
        return classes[estado] || 'bg-secondary';
    }

    // Obtener badge para el estado
    getEstadoBadge(estado) {
        const badges = {
            'pendiente': 'Pendiente',
            'confirmada': 'Confirmada',
            'cancelada': 'Cancelada'
        };
        return badges[estado] || estado;
    }

    // Formatear fecha
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    // Filtrar citas
    filterCitas() {
        const estadoFilter = document.getElementById('filterEstado').value;
        const fechaFilter = document.getElementById('filterFecha').value;
        const pacienteFilter = document.getElementById('filterPaciente').value.toLowerCase();

        let filteredCitas = this.citas.filter(cita => {
            const matchEstado = !estadoFilter || cita.estado === estadoFilter;
            const matchFecha = !fechaFilter || cita.fecha === fechaFilter;
            const matchPaciente = !pacienteFilter || cita.paciente.toLowerCase().includes(pacienteFilter);
            
            return matchEstado && matchFecha && matchPaciente;
        });

        this.displayCitas(filteredCitas);
    }

    // Limpiar filtros
    clearFilters() {
        document.getElementById('filterEstado').value = '';
        document.getElementById('filterFecha').value = '';
        document.getElementById('filterPaciente').value = '';
        this.displayCitas();
    }

    // Guardar cita (crear o actualizar)
    async saveCita() {
        const citaId = document.getElementById('citaId').value;
        const cita = {
            paciente: document.getElementById('paciente').value,
            doctor: document.getElementById('doctor').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            motivo: document.getElementById('motivo').value,
            estado: document.getElementById('estado').value
        };

        // Validaciones
        if (!cita.paciente || !cita.doctor || !cita.fecha || !cita.hora) {
            this.showMessage('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        try {
            if (citaId) {
                // Actualizar cita existente
                await ApiService.updateCita(citaId, cita);
                this.showMessage('Cita actualizada exitosamente');
            } else {
                // Crear nueva cita
                await ApiService.createCita(cita);
                this.showMessage('Cita creada exitosamente');
            }

            // Cerrar modal y recargar citas
            const modal = bootstrap.Modal.getInstance(document.getElementById('citaModal'));
            modal.hide();
            this.loadCitas();
            this.clearForm();
        } catch (error) {
            this.showMessage('Error al guardar la cita: ' + error.message, 'error');
        }
    }

    // Editar cita
    editCita(id) {
        const cita = this.citas.find(c => c.id === id);
        if (!cita) return;

        document.getElementById('modalTitle').textContent = 'Editar Cita';
        document.getElementById('citaId').value = cita.id;
        document.getElementById('paciente').value = cita.paciente;
        document.getElementById('doctor').value = cita.doctor;
        document.getElementById('fecha').value = cita.fecha;
        document.getElementById('hora').value = cita.hora;
        document.getElementById('motivo').value = cita.motivo || '';
        document.getElementById('estado').value = cita.estado;

        const modal = new bootstrap.Modal(document.getElementById('citaModal'));
        modal.show();
    }

    // Confirmar eliminación
    confirmDelete(id) {
        const cita = this.citas.find(c => c.id === id);
        if (!cita) return;

        document.getElementById('deleteCitaInfo').textContent = 
            `${cita.paciente} - ${cita.doctor} - ${this.formatDate(cita.fecha)} ${cita.hora}`;
        
        document.getElementById('confirmDeleteBtn').setAttribute('data-cita-id', id);
        
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }

    // Eliminar cita
    async deleteCita() {
        const citaId = document.getElementById('confirmDeleteBtn').getAttribute('data-cita-id');
        
        try {
            await ApiService.deleteCita(citaId);
            this.showMessage('Cita eliminada exitosamente');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            this.loadCitas();
        } catch (error) {
            this.showMessage('Error al eliminar la cita: ' + error.message, 'error');
        }
    }

    // Limpiar formulario
    clearForm() {
        document.getElementById('citaForm').reset();
        document.getElementById('citaId').value = '';
        document.getElementById('modalTitle').textContent = 'Nueva Cita';
    }

    // Actualizar información del usuario
    updateUserInfo() {
        if (this.currentUser) {
            document.getElementById('currentUser').textContent = this.currentUser.usuario;
        }
    }

    // Mostrar mensajes
    showMessage(message, type = 'success') {
        // Crear alerta Bootstrap
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Inicializar dashboard cuando se carga la página
let dashboard;
document.addEventListener('DOMContentLoaded', function() {
    dashboard = new DashboardManager();
});

// Event listener para el modal de nueva cita
document.getElementById('citaModal').addEventListener('hidden.bs.modal', function() {
    dashboard.clearForm();
});
