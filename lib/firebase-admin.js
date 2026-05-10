const admin = require("firebase-admin");

// Cloud Run uses default credentials automatically
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

module.exports = admin;