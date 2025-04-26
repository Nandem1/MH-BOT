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

    const [folioRaw, rutRaw] = message.body.split("_");
    const folio = folioRaw?.trim();
    let rut = rutRaw?.trim();
    const whatsappId = message.author;

    if (!folio || !/^[0-9]+$/.test(folio)) {
      console.warn("⚠️ Formato incorrecto del mensaje o folio no numérico:", message.body);
      await client.sendMessage(GROUP_ID, "❌ Error: El formato debe ser [FOLIO_NUM]_[RUT] o [FOLIO_NUM] solamente.");
      return;
    }

    let proveedorExiste = false;

    if (rut) {
      try {
        await axios.get(`${API_BASE_URL}/api/proveedorByRut/${rut}`);
        proveedorExiste = true;
      } catch (error) {
        if (error.response?.status === 404) {
          console.warn(`⚠️ Proveedor con RUT ${rut} no encontrado. Se usará GENERIC.`);
          rut = "GENERIC";
        } else {
          throw error;
        }
      }
    } else {
      rut = "GENERIC";
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

    if (!proveedorExiste) {
      await client.sendMessage(GROUP_ID, `⚠️ Factura *${folio}* encolada en modo *GENERIC* (Proveedor no registrado).`);
    }
    // else {
    //   await client.sendMessage(GROUP_ID, `✅ Factura ${folio} encolada para procesamiento.`);
    // }

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
