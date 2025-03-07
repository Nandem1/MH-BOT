const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

// Inicializar el cliente de WhatsApp con autenticación local
const client = new Client({
  authStrategy: new LocalAuth(),
});

// Generar y mostrar el QR para iniciar sesión
client.on("qr", (qr) => {
  console.log("Escanea este código QR con WhatsApp:");
  qrcode.generate(qr, { small: true });
});

// Confirmar que el bot está conectado
client.on("ready", () => {
  console.log("✅ Bot de WhatsApp conectado y listo para recibir mensajes.");
});

const GROUP_ID = process.env.GROUP_ID; // ID del grupo autorizado

// Escuchar mensajes en WhatsApp
client.on("message", async (message) => {
  if (message.from === GROUP_ID) {
    console.log(`📩 Mensaje recibido en grupo autorizado: ${message.body}`);

    // 📌 CONSULTAR FACTURA: "BOT, tráeme el folio X"
    if (message.body.toLowerCase().startsWith("trae el folio")) {
      const folio = message.body.split(" ").pop(); // Extraer el número de folio

      try {
        const response = await axios.get(
          `http://localhost:3000/api/facturas/${folio}`
        );
        const facturas = response.data;

        if (facturas.length > 0) {
          for (const factura of facturas) {
            await client.sendMessage(
              GROUP_ID,
              `📄 Factura encontrada para el folio ${folio} (Proveedor: ${factura.proveedor}): ${factura.image_url}`
            );
          }
        } else {
          await client.sendMessage(
            GROUP_ID,
            `❌ No se encontró una factura con el folio ${folio}.`
          );
        }
      } catch (error) {
        console.error("❌ Error al buscar factura:", error);
        await client.sendMessage(
          GROUP_ID,
          "❌ Error al buscar la factura. Inténtalo más tarde."
        );
      }
    }

    // 📌 SUBIR FACTURA: Detectar imagen con formato "FOLIO_PROVEEDOR"
    if (message.hasMedia && message.body.includes("_")) {
      const media = await message.downloadMedia();
      const [folio, proveedor] = message.body.split("_");

      if (!folio || !proveedor) {
        await client.sendMessage(
          GROUP_ID,
          "❌ Error: El formato debe ser [FOLIO]_[PROVEEDOR]."
        );
        return;
      }

      const fileName = `factura_${folio}.jpg`;
      const filePath = `./temp/${fileName}`;

      fs.writeFileSync(filePath, media.data, "base64");

      // Enviar imagen al backend
      const formData = new FormData();
      formData.append('factura', fs.createReadStream(filePath));
      formData.append('folio', folio);
      formData.append('proveedor', proveedor);

      try {
        const response = await axios.post(
          "http://localhost:3000/api/uploadFactura",
          formData,
          { headers: { ...formData.getHeaders() } }
        );

        console.log("✅ Factura subida con éxito:", response.status, response.data);
        await client.sendMessage(GROUP_ID, `✅ Factura del proveedor ${proveedor} con folio ${folio} subida con éxito.`);
      } catch (error) {
        console.error("❌ Error al subir factura:", error);
        await client.sendMessage(GROUP_ID, "❌ Error al subir la factura. Inténtalo de nuevo.");
      }

      // Eliminar el archivo temporal
      fs.unlinkSync(filePath);
    }
  }
});

client.initialize();
