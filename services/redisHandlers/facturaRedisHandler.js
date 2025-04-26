// 🔁 Nuevo archivo: services/redisHandlers/facturaRedisHandler.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { deleteTempFile } = require('../../utils/fileUtils');
require('dotenv').config();

const API_BASE = process.env.API_PORT
  ? `http://${process.env.API_HOST}:${process.env.API_PORT}`
  : `https://${process.env.API_HOST}`;

const processFacturaJob = async (job) => {
  try {
    const { folio, rut, filePath, id_usuario, id_local } = job.data;

    if (!fs.existsSync(filePath)) {
      console.error('❌ [Redis‑FA] Archivo no encontrado:', filePath);
      return;
    }

    const form = new FormData();
    form.append('factura', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: 'image/jpeg'
    });
    form.append('folio', folio);
    form.append('rut', rut);
    form.append('id_usuario', id_usuario);
    form.append('id_local', id_local);

    const response = await axios.post(`${API_BASE}/api-beta/uploadFactura`, form, {
      headers: form.getHeaders()
    });

    console.log(`✅ [Redis‑FA] Backend respondió: ${response.status}`);
    deleteTempFile(filePath);
  } catch (error) {
    console.error('❌ [Redis‑FA] Error al procesar factura:', error.message);
  }
};

module.exports = { processFacturaJob };