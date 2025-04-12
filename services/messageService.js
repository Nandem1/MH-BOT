const { handleUploadFactura } = require('./mediaService'); 
const { handleUploadNotaCredito } = require('./handlers/uploadNotaCreditoHandler'); // ✅ import nuevo
const { handleGetFactura } = require('./handlers/getFacturaHandler'); // ✅ import correcto
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;

const handleMessage = async (client, message) => {
  if (message.from !== GROUP_ID) return;
  
  console.log(`📩 Mensaje recibido en grupo autorizado: ${message.body} de ${message.author}`);

  if (message.body.toLowerCase().startsWith("trae el folio")) {
    await handleGetFactura(client, message);
  } else if (message.hasMedia) {
    if (message.body.toLowerCase().startsWith("nc")) {
      await handleUploadNotaCredito(client, message); // ✅ llamado correcto
    } else if (message.body.includes("_")) {
      await handleUploadFactura(client, message);
    }
  }
};

module.exports = { handleMessage };
