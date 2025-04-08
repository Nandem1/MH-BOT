const fs = require('fs');
const path = require('path');

const TEMP_DIR = './temp';

// Asegurar que la carpeta temporal existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Guardar archivo temporalmente
const saveTempFile = (media, name, type = 'factura') => {
  if (!media || !media.data) {
    console.error("❌ Media inválida o vacía.");
    return null;
  }

  const prefix = type === 'nota_credito' ? 'nota_credito_' : 'factura_';
  const fileName = `${prefix}${name}.jpg`;
  const filePath = path.join(TEMP_DIR, fileName);

  fs.writeFileSync(filePath, media.data, "base64");
  console.log(`🖼️ Archivo temporal guardado: ${filePath}`);

  return filePath;
};

// Eliminar archivo temporal
const deleteTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Archivo temporal eliminado: ${filePath}`);
  }
};

module.exports = { saveTempFile, deleteTempFile };

