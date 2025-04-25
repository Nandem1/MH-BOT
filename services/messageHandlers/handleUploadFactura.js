// services/messageHandlers/handleUploadFactura.js
const { saveTempFile } = require('../../utils/fileUtils');
const { enqueueFactura } = require('../../queues/facturaQueue');
const axios = require('axios');
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

    if (!folio || !rut || !/^[0-9]+$/.test(folio)) {
      console.warn("⚠️ Formato incorrecto del mensaje o folio no numérico:", message.body);
      await client.sendMessage(GROUP_ID, "❌ Error: El formato debe ser [FOLIO_NUM]_[RUT].");
      return;
    }

    // 🔍 Validar existencia del proveedor por RUT
    try {
      await axios.get(`${API_BASE_URL}/api/proveedorByRut/${rut}`);
    } catch (error) {
      if (error.response?.status === 404) {
        await client.sendMessage(GROUP_ID, `❌ El proveedor con RUT *${rut}* no está registrado.`);
        return;
      }
      throw error;
    }

    const filePath = saveTempFile(media, folio);

    const userResponse = await axios.get(`${API_BASE_URL}/api/usuarios/${whatsappId}`);
    const { id_usuario, id_local } = userResponse.data;

    const facturaPayload = {
      folio,
      rut,
      filePath,
      id_usuario,
      id_local,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    await enqueueFactura(facturaPayload);
    console.log("📥 Factura encolada en Redis:", facturaPayload);
    // await client.sendMessage(GROUP_ID, `✅ Factura ${folio} encolada para procesamiento.`);

  } catch (error) {
    console.error("❌ Error en handleUploadFactura:", error);

    if (error.response?.status === 404) {
      await client.sendMessage(GROUP_ID, "❌ Usuario no registrado. Contacte al administrador.");
    } else {
      await client.sendMessage(GROUP_ID, "❌ Error al procesar la factura. Inténtalo más tarde.");
    }
  }
};

module.exports = { handleUploadFactura };
