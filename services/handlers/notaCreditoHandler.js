// services/handlers/notaCreditoHandler.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { deleteTempFile } = require('../../utils/fileUtils');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || '';
const API_BASE = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

const processNotaCreditoJob = async (job) => {
  try {
    if (!job?.data) {
      console.error('❌ [Redis‑NC] Job vacío');
      return;
    }

    const {
      folio_nc,
      filePath,
      id_factura_ref,
      id_proveedor,
      id_local,
      id_usuario,
      client
    } = job.data;

    console.log('📥 [Redis‑NC] Trabajo recibido');
    console.log('📦 Job data:', job.data);
    console.log('📂 ¿Archivo existe?:', fs.existsSync(filePath));
    console.log('📂 Ruta del archivo:', filePath);

    if (!fs.existsSync(filePath)) {
      console.error('❌ [Redis‑NC] Archivo no existe en el sistema:', filePath);
      return;
    }

    // Validar archivo y su nombre antes de construir el FormData
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

    if (!fileName || typeof fileStream.pipe !== 'function') {
      console.error('❌ [Redis‑NC] Archivo inválido para FormData:', filePath);
      return;
    }

    console.log('folio_nc 123:', folio_nc);
    console.log('id_factura_ref 123:', id_factura_ref);
    console.log('id_proveedor 123:', id_proveedor);
    console.log('id_local 123:', id_local);
    console.log('id_usuario 123:', id_usuario);

    // Crear FormData correctamente
    const fd = new FormData();
    fd.append('nota_credito', fileStream, {
      filename: fileName,
      contentType: 'image/jpeg'
    });

    fd.append('folio_nc', folio_nc);
    fd.append('id_factura_ref', id_factura_ref);
    fd.append('id_proveedor', id_proveedor);
    fd.append('id_local', id_local);
    fd.append('id_usuario', id_usuario);

    console.log('📤 Enviando FormData al backend...');

    const response = await axios.post(`${API_BASE}/api/uploadNotaCredito`, fd, {
      headers: fd.getHeaders()
    });

    console.log(`✅ [Redis‑NC] Backend respondió con status ${response.status}`);

    deleteTempFile(filePath);
    console.log('🗑️ [Redis‑NC] Archivo temporal eliminado:', filePath);

    if (client) {
      await client.sendMessage(
        GROUP_ID,
        `✅ Nota de Crédito ${folio_nc} procesada correctamente.`
      );
    }
  } catch (err) {
    console.error('❌ [Redis‑NC] Error:', err);

    if (job?.data?.client) {
      await job.data.client.sendMessage(
        GROUP_ID,
        `❌ Error procesando Nota de Crédito ${job.data.folio_nc}.`
      );
    }
  }
};

module.exports = { processNotaCreditoJob };
