const { Client, LocalAuth } = require('whatsapp-web.js');
const QRPortal = require('qrcode-terminal');
const { handleMessage } = require('./services/messageService');
require('dotenv').config();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { 
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ],
    executablePath: process.env.CHROMIUM_PATH || null
  }
});

client.on("qr", (qr) => {
  console.log("Escanea el QR desde esta URL (válido por 1 minuto):");
  QRPortal.generate(qr, { small: true });
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`;
  console.log("O abre este enlace en tu navegador:", qrUrl);
});

client.on("ready", () => {
  console.log("✅ Bot de WhatsApp conectado y listo para recibir mensajes.");
});

client.on("message", async (message) => {
  await handleMessage(client, message);
});

client.initialize();
