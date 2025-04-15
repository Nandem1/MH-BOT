// services/handlers/notaCreditoHandler.js
const axios       = require('axios');
const fs          = require('fs');
const path        = require('path');
const FormData    = require('form-data');
const { deleteTempFile } = require('../../utils/fileUtils');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || '';
const API_BASE = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

const processNotaCreditoJob = async (job) => {
  try {
    if (!job?.data) { console.error('Job vacío'); return; }

    const {
      folio_nc, filePath, id_factura_ref,
      id_proveedor, id_local, id_usuario, client
    } = job.data;

    /* ---------- FormData ---------- */
    const fd = new FormData();
    fd.append('nota_credito', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: 'image/jpeg'
    });
    fd.append('folio_nc',       folio_nc);
    fd.append('id_factura_ref', id_factura_ref);
    fd.append('id_proveedor',   id_proveedor);
    fd.append('id_local',       id_local);
    fd.append('id_usuario',     id_usuario);

    const { status } = await axios.post(`${API_BASE}/api/uploadNotaCredito`, fd, {
      headers: fd.getHeaders()
    });

    console.log(`✅ [Redis‑NC] Backend respondió ${status}`);
    deleteTempFile(filePath);

    if (client) {
      await client.sendMessage(GROUP_ID,
        `✅ Nota de Crédito ${folio_nc} procesada correctamente.`);
    }

  } catch (err) {
    console.error('❌ [Redis‑NC] Error:', err);
    if (job?.data?.client) {
      await job.data.client.sendMessage(GROUP_ID,
        `❌ Error procesando Nota de Crédito ${job.data.folio_nc}.`);
    }
  }
};

module.exports = { processNotaCreditoJob };
