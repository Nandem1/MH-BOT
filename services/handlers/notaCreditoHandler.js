// services/handlers/notaCreditoHandler.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { deleteTempFile } = require("../../utils/fileUtils");
require("dotenv").config();

const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || "";
const API_BASE = API_PORT
  ? `http://${API_HOST}:${API_PORT}`
  : `https://${API_HOST}`;

const processNotaCreditoJob = async (job) => {
  try {
    if (!job?.data) {
      console.error("Job vacío");
      return;
    }

    const {
      folio_nc,
      filePath,
      id_factura_ref,
      id_proveedor,
      id_local,
      id_usuario,
    } = job.data;

    /* ---------- FormData ---------- */
    const fd = new FormData();
    /*  SOLO 2 ARGUMENTOS  */
    console.log("🧪 Debug filePath:", filePath);
    console.log("🧪 Stream:", fs.createReadStream(filePath));

    fd.append("nota_credito", fs.createReadStream(filePath));
    /* ------------------------------ */
    fd.append("folio_nc", folio_nc);
    fd.append("id_factura_ref", id_factura_ref);
    fd.append("id_proveedor", id_proveedor);
    fd.append("id_local", id_local);
    fd.append("id_usuario", id_usuario);

    const { status } = await axios.post(
      `${API_BASE}/api/uploadNotaCredito`,
      fd,
      { headers: fd.getHeaders() }
    );

    console.log(`✅ [Redis‑NC] Backend respondió ${status}`);
    deleteTempFile(filePath);
  } catch (err) {
    console.error("❌ [Redis‑NC] Error:", err);
  }
};

module.exports = { processNotaCreditoJob };
