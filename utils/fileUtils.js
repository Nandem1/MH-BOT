const fs = require('fs');
const path = require('path');

const TEMP_DIR = './temp';

// Asegurar que la carpeta temporal existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Guardar archivo temporalmente
const saveTempFile = (media, folio) => {
  const fileName = `factura_${folio}.jpg`;
  const filePath = path.join(TEMP_DIR, fileName);
  fs.writeFileSync(filePath, media.data, "base64");
  return filePath;
};

// Eliminar archivo temporal
const deleteTempFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = { saveTempFile, deleteTempFile };
