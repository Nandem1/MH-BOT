// services/mediaService.js
const { saveTempFile, deleteTempFile } = require('../utils/fileUtils');
const { enqueueFactura } = require('../queues/facturaQueue');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || '';

const API_BASE_URL = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

const handleUploadFactura = async (client, message) => {
  console.log('🛎️ Nueva factura recibida.');

  try {
    const media = await message.downloadMedia();
    if (!media) {
      console.error("❌ No se pudo descargar la media.");
      await client.sendMessage(GROUP_ID, "❌ No se pudo descargar la imagen.");
      return;
    }

    const [folio, rut] = message.body.split("_");
    const whatsappId = message.author;

    if (!folio || !rut) {
      console.warn("⚠️ Formato incorrecto del mensaje:", message.body);
      await client.sendMessage(GROUP_ID, "❌ Error: El formato debe ser [FOLIO]_[RUT].");
      return;
    }

    const filePath = saveTempFile(media, folio);

    // 🔥 Consultar usuario
    const userResponse = await axios.get(`${API_BASE_URL}/api/usuarios/${whatsappId}`);
    const { id_usuario, id_local } = userResponse.data;

    // 🔥 Encolar en Redis
    const facturaPayload = {
      folio,
      rut,
      filePath,
      id_usuario,
      id_local,
      timestamp: new Date().toISOString(), // ✅ Agregamos timestamp para trazabilidad
      status: 'pending', // ✅ Status inicial
    };

    await enqueueFactura(facturaPayload);

    console.log("📥 Factura encolada en Redis:", facturaPayload);
    await client.sendMessage(GROUP_ID, `✅ Factura ${folio} encolada para procesamiento.`);

  } catch (error) {
    console.error("❌ Error en handleUploadFactura:", error);

    if (error.response && error.response.status === 404) {
      await client.sendMessage(GROUP_ID, "❌ Usuario no registrado. Contacte al administrador.");
    } else {
      await client.sendMessage(GROUP_ID, "❌ Error al procesar la factura. Inténtalo más tarde.");
    }
  }
};

module.exports = { handleUploadFactura };
