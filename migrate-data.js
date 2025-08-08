const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Rutas de archivos
const CSV_DIR = path.join(__dirname, 'csv');
const DATA_DIR = path.join(__dirname, 'data');

// Función para leer CSV con separador personalizado
function readCsvWithSeparator(filePath, separator = ';') {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            resolve(results);
            return;
        }
        
        fs.createReadStream(filePath)
            .pipe(csv({ separator }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
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

// Función principal de migración
async function migrateData() {
    try {
        console.log('🔄 Iniciando migración de datos...');
        
        // Leer datos originales
        const citasOriginales = await readCsvWithSeparator(path.join(CSV_DIR, 'citas.csv'));
        const pacientesOriginales = await readCsvWithSeparator(path.join(CSV_DIR, 'pacientes.csv'));
        const medicosOriginales = await readCsvWithSeparator(path.join(CSV_DIR, 'Medico.csv'));
        const especialidadesOriginales = await readCsvWithSeparator(path.join(CSV_DIR, 'Especialidad.csv'));
        
        console.log(`📊 Datos leídos:`);
        console.log(`   - Citas: ${citasOriginales.length}`);
        console.log(`   - Pacientes: ${pacientesOriginales.length}`);
        console.log(`   - Médicos: ${medicosOriginales.length}`);
        console.log(`   - Especialidades: ${especialidadesOriginales.length}`);
        
        // Crear mapeo de IDs
        const pacientesMap = {};
        pacientesOriginales.forEach(p => {
            pacientesMap[p.id_paciente] = p['Nombre Paciente'];
        });
        
        const medicosMap = {};
        medicosOriginales.forEach(m => {
            medicosMap[m.id_medico] = m.Médico;
        });
        
        const especialidadesMap = {};
        especialidadesOriginales.forEach(e => {
            especialidadesMap[e.id_especialidad] = e.Especialidad;
        });
        
        // Convertir citas al formato de la aplicación
        const citasConvertidas = citasOriginales.map((cita, index) => ({
            id: (index + 1).toString(),
            paciente: pacientesMap[cita.id_paciente] || `Paciente ${cita.id_paciente}`,
            doctor: medicosMap[cita.id_medico] || `Médico ${cita.id_medico}`,
            fecha: cita['Fecha Cita'],
            hora: cita['Hora Cita'],
            motivo: cita.Motivo,
            estado: cita.id_estatus.toLowerCase()
        }));
        
        // Mantener solo el usuario admin
        const usuarios = [
            {
                id: '1',
                usuario: 'admin',
                email: 'admin@crudclinic.com',
                password: 'admin123'
            }
        ];
        
        // Escribir archivos convertidos
        await writeCsvFile(
            path.join(DATA_DIR, 'citas.csv'),
            citasConvertidas,
            [
                { id: 'id', title: 'id' },
                { id: 'paciente', title: 'paciente' },
                { id: 'doctor', title: 'doctor' },
                { id: 'fecha', title: 'fecha' },
                { id: 'hora', title: 'hora' },
                { id: 'motivo', title: 'motivo' },
                { id: 'estado', title: 'estado' }
            ]
        );
        
        await writeCsvFile(
            path.join(DATA_DIR, 'usuarios.csv'),
            usuarios,
            [
                { id: 'id', title: 'id' },
                { id: 'usuario', title: 'usuario' },
                { id: 'email', title: 'email' },
                { id: 'password', title: 'password' }
            ]
        );
        
        console.log('✅ Migración completada exitosamente!');
        console.log(`📋 Citas migradas: ${citasConvertidas.length}`);
        console.log(`👥 Usuario admin creado`);
        console.log('\n🔑 Credenciales de acceso:');
        console.log('   - admin@crudclinic.com / admin123');
        console.log('\n📊 Datos disponibles en el dashboard:');
        console.log(`   - ${citasConvertidas.length} citas médicas`);
        console.log(`   - Pacientes reales con nombres completos`);
        console.log(`   - Médicos especialistas`);
        console.log(`   - Estados variados: confirmada, pendiente, cancelada, reprogramada`);
        
    } catch (error) {
        console.error('❌ Error en la migración:', error);
    }
}

// Ejecutar migración
migrateData();
