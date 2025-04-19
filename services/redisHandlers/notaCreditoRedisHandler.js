// services/redisHandlers/notaCreditoRedisHandler.js
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
    } = job.data;

    console.log('📥 [Redis‑NC] Trabajo recibido');
    console.log('📦 Job data:', job.data);

    if (!fs.existsSync(filePath)) {
      console.error('❌ [Redis‑NC] Archivo no encontrado:', filePath);
      return;
    }

    const fileName = path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);

    const form = new FormData();
    form.append('nota_credito', fileStream, {
      filename: fileName,
      contentType: 'image/jpeg',
    });
    form.append('folio_nc', folio_nc);
    form.append('id_factura_ref', id_factura_ref);
    form.append('id_proveedor', id_proveedor);
    form.append('id_local', id_local);
    form.append('id_usuario', id_usuario);

    const response = await axios.post(`${API_BASE}/api/uploadNotaCredito`, form, {
      headers: form.getHeaders(),
    });

    console.log(`✅ [Redis‑NC] Subida exitosa. Status: ${response.status}`);
    deleteTempFile(filePath);

  } catch (err) {
    console.error('❌ [Redis‑NC] Error al procesar NC:', err);
  }
};

module.exports = { processNotaCreditoJob };