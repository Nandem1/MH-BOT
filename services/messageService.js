const { handleGetFactura, handleUploadFactura } = require('./mediaService');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;

// Manejo centralizado de mensajes
const handleMessage = async (client, message) => {
  if (message.from !== GROUP_ID) return;
  
  console.log(`📩 Mensaje recibido en grupo autorizado: ${message.body}`);

  if (message.body.toLowerCase().startsWith("trae el folio")) {
    await handleGetFactura(client, message);
  } else if (message.hasMedia && message.body.includes("_")) {
    await handleUploadFactura(client, message);
  }
};

module.exports = { handleMessage };
