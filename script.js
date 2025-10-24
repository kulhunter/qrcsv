document.addEventListener('DOMContentLoaded', () => {
    const csvFile = document.getElementById('csvFile');
    const generateBtn = document.getElementById('generateBtn');
    const status = document.getElementById('status');
    const qrContainer = document.getElementById('qr-container');

    generateBtn.addEventListener('click', () => {
        // 0. Revisar si hay un archivo
        if (csvFile.files.length === 0) {
            status.innerHTML = '<p style="color: red;">Por favor, selecciona un archivo CSV primero.</p>';
            return;
        }

        const file = csvFile.files[0];

        // 1. Limpiar la UI y mostrar loader
        qrContainer.innerHTML = '';
        status.innerHTML = '<div class="loader"></div> <p>Procesando archivo...</p>';
        generateBtn.disabled = true;

        // 2. Usar PapaParse para leer el CSV
        Papa.parse(file, {
            header: true, // ¡IMPORTANTE! Usa la primera fila como cabecera
            skipEmptyLines: true,
            bom: true, // NUEVO: Añadido para ignorar caracteres BOM de Excel
            
            complete: (results) => {
                const data = results.data;
                
                if (data.length === 0) {
                    status.innerHTML = '<p style="color: red;">El archivo está vacío o no se pudo leer.</p>';
                    generateBtn.disabled = false;
                    return;
                }

                // 3. Iterar por cada fila del CSV
                let qrCount = 0;
                for (const row of data) {
                    
                    // 4. EXTRAER Y LIMPIAR DATOS
                    const name = row['Nombre y apellido'] ? row['Nombre y apellido'].trim() : '';
                    const email = row['Email'] ? row['Email'].trim() : '';
                    let phone = row['WhatsApp'] ? String(row['WhatsApp']).replace(/\D/g, '') : '';
                    
                    if (!name && !email && !phone) {
                        continue;
                    }
                    
                    // 5. GENERAR EL TEXTO vCard
                    const vCard = createVCard(name, email, phone);

                    // 6. Crear la "tarjeta" en la web
                    const card = document.createElement('div');
                    card.className = 'qr-card';
                    const title = document.createElement('p');
                    title.textContent = name || email || phone;
                    card.appendChild(title);
                    const qrCodeEl = document.createElement('div');
                    card.appendChild(qrCodeEl);
                    qrContainer.appendChild(card);

                    // 7. Generar el QR usando la librería
                    new QRCode(qrCodeEl, {
                        text: vCard,
                        width: 180,
                        height: 180,
                        correctLevel: QRCode.CorrectLevel.M
                    });
                    
                    qrCount++;
                }

                // 8. Finalizar
                status.innerHTML = `<p style="color: green;">¡Se generaron ${qrCount} códigos QR!</p>`;
                generateBtn.disabled = false;
            },
            error: (err) => {
                status.innerHTML = `<p style="color: red;">Error al procesar el archivo: ${err.message}</p>`;
                generateBtn.disabled = false;
            }
        });
    });

    /**
     * Función para crear el string de la vCard
     */
    function createVCard(name, email, phone) {
        let vCard = "BEGIN:VCARD\n";
        vCard += "VERSION:3.0\n";

        let nameParts = name.split(' ');
        let firstName = nameParts.shift() || '';
        let lastName = nameParts.join(' ') || '';

        if (!lastName) {
            lastName = firstName;
            firstName = '';
        }
        
        vCard += `N:${lastName};${firstName};;;\n`;
        vCard += `FN:${name}\n`;

        if (phone) {
            vCard += `TEL;TYPE=CELL:${phone}\n`;
        }

        if (email) {
            vCard += `EMAIL:${email}\n`;
        }

        vCard += "END:VCARD";
        return vCard;
    }
});
