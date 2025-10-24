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
            // NO especificamos encoding. Dejamos que PapaParse lo autodetecte.
            // Esto soluciona cuelgues si el CSV no es UTF-8.
            
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
                    
                    // 4. EXTRAER Y LIMPIAR DATOS (¡AQUÍ ESTÁ LA PERSONALIZACIÓN!)
                    
                    // Usamos los nombres exactos de tu CSV
                    const name = row['Nombre y apellido'] ? row['Nombre y apellido'].trim() : '';
                    const email = row['Email'] ? row['Email'].trim() : '';
                    
                    // Limpiamos el WhatsApp: quitamos espacios, comillas, y todo lo que no sea número
                    let phone = row['WhatsApp'] ? String(row['WhatsApp']).replace(/\D/g, '') : '';
                    
                    // Si la fila no tiene ningún dato útil, la saltamos
                    if (!name && !email && !phone) {
                        continue;
                    }
                    
                    // 5. GENERAR EL TEXTO vCard
                    const vCard = createVCard(name, email, phone);

                    // 6. Crear la "tarjeta" en la web
                    const card = document.createElement('div');
                    card.className = 'qr-card';

                    // Añadir el nombre como título
                    const title = document.createElement('p');
                    title.textContent = name || email || phone; // Muestra el nombre, o el email/tel si no hay nombre
                    card.appendChild(title);

                    // Crear el div que contendrá el QR
                    const qrCodeEl = document.createElement('div');
                    card.appendChild(qrCodeEl);

                    // Añadir la tarjeta al contenedor
                    qrContainer.appendChild(card);

                    // 7. Generar el QR usando la librería
                    new QRCode(qrCodeEl, {
                        text: vCard,
                        width: 180, // Tamaño del QR
                        height: 180,
                        correctLevel: QRCode.CorrectLevel.M // Nivel de corrección
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

        // Formatear el nombre para vCard (N: Apellido;Nombre)
        let nameParts = name.split(' ');
        let firstName = nameParts.shift() || ''; // El primero es el nombre
        let lastName = nameParts.join(' ') || '';  // El resto es apellido

        // Si no hay apellido, usamos el nombre como apellido (mejor que nada)
        if (!lastName) {
            lastName = firstName;
            firstName = '';
        }
        
        vCard += `N:${lastName};${firstName};;;\n`; // Campo N (Name)
        vCard += `FN:${name}\n`;                      // Campo FN (Full Name)

        // Añadir teléfono si existe
        if (phone) {
            vCard += `TEL;TYPE=CELL:${phone}\n`;
        }

        // Añadir email si existe
        if (email) {
            vCard += `EMAIL:${email}\n`;
        }

        vCard += "END:VCARD";
        return vCard;
    }
});
