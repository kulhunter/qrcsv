document.addEventListener('DOMContentLoaded', () => {
    // --- INICIO: DEBUG ---
    console.log("Generador QR v4 cargado. ¡Listo para depurar!");
    // --- FIN: DEBUG ---

    const csvFile = document.getElementById('csvFile');
    const generateBtn = document.getElementById('generateBtn');
    const status = document.getElementById('status');
    const qrContainer = document.getElementById('qr-container');

    let qrCount = 0; // Mover el contador fuera

    generateBtn.addEventListener('click', () => {
        // 0. Revisar si hay un archivo
        if (csvFile.files.length === 0) {
            status.innerHTML = '<p style="color: red;">Por favor, selecciona un archivo CSV primero.</p>';
            return;
        }

        const file = csvFile.files[0];

        // 1. Limpiar la UI y mostrar loader
        qrContainer.innerHTML = '';
        qrCount = 0; // Resetear contador
        status.innerHTML = '<div class="loader"></div> <p>Procesando archivo...</p>';
        generateBtn.disabled = true;

        // --- INICIO: DEBUG ---
        console.log("Iniciando parseo de PapaParse...");
        // --- FIN: DEBUG ---

        // 2. Usar PapaParse para leer el CSV
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            bom: true, // Mantenemos esto por si acaso

            // USAMOS 'STEP' EN LUGAR DE 'COMPLETE' PARA PROCESAR FILA POR FILA
            step: (results, parser) => {
                const row = results.data;
                
                // --- INICIO: DEBUG ---
                // Loguear la primera fila para ver si lee bien las cabeceras
                if (qrCount === 0) {
                    console.log("Datos de la primera fila procesada:", row);
                }
                // --- FIN: DEBUG ---

                try {
                    // 4. EXTRAER Y LIMPIAR DATOS
                    const name = row['Nombre y apellido'] ? row['Nombre y apellido'].trim() : '';
                    const email = row['Email'] ? row['Email'].trim() : '';
                    let phone = row['WhatsApp'] ? String(row['WhatsApp']).replace(/\D/g, '') : '';

                    // Si la fila no tiene ningún dato útil, la saltamos
                    if (!name && !email && !phone) {
                        return; // Salta a la siguiente fila
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

                } catch (e) {
                    // --- INICIO: DEBUG ---
                    console.error("¡Error procesando una fila!:", e.message);
                    console.error("Datos de la fila que falló:", row);
                    parser.abort(); // Detener el parseo si hay un error
                    status.innerHTML = `<p style="color: red;">Error al procesar la fila ${qrCount + 1}. Revisa la consola.</p>`;
                    // --- FIN: DEBUG ---
                }
            },

            // USAMOS 'COMPLETE' SOLO PARA EL MENSAJE FINAL
            complete: () => {
                // --- INICIO: DEBUG ---
                console.log(`Parseo completado. Total de QRs generados: ${qrCount}`);
                // --- FIN: DEBUG ---
                
                if (qrCount > 0) {
                    status.innerHTML = `<p style="color: green;">¡Se generaron ${qrCount} códigos QR!</p>`;
                } else {
                    status.innerHTML = `<p style="color: red;">No se encontraron datos válidos para generar QRs. Revisa el archivo.</p>`;
                }
                generateBtn.disabled = false;
            },

            // AÑADIMOS UN MANEJADOR DE ERRORES ROBUSTO
            error: (err, file) => {
                // --- INICIO: DEBUG ---
                console.error("¡Error crítico de PapaParse!:", err);
                // --- FIN: DEBUG ---
                status.innerHTML = `<p style="color: red;">Error grave al leer el archivo: ${err.message}. Revisa la consola.</p>`;
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
