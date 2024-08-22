// firebaseConfig.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Téléchargez ce fichier depuis Firebase Console

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'onrtech.appspot.com' // Remplacez par le nom de votre bucket
});

const bucket = admin.storage().bucket();

module.exports = {
    bucket
};

