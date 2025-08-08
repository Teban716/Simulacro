const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CITAS_CSV = path.join(__dirname, 'data', 'citas.csv');

console.log('🔍 Probando lectura del archivo CSV...');
console.log('📁 Ruta del archivo:', CITAS_CSV);
console.log('📄 Archivo existe:', fs.existsSync(CITAS_CSV));

if (fs.existsSync(CITAS_CSV)) {
    console.log('📊 Contenido del archivo:');
    const content = fs.readFileSync(CITAS_CSV, 'utf8');
    console.log(content.substring(0, 500));
    
    console.log('\n🔄 Leyendo con csv-parser...');
    const results = [];
    
    fs.createReadStream(CITAS_CSV)
        .pipe(csv({ separator: ',' }))
        .on('data', (data) => {
            console.log('📄 Datos leídos:', data);
            results.push(data);
        })
        .on('end', () => {
            console.log('✅ Total de registros leídos:', results.length);
            console.log('📋 Primera cita:', results[0]);
        })
        .on('error', (error) => {
            console.error('❌ Error leyendo CSV:', error);
        });
} else {
    console.log('❌ El archivo no existe');
}
