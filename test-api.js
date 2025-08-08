const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/citas',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);
    console.log(`📋 Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('📊 Respuesta completa:');
        console.log(data);
        
        try {
            const jsonData = JSON.parse(data);
            console.log(`📈 Total de citas: ${jsonData.length}`);
            if (jsonData.length > 0) {
                console.log('📋 Primera cita:', jsonData[0]);
            }
        } catch (error) {
            console.error('❌ Error parseando JSON:', error);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error en la petición:', error);
});

req.end();
