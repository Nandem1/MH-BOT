const { saveTempFile } = require('../../utils/fileUtils');
const { enqueueNotaCredito } = require('../../queues/notaCreditoQueue');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || '';
const API_BASE_URL = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

const handleNotaCreditoUpload = async (client, message) => {
  console.log('📝 Recibida Nota de Crédito.');

  try {
    const media = await message.downloadMedia();
    const whatsappId = message.author;

    if (!media) {
      console.error('❌ No se pudo descargar media.');
      await client.sendMessage(GROUP_ID, '❌ Error al descargar la imagen.');
      return;
    }

    const match = message.body.match(/NC\s(\d+)\s-\sFA\s(\d+)/i);
    if (!match) {
      await client.sendMessage(GROUP_ID, '❌ Formato inválido. Usa: NC 1234 - FA 4321');
      return;
    }

    const folio_nc = match[1];
    const folio_fa = match[2];

    // Validar que ambos sean solo números
    if (!/^[0-9]+$/.test(folio_nc) || !/^[0-9]+$/.test(folio_fa)) {
      await client.sendMessage(GROUP_ID, '❌ Los folios deben contener solo números.');
      return;
    }

    const filePath = saveTempFile(media, `nc_${folio_nc}`, 'nota_credito');

    if (!filePath || !fs.existsSync(filePath)) {
      console.error('❌ Archivo temporal inválido.');
      await client.sendMessage(GROUP_ID, '❌ Error interno al guardar la imagen.');
      return;
    }

    const userResponse = await axios.get(`${API_BASE_URL}/api/usuarios/${whatsappId}`);
    const { id_usuario, id_local } = userResponse.data;

    const facturaResponse = await axios.get(`${API_BASE_URL}/api/facturas/${folio_fa}`);
    const facturas = facturaResponse.data;

    if (!facturas.length) {
      await client.sendMessage(GROUP_ID, `❌ Factura ${folio_fa} no encontrada para asociar la NC.`);
      return;
    }

    const id_factura_ref = facturas[0].id;
    const id_proveedor = facturas[0].id_proveedor;

    const ncPayload = {
      folio_nc,
      filePath,
      id_factura_ref,
      id_proveedor,
      id_local,
      id_usuario,
    };

    await enqueueNotaCredito(ncPayload);
    console.log('📥 NC encolada en Redis');
    // await client.sendMessage(GROUP_ID, `✅ Nota de Crédito ${folio_nc} encolada para procesamiento.`);

  } catch (error) {
    console.error("❌ Error en handleUploadNotaCredito:", error);

    if (error.response?.status === 404) {
      await client.sendMessage(GROUP_ID, "❌ Usuario no registrado.");
    } else {
      await client.sendMessage(GROUP_ID, "❌ Error al procesar la Nota de Crédito.");
    }
  }
};

module.exports = { handleNotaCreditoUpload };
