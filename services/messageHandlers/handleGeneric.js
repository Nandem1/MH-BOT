const handleGeneric = async (client, message) => {
  const msg = message.body.trim().toLowerCase();
  if (msg.startsWith("!comandos")) {
    console.log("📨 Mensaje genérico recibido:", message.body);

    const reply = `❓ *Comandos disponibles:*
  
  📄 Para subir una *Factura*:
    Escribe: 123456_826235004
  
  📈 Para subir una *Nota de Crédito*:
    Escribe: NC 123456 - FA 654321
  
  🔎 Para consultar una factura:
    Escribe: TRAE EL FOLIO 123456`;

    await client.sendMessage(message.from, reply);
  }
};

module.exports = { handleGeneric };
