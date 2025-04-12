const { handleUploadFactura, handleUploadNotaCredito } = require('./mediaService'); // 🔥 Solo upload aquí
const { handleGetFactura } = require('./handlers/getFacturaHandler'); // 🔥 GetFactura separado
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;

const handleMessage = async (client, message) => {
  if (message.from !== GROUP_ID) return;
  
  console.log(`📩 Mensaje recibido en grupo autorizado: ${message.body} - ${message.author}`);

  const bodyLower = message.body.toLowerCase();

  if (bodyLower.startsWith("trae el folio")) {
    console.log("🔍 Comando para traer factura detectado");
    await handleGetFactura(client, message);
  
  } else if (message.hasMedia) {
    if (bodyLower.startsWith("nc")) {
      console.log("🧾 Comando de Nota de Crédito detectado");
      await handleUploadNotaCredito(client, message);
    
    } else if (message.body.includes("_")) {
      console.log("🧾 Comando de Factura normal detectado");
      await handleUploadFactura(client, message);
    }
  }
};

module.exports = { handleMessage };
