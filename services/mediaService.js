const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { saveTempFile, deleteTempFile } = require('../utils/fileUtils');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_LINK = process.env.API_LINK;

// Consultar facturas en el backend
const handleGetFactura = async (client, message) => {
  const folio = message.body.split(" ").pop();
  try {
    const response = await axios.get(`${API_LINK}/${folio}`);
    const facturas = response.data;

    if (facturas.length > 0) {
      for (const factura of facturas) {
        await client.sendMessage(
          GROUP_ID,
          `📄 Factura encontrada para el folio ${folio} (Proveedor: ${factura.proveedor}): ${factura.image_url}`
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
  const [folio, proveedor] = message.body.split("_");

  if (!folio || !proveedor) {
    await client.sendMessage(GROUP_ID, "❌ Error: El formato debe ser [FOLIO]_[PROVEEDOR].");
    return;
  }

  const filePath = saveTempFile(media, folio);
  const formData = new FormData();
  formData.append('factura', fs.createReadStream(filePath));
  formData.append('folio', folio);
  formData.append('proveedor', proveedor);

  try {
    const response = await axios.post(
      `${API_LINK}/api/uploadFactura`,
      formData,
      { headers: { ...formData.getHeaders() } }
    );

    console.log("✅ Factura subida con éxito:", response.status, response.data);
    await client.sendMessage(GROUP_ID, `✅ Factura del proveedor ${proveedor} con folio ${folio} subida con éxito.`);
  } catch (error) {
    console.error("❌ Error al subir factura:", error);
    await client.sendMessage(GROUP_ID, "❌ Error al subir la factura. Inténtalo de nuevo.");
  }

  deleteTempFile(filePath);
};

module.exports = { handleGetFactura, handleUploadFactura };
