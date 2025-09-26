// Configuration Google Drive pour le développement local
// Ce fichier est utilisé quand l'application est servie via un serveur local

// Vérifier si la configuration n'existe pas déjà
if (typeof window.GOOGLE_DRIVE_CONFIG === 'undefined') {
  window.GOOGLE_DRIVE_CONFIG = {
    // Remplacez par vos vraies clés API
    apiKey: 'AIzaSyCsVwCrv-BNBSWboXzqgGuPALAkG1zlydc', // Remplace par ta vraie API Key (commence par AIzaSy...)
    clientId: '846510559111-oce94sjsu2jtb83gcohpo8nvkahveo6i.apps.googleusercontent.com', // Remplace par ton vrai Client ID
    
    // APIs et scopes nécessaires
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    scopes: 'https://www.googleapis.com/auth/drive.file'
  };
}

// Export pour utilisation dans app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.GOOGLE_DRIVE_CONFIG;
}
