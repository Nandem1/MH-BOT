const { handleGetFactura, handleUploadFactura, handleUploadNotaCredito } = require('./mediaService');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;

const handleMessage = async (client, message) => {
  if (message.from !== GROUP_ID) return;
  
  console.log(`📩 Mensaje recibido en grupo autorizado: ${message.body + message.author}`);

  if (message.body.toLowerCase().startsWith("trae el folio")) {
    await handleGetFactura(client, message);
  } else if (message.hasMedia) {
    if (message.body.toLowerCase().startsWith("nc")) {
      await handleUploadNotaCredito(client, message); // 🔥 NUEVO: manejar NC
    } else if (message.body.includes("_")) {
      await handleUploadFactura(client, message); // 🔥 FACTURA normal
    }
  }
};

module.exports = { handleMessage };
