// services/handlers/getFacturaHandler.js
const axios = require('axios');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || '';

const API_BASE_URL = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

// 🚀 Handler para buscar facturas por folio
const handleGetFactura = async (client, message) => {
  const folio = message.body.split(" ").pop(); // Obtiene el último número del mensaje

  try {
    const response = await axios.get(`${API_BASE_URL}/api/facturas/${folio}`);
    const facturas = response.data;

    if (facturas.length > 0) {
      for (const factura of facturas) {
        await client.sendMessage(
          GROUP_ID,
          `📄 Factura encontrada para el folio ${folio} (Proveedor: ${factura.proveedor}):\n` +
          `🔗 ${factura.ruta_imagen}\n` +
          (factura.ruta_cloudinary ? `☁️ Cloudinary: ${factura.ruta_cloudinary}` : '')
        );
      }
    } else {
      await client.sendMessage(GROUP_ID, `❌ No se encontró una factura con el folio ${folio}.`);
    }
  } catch (error) {
    console.error("❌ Error al buscar factura:", error);
    await client.sendMessage(GROUP_ID, "❌ Error al buscar la factura. Inténtalo más tarde.");
  }
};

module.exports = { handleGetFactura };
