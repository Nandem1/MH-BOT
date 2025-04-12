const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { deleteTempFile } = require('../../utils/fileUtils');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || '';

const API_BASE_URL = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

const processFacturaJob = async (job) => {
  try {
    console.log('🛠️ [Redis] Iniciando procesamiento de job...');

    if (!job || !job.data) {
      console.error('❌ [Redis] Job o Job.data está vacío:', job);
      return;
    }

    const { folio, rut, filePath, id_usuario, id_local, client } = job.data;

    console.log('✅ [Redis] Datos recibidos del job:', { folio, rut, filePath, id_usuario, id_local });

    if (!fs.existsSync(filePath)) {
      console.error('❌ [Redis] Archivo no existe en ruta:', filePath);
      return;
    }

    // 🔥 Preparar FormData
    const formData = new FormData();
    formData.append('factura', fs.createReadStream(filePath));
    formData.append('folio', folio);
    formData.append('rut', rut);
    formData.append('id_usuario', id_usuario);
    formData.append('id_local', id_local);

    console.log('📤 [Redis] Subiendo factura al Backend...');

    // 🔥 Subir la factura
    const response = await axios.post(`${API_BASE_URL}/api/uploadFactura`, formData, {
      headers: { ...formData.getHeaders() }
    });

    console.log('✅ [Redis] Factura subida correctamente al backend:', response.data);

    // 🔥 Eliminar archivo temporal
    deleteTempFile(filePath);
    console.log('🗑️ [Redis] Archivo temporal eliminado:', filePath);

    // (Opcional) 🔥 Enviar mensaje por WhatsApp
    if (client) {
      console.log('📢 [Redis] Enviando confirmación de éxito por WhatsApp...');
      await client.sendMessage(GROUP_ID, `✅ Factura ${folio} procesada y subida correctamente.`);
    } else {
      console.log('ℹ️ [Redis] No se envió mensaje de WhatsApp porque "client" no está definido.');
    }

  } catch (error) {
    console.error('❌ [Redis] Error procesando factura:', error);

    // (Opcional) 🔥 Enviar error por WhatsApp
    if (job?.data?.client) {
      await job.data.client.sendMessage(GROUP_ID, `❌ Error procesando factura ${job?.data?.folio || 'desconocida'}.`);
    }
  }
};

module.exports = { processFacturaJob };
