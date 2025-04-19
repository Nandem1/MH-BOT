// cron/dailyReportCron.js
const cron = require("node-cron");
const axios = require("axios");
require("dotenv").config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || "";
const API_BASE = API_PORT
  ? `http://${API_HOST}:${API_PORT}`
  : `https://${API_HOST}`;

const scheduleDailyReport = (client) => {
  cron.schedule("30 00 * * *", async () => {
    try {
      console.log("📊 Enviando resumen diario...");

      const { data } = await axios.get(`${API_BASE}/api/reporte-diario`);
      const { facturas_hoy, notas_credito_hoy } = data;

      const mensaje = `📄 *Resumen Diario:*
- Facturas subidas a la nube: *${facturas_hoy}*
- Notas de Crédito subidas a la nube: *${notas_credito_hoy}*`;

      await client.sendMessage(GROUP_ID, mensaje);
      console.log("✅ Resumen diario enviado correctamente.");
    } catch (error) {
      console.error("❌ Error al enviar resumen diario:", error.message);
    }
  });
};

module.exports = { scheduleDailyReport };
