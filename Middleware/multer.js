const multer = require('multer');
const storage = multer.memoryStorage(); // Utilise la mémoire pour stocker temporairement les fichiers avant de les envoyer à Firebase
const upload = multer({ storage: storage }).single('resume'); // Le champ de fichier attendu est 'resume'

module.exports = upload;