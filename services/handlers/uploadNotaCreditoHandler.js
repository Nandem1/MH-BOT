const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { saveTempFile, deleteTempFile } = require('../../utils/fileUtils');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || '';
const API_BASE_URL = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

const handleUploadNotaCredito = async (client, message) => {
  console.log('📝 Recibida Nota de Crédito.');

  const media = await message.downloadMedia();
  const whatsappId = message.author;

  if (!media) {
    console.error('❌ Media no descargada.');
    await client.sendMessage(GROUP_ID, '❌ Error: No se pudo descargar la imagen de la Nota de Crédito.');
    return;
  }

  const match = message.body.match(/NC\s(\d+)\s-\sFA\s(\d+)/i);
  if (!match) {
    await client.sendMessage(GROUP_ID, '❌ Formato incorrecto para Nota de Crédito. Usa: NC 1234 - FA 4321');
    return;
  }

  const folio_nc = match[1];
  const folio_fa = match[2];

  const filePath = saveTempFile(media, `nota_credito_${folio_nc}`, 'nota_credito');
  const filename = path.basename(filePath);
  console.log(`📦 Archivo temporal generado en: ${filePath}`);

  if (!filePath || !fs.existsSync(filePath)) {
    console.error('❌ Archivo temporal no creado correctamente.');
    await client.sendMessage(GROUP_ID, '❌ Error interno al guardar la imagen.');
    return;
  }

  try {
    const exists = fs.existsSync(filePath);
    console.log(`📂 Existe en disco: ${exists}`);

    // ✅ Consultar datos del usuario
    const userResponse = await axios.get(`${API_BASE_URL}/api/usuarios/${whatsappId}`);
    const { id_usuario, id_local } = userResponse.data;

    // ✅ Consultar datos de la factura referenciada
    const facturaResponse = await axios.get(`${API_BASE_URL}/api/facturas/${folio_fa}`);
    const facturas = facturaResponse.data;

    if (!facturas.length) {
      await client.sendMessage(GROUP_ID, `❌ No se encontró la factura ${folio_fa} para asociar la Nota de Crédito.`);
      return;
    }

    const id_factura_ref = facturas[0].id;
    const id_proveedor = facturas[0].id_proveedor;

    // ✅ Crear FormData
    const formData = new FormData();
    console.log(`📤 Preparando subida de archivo: ${filePath}`);
    formData.append('nota_credito', fs.createReadStream(filePath), {
      filename,
      contentType: 'image/jpeg'
    });
    formData.append('folio_nc', folio_nc);
    formData.append('id_factura_ref', id_factura_ref);
    formData.append('id_proveedor', id_proveedor);
    formData.append('id_local', id_local);
    formData.append('id_usuario', id_usuario);

    console.log('📤 Subiendo Nota de Crédito al backend...');
    await axios.post(`${API_BASE_URL}/api/uploadNotaCredito`, formData, {
      headers: { ...formData.getHeaders() }
    });

    await client.sendMessage(GROUP_ID, `✅ Nota de Crédito ${folio_nc} asociada correctamente a la factura ${folio_fa}.`);
    console.log('✅ Nota de Crédito subida y confirmada.');

  } catch (error) {
    console.error('❌ Error subiendo Nota de Crédito:', error);
    await client.sendMessage(GROUP_ID, '❌ Error al procesar la Nota de Crédito.');
  } finally {
    deleteTempFile(filePath);
    console.log('🗑️ Archivo temporal eliminado:', filePath);
  }
};

module.exports = { handleUploadNotaCredito };
