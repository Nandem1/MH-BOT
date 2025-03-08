const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./services/messageService');
require('dotenv').config();

const client = new Client({
  authStrategy: new LocalAuth(),
});

// Generar y mostrar el QR para iniciar sesión
client.on("qr", (qr) => {
  console.log("Escanea este código QR con WhatsApp:");
  qrcode.generate(qr, { small: true });
});

// Confirmar que el bot está conectado
client.on("ready", () => {
  console.log("✅ Bot de WhatsApp conectado y listo para recibir mensajes.");
});

// Delegar la gestión de mensajes al servicio correspondiente
client.on("message", async (message) => {
  await handleMessage(client, message);
});

client.initialize();
