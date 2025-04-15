const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.resolve(__dirname, '../../temp');

// Asegurar que la carpeta temporal existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log(`📁 Carpeta temporal creada en: ${TEMP_DIR}`);
}

// Guardar archivo temporalmente
const saveTempFile = (media, name, type = 'factura') => {
  try {
    if (!media || !media.data) {
      console.error("❌ Media inválida o vacía.");
      return null;
    }

    const prefix = type === 'nota_credito' ? 'nota_credito_' : 'factura_';
    const safeName = name.replace(/[^\w\d_-]/g, ''); // evita caracteres raros
    const fileName = `${prefix}${safeName}.jpg`;
    const filePath = path.join(TEMP_DIR, fileName);

    fs.writeFileSync(filePath, media.data, "base64");

    console.log(`🖼️ Archivo temporal guardado: ${filePath}`);
    return filePath;
  } catch (err) {
    console.error("❌ Error al guardar archivo temporal:", err);
    return null;
  }
};

// Eliminar archivo temporal
const deleteTempFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Archivo temporal eliminado: ${filePath}`);
    } else {
      console.warn(`⚠️ No se encontró archivo para eliminar: ${filePath}`);
    }
  } catch (err) {
    console.error("❌ Error al eliminar archivo temporal:", err);
  }
};

module.exports = { saveTempFile, deleteTempFile };
