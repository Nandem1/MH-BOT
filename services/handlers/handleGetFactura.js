// services/handlers/getFacturaHandler.js
const axios = require('axios');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || '';

const API_BASE_URL = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

const handleGetFactura = async (client, message) => {
  const folio = message.body.split(" ").pop(); // Toma el último valor después del comando

  try {
    console.log(`🔍 Buscando factura con folio: ${folio}`);

    const response = await axios.get(`${API_BASE_URL}/api/facturas/${folio}`);
    const facturas = response.data;

    if (facturas.length > 0) {
      for (const factura of facturas) {
        const text = `📄 Factura encontrada para el folio ${folio}:\nProveedor: ${factura.proveedor}\nURL: ${factura.ruta_imagen}`;
        await client.sendMessage(GROUP_ID, text);
      }
    } else {
      await client.sendMessage(GROUP_ID, `❌ No se encontró factura para el folio ${folio}.`);
    }
  } catch (error) {
    console.error("❌ Error buscando factura:", error);
    await client.sendMessage(GROUP_ID, "❌ Error buscando la factura. Inténtalo más tarde.");
  }
};

module.exports = { handleGetFactura };
