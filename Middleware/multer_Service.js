const multer = require('multer');
const storage = multer.memoryStorage(); // Utilise la mémoire pour stocker temporairement les fichiers avant de les envoyer à Firebase
const multerStorageConfig = multer({ storage: storage }).single('images'); // Le champ de fichier attendu est 'resume'

module.exports = multerStorageConfig;