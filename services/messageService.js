// services/messageService.js
const { handleUploadFactura } = require('./messageHandlers/handleUploadFactura');
const { handleNotaCreditoUpload } = require('./messageHandlers/handleNotaCreditoUpload');
const { handleFacturaConsulta } = require('./messageHandlers/handleFacturaConsulta');
const { handleGeneric } = require('./messageHandlers/handleGeneric');
const { handleDailyReport } = require('../cron/dailyReportCron');
const { handleListUsuarios } = require('./messageHandlers/handleListUsuarios')
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;

const handleMessage = async (client, message) => {
  if (message.from !== GROUP_ID) return;

  const msg = message.body.trim().toLowerCase();

  if (msg === '!usuarios') {
    return await handleListUsuarios(client, message); // 🔥 Nuevo handler
  }

  if (msg.startsWith('trae el folio')) {
    return await handleFacturaConsulta(client, message);
  }

  if (msg.startsWith('nc') && message.hasMedia) {
    return await handleNotaCreditoUpload(client, message);
  }

  if (msg.includes('_') && message.hasMedia) {
    return await handleUploadFactura(client, message);
  }

  if (msg.startsWith('!daily')) {
    return handleDailyReport(client);
  }

  return await handleGeneric(client, message); // Para otros mensajes no contemplados
};

module.exports = { handleMessage };