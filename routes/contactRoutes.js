const express = require('express');
const router = express.Router();
const admin = require('../lib/firebase-admin');

// Middleware to verify Firebase token
async function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).send('No token');

    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).send('Unauthorized');
  }
}

// get client name
async function sendClientInfo(req, res) {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await admin.firestore()
      .collection('users')
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { clientId } = userDoc.data();

    const clientDoc = await admin.firestore()
      .collection('clients')
      .doc(clientId)
      .get();

    if (!clientDoc.exists) {
      return res.status(404).json({ error: 'Client document not found' });
    }

    return res.json(clientDoc.data());

  } catch (err) {
    console.error('client-info error:', err);
    res.status(500).json({ error: err.message });
  }
}

router.get('/client-info', sendClientInfo);
router.get('/clients-info', sendClientInfo);

//get contacts details
router.get('/contacts', verifyToken, async (req, res) => {
  try {
    const uid = req.uid;

    const userDoc = await admin.firestore()
      .collection('users')
      .doc(uid)
      .get();

    // ✅ SAFE CHECK
    if (!userDoc.exists) {
      return res.status(403).json({
        error: "User not registered in Firestore users collection"
      });
    }

    const userData = userDoc.data();
    const role = userData.role;
    const clientId = userData.clientId;

    let snap;

    if (role === 'admin') {
      snap = await admin.firestore()
        .collectionGroup('contacts')
        .get();
    } else {
      if (!clientId) {
        return res.status(400).json({
          error: "clientId missing for user"
        });
      }

      snap = await admin.firestore()
        .collection('clients')
        .doc(clientId)
        .collection('contacts')
        .get();
    }

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    return res.json(data);

  } catch (err) {
    console.error("CONTACT ERROR:", err);
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;