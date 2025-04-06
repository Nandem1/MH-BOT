const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { saveTempFile, deleteTempFile } = require('../utils/fileUtils');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || ''; // puede venir vacío

const API_BASE_URL = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

// Consultar facturas en el backend
const handleGetFactura = async (client, message) => {
  const folio = message.body.split(" ").pop();
  try {
    const response = await axios.get(`${API_BASE_URL}/api/facturas/${folio}`);
    const facturas = response.data;

    if (facturas.length > 0) {
      for (const factura of facturas) {
        await client.sendMessage(
          GROUP_ID,
          `📄 Factura encontrada para el folio ${folio} (Proveedor: ${factura.proveedor}): ${factura.ruta_imagen}`
        );
      }
    } else {
      await client.sendMessage(GROUP_ID, `❌ No se encontró una factura con el folio ${folio}.`);
    }
  } catch (error) {
    console.error("❌ Error al buscar factura:", error);
    await client.sendMessage(GROUP_ID, "❌ Error al buscar la factura. Inténtalo más tarde.");
  }
};

// Subir facturas al backend
const handleUploadFactura = async (client, message) => {
  const media = await message.downloadMedia();
  const [folio, rut] = message.body.split("_");
  const whatsappId = message.author;

  if (!folio || !rut) {
    await client.sendMessage(GROUP_ID, "❌ Error: El formato debe ser [FOLIO]_[RUT].");
    return;
  }

  const filePath = saveTempFile(media, folio);

  try {
    // 🔥 Consultar al backend el id_usuario e id_local
    const userResponse = await axios.get(`${API_BASE_URL}/api/usuarios/${whatsappId}`);
    const { id_usuario, id_local } = userResponse.data;

    // Preparar FormData para subir
    const formData = new FormData();
    formData.append('factura', fs.createReadStream(filePath));
    formData.append('folio', folio);
    formData.append('rut', rut);
    formData.append('id_usuario', id_usuario);
    formData.append('id_local', id_local);

    // 🔥 Subir la factura
    const response = await axios.post(`${API_BASE_URL}/api/uploadFactura`, formData, {
      headers: { ...formData.getHeaders() }
    });

    console.log("Subiendo factura con:", { folio, rut, id_usuario, id_local });
    console.log("✅ Factura subida con éxito:", response.status, response.data);
    await client.sendMessage(GROUP_ID, `✅ Factura subida con éxito para el folio ${folio}.`);

  } catch (error) {
    console.error("❌ Error en uploadFactura:", error);

    // 💥 Fallback: detectar usuario no registrado
    if (error.response && error.response.status === 404) {
      await client.sendMessage(GROUP_ID, "❌ Usuario no registrado. Por favor, contáctese con el administrador.");
    } else {
      await client.sendMessage(GROUP_ID, "❌ Error al subir la factura. Inténtalo de nuevo más tarde.");
    }
  } finally {
    deleteTempFile(filePath);
  }
};


module.exports = { handleUploadFactura, handleGetFactura };
