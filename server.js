const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Rutas de los archivos CSV
const USUARIOS_CSV = path.join(__dirname, 'data', 'usuarios.csv');
const CITAS_CSV = path.join(__dirname, 'data', 'citas.csv');

console.log('🔍 Configuración de archivos CSV:');
console.log('📁 USUARIOS_CSV:', USUARIOS_CSV);
console.log('📁 CITAS_CSV:', CITAS_CSV);
console.log('📄 Archivo usuarios existe:', require('fs').existsSync(USUARIOS_CSV));
console.log('📄 Archivo citas existe:', require('fs').existsSync(CITAS_CSV));

// Función para leer CSV
function readCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            console.log('⚠️ Archivo no encontrado:', filePath);
            resolve(results);
            return;
        }
        
        console.log('📖 Leyendo archivo CSV:', filePath);
        fs.createReadStream(filePath)
            .pipe(csv({ separator: ',' }))
            .on('data', (data) => {
                console.log('📄 Datos leídos:', data);
                results.push(data);
            })
            .on('end', () => {
                console.log('✅ Total de registros leídos:', results.length);
                resolve(results);
            })
            .on('error', (error) => {
                console.error('❌ Error leyendo CSV:', error);
                reject(error);
            });
    });
}

// Función para escribir CSV
function writeCsvFile(filePath, data, headers) {
    const csvWriter = createCsvWriter({
        path: filePath,
        header: headers
    });
    
    return csvWriter.writeRecords(data);
}

// Función para obtener el siguiente ID
function getNextId(data) {
    if (data.length === 0) return 1;
    const maxId = Math.max(...data.map(item => parseInt(item.id)));
    return maxId + 1;
}

// Rutas de la API

// GET - Obtener todas las citas
app.get('/api/citas', async (req, res) => {
    try {
        console.log('📋 Solicitando citas desde:', req.headers.origin);
        console.log('📁 Ruta del archivo CSV:', CITAS_CSV);
        console.log('📄 Archivo existe:', fs.existsSync(CITAS_CSV));
        const citas = await readCsvFile(CITAS_CSV);
        console.log('✅ Citas cargadas:', citas.length);
        console.log('📊 Primera cita:', citas[0]);
        res.json(citas);
    } catch (error) {
        console.error('❌ Error al leer citas:', error);
        res.status(500).json({ error: 'Error al leer las citas' });
    }
});

// POST - Crear nueva cita
app.post('/api/citas', async (req, res) => {
    try {
        const { paciente, doctor, fecha, hora, motivo } = req.body;
        
        if (!paciente || !doctor || !fecha || !hora) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
        
        const citas = await readCsvFile(CITAS_CSV);
        const nuevaCita = {
            id: getNextId(citas).toString(),
            paciente,
            doctor,
            fecha,
            hora,
            motivo: motivo || 'Consulta',
            estado: 'pendiente'
        };
        
        citas.push(nuevaCita);
        
        await writeCsvFile(CITAS_CSV, citas, [
            { id: 'id', title: 'id' },
            { id: 'paciente', title: 'paciente' },
            { id: 'doctor', title: 'doctor' },
            { id: 'fecha', title: 'fecha' },
            { id: 'hora', title: 'hora' },
            { id: 'motivo', title: 'motivo' },
            { id: 'estado', title: 'estado' }
        ]);
        
        res.status(201).json(nuevaCita);
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({ error: 'Error al crear la cita' });
    }
});

// PUT - Actualizar cita
app.put('/api/citas/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { paciente, doctor, fecha, hora, motivo, estado } = req.body;
        
        const citas = await readCsvFile(CITAS_CSV);
        const citaIndex = citas.findIndex(cita => cita.id === id);
        
        if (citaIndex === -1) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        
        citas[citaIndex] = { 
            ...citas[citaIndex], 
            paciente, 
            doctor, 
            fecha, 
            hora, 
            motivo, 
            estado 
        };
        
        await writeCsvFile(CITAS_CSV, citas, [
            { id: 'id', title: 'id' },
            { id: 'paciente', title: 'paciente' },
            { id: 'doctor', title: 'doctor' },
            { id: 'fecha', title: 'fecha' },
            { id: 'hora', title: 'hora' },
            { id: 'motivo', title: 'motivo' },
            { id: 'estado', title: 'estado' }
        ]);
        
        res.json(citas[citaIndex]);
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        res.status(500).json({ error: 'Error al actualizar la cita' });
    }
});

// DELETE - Eliminar cita
app.delete('/api/citas/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const citas = await readCsvFile(CITAS_CSV);
        const citaIndex = citas.findIndex(cita => cita.id === id);
        
        if (citaIndex === -1) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        
        const citaEliminada = citas.splice(citaIndex, 1)[0];
        
        await writeCsvFile(CITAS_CSV, citas, [
            { id: 'id', title: 'id' },
            { id: 'paciente', title: 'paciente' },
            { id: 'doctor', title: 'doctor' },
            { id: 'fecha', title: 'fecha' },
            { id: 'hora', title: 'hora' },
            { id: 'motivo', title: 'motivo' },
            { id: 'estado', title: 'estado' }
        ]);
        
        res.json({ message: 'Cita eliminada exitosamente', cita: citaEliminada });
    } catch (error) {
        console.error('Error al eliminar cita:', error);
        res.status(500).json({ error: 'Error al eliminar la cita' });
    }
});

// POST - Login de usuario
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuarios = await readCsvFile(USUARIOS_CSV);
        
        const usuario = usuarios.find(u => u.email === email && u.password === password);
        
        if (usuario) {
            res.json({ 
                success: true, 
                message: 'Login exitoso',
                usuario: { id: usuario.id, usuario: usuario.usuario, email: usuario.email }
            });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el login' });
    }
});

// POST - Registro de usuario
app.post('/api/register', async (req, res) => {
    try {
        const { newUsuario, newEmail, newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Las contraseñas no coinciden' });
        }
        
        const usuarios = await readCsvFile(USUARIOS_CSV);
        
        if (usuarios.find(u => u.email === newEmail)) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        
        const nuevoUsuario = {
            id: getNextId(usuarios).toString(),
            usuario: newUsuario,
            email: newEmail,
            password: newPassword
        };
        
        usuarios.push(nuevoUsuario);
        
        await writeCsvFile(USUARIOS_CSV, usuarios, [
            { id: 'id', title: 'id' },
            { id: 'usuario', title: 'usuario' },
            { id: 'email', title: 'email' },
            { id: 'password', title: 'password' }
        ]);
        
        res.status(201).json({ 
            success: true, 
            message: 'Usuario registrado exitosamente',
            usuario: { id: nuevoUsuario.id, usuario: nuevoUsuario.usuario, email: nuevoUsuario.email }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el registro' });
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta de documentación de la API
app.get('/api', (req, res) => {
    res.json({
        message: 'API de CrudClinic',
        version: '1.0.0',
        endpoints: {
            'GET /api/citas': 'Obtener todas las citas',
            'POST /api/citas': 'Crear nueva cita',
            'PUT /api/citas/:id': 'Actualizar cita',
            'DELETE /api/citas/:id': 'Eliminar cita',
            'POST /api/login': 'Autenticación de usuario',
            'POST /api/register': 'Registro de usuario'
        },
        status: 'running',
        dataStorage: 'CSV files'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor CrudClinic corriendo en http://localhost:${PORT}`);
    console.log(`📋 API disponible en http://localhost:${PORT}/api`);
    console.log(`💾 Datos almacenados en archivos CSV`);
});
