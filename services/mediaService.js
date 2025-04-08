const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { saveTempFile, deleteTempFile } = require('../utils/fileUtils');
require('dotenv').config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || ''; // puede venir vacío

const API_BASE_URL = API_PORT ? `http://${API_HOST}:${API_PORT}` : `https://${API_HOST}`;

// Consultar facturas en el backend
const handleGetFactura = async (client, message) => {
  const folio = message.body.split(" ").pop();
  try {
    const response = await axios.get(`${API_BASE_URL}/api/facturas/${folio}`);
    const facturas = response.data;

    if (facturas.length > 0) {
      for (const factura of facturas) {
        await client.sendMessage(
          GROUP_ID,
          `📄 Factura encontrada para el folio ${folio} (Proveedor: ${factura.proveedor}): ${factura.ruta_imagen}`
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

// Subir facturas al backend
const handleUploadFactura = async (client, message) => {
  const media = await message.downloadMedia();
  const [folio, rut] = message.body.split("_");
  const whatsappId = message.author;

  if (!folio || !rut) {
    await client.sendMessage(GROUP_ID, "❌ Error: El formato debe ser [FOLIO]_[RUT].");
    return;
  }

  const filePath = saveTempFile(media, folio);

  try {
    // 🔥 Consultar al backend el id_usuario e id_local
    const userResponse = await axios.get(`${API_BASE_URL}/api/usuarios/${whatsappId}`);
    const { id_usuario, id_local } = userResponse.data;

    // Preparar FormData para subir
    const formData = new FormData();
    formData.append('factura', fs.createReadStream(filePath));
    formData.append('folio', folio);
    formData.append('rut', rut);
    formData.append('id_usuario', id_usuario);
    formData.append('id_local', id_local);

    // 🔥 Subir la factura
    const response = await axios.post(`${API_BASE_URL}/api/uploadFactura`, formData, {
      headers: { ...formData.getHeaders() }
    });

    console.log("Subiendo factura con:", { folio, rut, id_usuario, id_local });
    console.log("✅ Factura subida con éxito:", response.status, response.data);
    await client.sendMessage(GROUP_ID, `✅ Factura subida con éxito para el folio ${folio}.`);

  } catch (error) {
    console.error("❌ Error en uploadFactura:", error);

    // 💥 Fallback: detectar usuario no registrado
    if (error.response && error.response.status === 404) {
      await client.sendMessage(GROUP_ID, "❌ Usuario no registrado. Por favor, contáctese con el administrador.");
    } else {
      await client.sendMessage(GROUP_ID, "❌ Error al subir la factura. Inténtalo de nuevo más tarde.");
    }
  } finally {
    deleteTempFile(filePath);
  }
};

const handleUploadNotaCredito = async (client, message) => {
  const media = await message.downloadMedia();
  const whatsappId = message.author;
  
  const match = message.body.match(/NC\s(\d+)\s-\sFA\s(\d+)/i);

  if (!match) {
    await client.sendMessage(GROUP_ID, "❌ Formato incorrecto para Nota de Crédito. Usa: NC 1234 - FA 4321");
    return;
  }

  const folio_nc = match[1];
  const folio_fa = match[2];

  const filePath = saveTempFile(media, `nota_credito_${folio_nc}`);

  try {
    // 🔥 Obtener usuario y local desde el backend
    const userResponse = await axios.get(`${API_BASE_URL}/api/usuarios/${whatsappId}`);
    const { id_usuario, id_local } = userResponse.data;

    // 🔥 Buscar la factura referenciada en el backend
    const facturaResponse = await axios.get(`${API_BASE_URL}/api/facturas/${folio_fa}`);
    const facturas = facturaResponse.data;

    if (!facturas.length) {
      await client.sendMessage(GROUP_ID, `❌ No se encontró la factura ${folio_fa} para asociar la Nota de Crédito.`);
      return;
    }

    const id_factura_ref = facturas[0].id;
    const id_proveedor = facturas[0].id_proveedor; // Tomamos el primer match

    // 🔥 Subir Nota de Crédito al backend
    const formData = new FormData();
    formData.append('nota_credito', fs.createReadStream(filePath));

    // Primero subimos la imagen
    const uploadResponse = await axios.post(`${API_BASE_URL}/api/uploadNotaCredito`, formData, {
      headers: { ...formData.getHeaders() }
    });

    const ruta_imagen_nc = uploadResponse.data.ruta_imagen; // asumimos que el backend responde con la ruta

    // Crear la nota de crédito en la base de datos
    await axios.post(`${API_BASE_URL}/api/notas_credito`, {
      folio_nc,
      id_factura_ref,
      id_proveedor,
      ruta_imagen: ruta_imagen_nc,
      id_local,
      id_usuario,
    });

    console.log("✅ Nota de Crédito creada con éxito");
    await client.sendMessage(GROUP_ID, `✅ Nota de Crédito ${folio_nc} asociada a la factura ${folio_fa} creada correctamente.`);

  } catch (error) {
    console.error("❌ Error en handleUploadNotaCredito:", error);
    await client.sendMessage(GROUP_ID, "❌ Error al procesar la Nota de Crédito.");
  } finally {
    deleteTempFile(filePath);
  }
};



module.exports = { handleUploadFactura, handleGetFactura, handleUploadNotaCredito };
