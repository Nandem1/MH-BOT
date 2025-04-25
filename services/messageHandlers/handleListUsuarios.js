// services/messageHandlers/handleListUsuarios.js
const axios = require("axios");
require("dotenv").config();

const GROUP_ID = process.env.GROUP_ID;
const API_HOST = process.env.API_HOST;
const API_PORT = process.env.API_PORT || "";
const API_BASE_URL = API_PORT
  ? `http://${API_HOST}:${API_PORT}`
  : `https://${API_HOST}`;

const ADMIN_IDS = [
  "56964562320@c.us", // <-- Tu ID
  "56945187612@c.us", // <-- Puedes agregar más aquí
];

const handleListUsuarios = async (client, message) => {
  if (!ADMIN_IDS.includes(message.author)) {
    await client.sendMessage(
      GROUP_ID,
      "❌ No estás autorizado para usar este comando."
    );
    return;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/usuarios`);
    const usuarios = response.data;

    if (!usuarios.length) {
      await client.sendMessage(
        GROUP_ID,
        "⚠️ No se encontraron usuarios autorizados."
      );
      return;
    }

    const lista = usuarios
      .map((user) => `- ${user.nombre} (${user.nombre_local})`)
      .join("\n");

    const mensaje = `📋 *Usuarios autorizados:*\n\n${lista}`;

    await client.sendMessage(GROUP_ID, mensaje);
  } catch (error) {
    console.error("❌ Error en handleListUsuarios:", error);
    await client.sendMessage(
      GROUP_ID,
      "❌ Error al obtener la lista de usuarios."
    );
  }
};

module.exports = { handleListUsuarios };
