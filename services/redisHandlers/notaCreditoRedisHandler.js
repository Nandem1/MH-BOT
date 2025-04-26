// services/redisHandlers/notaCreditoRedisHandler.js
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || "";
const API_BASE_URL = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

const processNotaCreditoJob = async (job) => {
  console.log("\ud83d\udcc5 [Redis\u2011NC] Trabajo recibido");

  try {
    const { folio_nc, filePath, id_factura_ref, id_proveedor, id_local, id_usuario } = job.data;

    if (!filePath || !fs.existsSync(filePath)) {
      console.error("❌ Archivo temporal de NC no encontrado:", filePath);
      return;
    }

    console.log("\ud83d\udd04 \u001b[1mNC activa\u001b[0m \u2192", { id_local, folio_nc, id_usuario });

    const form = new FormData();

    // Agregar imagen
    const fileName = `nc_${folio_nc}.jpg`;
    form.append("nota_credito", fs.createReadStream(filePath), fileName);

    // Agregar campos del body
    form.append("folio_nc", folio_nc);
    form.append("id_local", id_local);
    form.append("id_usuario", id_usuario);

    // Si existe id_factura_ref y id_proveedor, enviarlos
    if (id_factura_ref && id_proveedor) {
      form.append("id_factura_ref", id_factura_ref);
      form.append("id_proveedor", id_proveedor);
    }

    console.log("\ud83d\udcdd Enviando NC al backend...");
    await axios.post(`${API_BASE_URL}/api-beta/uploadNotaCredito`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });

    console.log("✅ Nota de Crédito subida exitosamente.");

    // Eliminar archivo temporal
    fs.unlinkSync(filePath);

  } catch (error) {
    console.error("❌ [Redis\u2011NC] Error al procesar NC:", error);
  }
};

module.exports = { processNotaCreditoJob };