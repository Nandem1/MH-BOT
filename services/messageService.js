// services/messageService.js
const { handleUploadFactura } = require('./mediaService');
const { enqueueNotaCredito } = require('../queues/notaCreditoQueue');
const { handleGetFactura } = require('./handlers/getFacturaHandler');
const { saveTempFile } = require('../utils/fileUtils');
const axios = require('axios');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || '';
const API_BASE = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

const handleMessage = async (client, message) => {
  if (message.from !== GROUP_ID) return;
  console.log(`📩 Mensaje recibido: "${message.body}" de ${message.author}`);

  // ── Consulta de factura ──
  if (message.body.toLowerCase().startsWith('trae el folio')) {
    await handleGetFactura(client, message);
    return;
  }

  // ── Subida de documentos ──
  if (!message.hasMedia) return;

  // ── Nota de Crédito ──
  if (message.body.toLowerCase().startsWith('nc')) {
    try {
      const media = await message.downloadMedia();
      const match = message.body.match(/nc\s(\d+)\s-\sfa\s(\d+)/i);

      if (!match || !media) {
        await client.sendMessage(GROUP_ID, '❌ Formato NC inválido. Usa: NC 1234 - FA 4321');
        return;
      }

      const [ , folio_nc, folio_fa ] = match;
      const filePath = saveTempFile(media, `nc_${folio_nc}`, 'nota_credito');

      // Obtener datos del usuario
      const whatsappId = message.author;
      const { data: { id_usuario, id_local } } = await axios.get(`${API_BASE}/api/usuarios/${whatsappId}`);

      // Verificar factura referenciada
      const { data: facturas } = await axios.get(`${API_BASE}/api/facturas/${folio_fa}`);
      if (!facturas.length) {
        await client.sendMessage(GROUP_ID, `❌ No se encontró la factura ${folio_fa} para la NC.`);
        return;
      }

      const { id: id_factura_ref, id_proveedor } = facturas[0];

      console.log('factura 321: ', facturas[0]);
      console.log('id_factura_ref 321: ', id_factura_ref);
      console.log('id_proveedor 321: ', id_proveedor);

      // Encolar NC en Redis
      await enqueueNotaCredito({
        folio_nc,
        filePath,
        id_factura_ref,
        id_proveedor,
        id_local,
        id_usuario
      });

      console.log('📥 NC encolada en Redis');
      await client.sendMessage(GROUP_ID, `✅ Nota de Crédito ${folio_nc} encolada para procesamiento.`);

    } catch (error) {
      console.error('❌ Error en handleMessage para NC:', error);
      await client.sendMessage(GROUP_ID, '❌ Error al procesar la Nota de Crédito.');
    }
    return;
  }

  // ── Factura normal ──
  if (message.body.includes('_')) {
    await handleUploadFactura(client, message);
  }
};

module.exports = { handleMessage };
