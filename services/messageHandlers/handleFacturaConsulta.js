const axios = require('axios');
require('dotenv').config();

const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || '';
const API_BASE_URL = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

const handleFacturaConsulta = async (client, message) => {
  try {
    const folioMatch = message.body.match(/\d+/);
    const folio = folioMatch ? folioMatch[0] : null;

    if (!folio) {
      await client.sendMessage(message.from, '❌ Debes incluir un número de folio.');
      return;
    }

    const response = await axios.get(`${API_BASE_URL}/api-beta/facturas/${folio}`);
    const factura = response.data[0];

    if (!factura) {
      await client.sendMessage(message.from, `❌ No se encontró la factura ${folio}.`);
      return;
    }

    const resumen = `
🧾 Factura ${factura.folio}
Proveedor: ${factura.proveedor}
Registrada por: ${factura.nombre_usuario}
Fecha: ${factura.fecha_registro.split('T')[0]}
📎 Drive: ${factura.image_url_drive}
🌩️ Nube: ${factura.image_url_cloudinary}
`;

    await client.sendMessage(message.from, resumen);

  } catch (error) {
    console.error('❌ Error en handleFacturaConsulta:', error);
    await client.sendMessage(message.from, '❌ Error al consultar la factura.');
  }
};

module.exports = { handleFacturaConsulta };