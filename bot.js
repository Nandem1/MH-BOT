// bot.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const QRPortal = require("qrcode-terminal");
const { handleMessage } = require("./services/messageService");
const { processFacturas } = require("./queues/facturaQueue");
const { processFacturaJob } = require("./services/handlers/facturaHandler");
require("dotenv").config();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
    executablePath: process.env.CHROMIUM_PATH || null,
  },
});

// Mostrar QR
client.on("qr", (qr) => {
  console.log("Escanea el QR desde esta URL (válido por 1 minuto):");
  QRPortal.generate(qr, { small: true });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    qr
  )}`;
  console.log("O abre este enlace en tu navegador:", qrUrl);
});

// Bot listo
client.on("ready", () => {
  console.log("✅ Bot de WhatsApp conectado y listo para recibir mensajes.");
});

// Mensajes entrantes
client.on("message", async (message) => {
  console.log("📩 Mensaje recibido del grupo:", message.from);
  await handleMessage(client, message);
});

// Inicializar WhatsApp
client.initialize();

// ===============================
// 🔥 Procesar trabajos en Redis
// ===============================
// Procesar trabajos en Redis
console.log("🧠 Inicializando procesamiento de facturas desde Redis...");
processFacturas(async (job) => {
  console.log("📥 Procesando trabajo recibido en Redis...");
  await processFacturaJob(job);
});
