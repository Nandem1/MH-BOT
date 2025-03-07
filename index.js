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

// Escuchar mensajes en WhatsApp
client.on("message", async (message) => {
  console.log(`📩 Mensaje recibido de ${message.from}: ${message.body}`);

  if (message.body.toLowerCase() === "hola bot") {
    await client.sendMessage(
      message.from,
      "¡Hola! Soy tu bot de facturas. ¿Cómo puedo ayudarte?"
    );
  }
});

client.on("message", async (message) => {
  if (message.isGroupMsg) {
    // Solo mostrar mensajes de grupos
    console.log(
      `📩 Mensaje recibido en el grupo: ${message.from} - ${message.body}`
    );
  }
});

const GROUP_ID = process.env.GROUP_ID; // Reemplaza con el ID real del grupo

client.on("message", async (message) => {
  if (message.from === GROUP_ID) {
    // Solo en el grupo autorizado
    console.log(`📩 Mensaje recibido: ${message.body}`);

    // 📌 CONSULTAR FACTURA: "BOT, tráeme el folio X"
    if (message.body.toLowerCase().startsWith("trae el folio")) {
      const folio = message.body.split(" ").pop(); // Extraer el número de folio

      try {
        const response = await axios.get(
          `http://localhost:3000/api/facturas/${folio}`
        );
        const factura = response.data;

        if (factura) {
          await client.sendMessage(
            GROUP_ID,
            `📄 Factura encontrada para el folio ${folio}: ${factura.image_url}`
          );
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

    // 📌 SUBIR FACTURA: Detectar imagen con texto "[FOLIO]_[PROVEEDOR]"
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

      // Guardar la imagen temporalmente
      const fileName = `factura_${folio}.jpg`;
      const filePath = `./temp/${fileName}`;

      require("fs").writeFileSync(filePath, media.data, "base64");

    // Enviar imagen al backend
    const formData = new FormData();
    formData.append('factura', fs.createReadStream(filePath)); // ✅ Corregido
    formData.append('folio', folio);
    formData.append('proveedor', proveedor);

      try {
        const response = await axios.post(
          "http://localhost:3000/api/uploadFactura",
          formData,
          {
            headers: { ...formData.getHeaders() },
          }
        );

        console.log("✅ Respuesta recibida del backend:", response.status, response.data);

        await client.sendMessage(
          GROUP_ID,
          `✅ Factura subida con éxito`
        );
      } catch (error) {
        console.error("❌ Error al subir factura:", error);
        await client.sendMessage(
          GROUP_ID,
          "❌ Error al subir la factura. Inténtalo de nuevo."
        );
      }

      // Eliminar el archivo temporal
      require("fs").unlinkSync(filePath);
    }
  }
});
client.initialize();
