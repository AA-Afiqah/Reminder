const express = require('express');
const router = express.Router();
const admin = require('../lib/firebase-admin');

/**
 * LOGIN VERIFY (Google Firebase ID Token)
 * Frontend sends token → we verify → return user role
 */
router.post('/login', async (req, res) => {
  const token = req.body.token;

  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    // verify Firebase Auth token
    const decoded = await admin.auth().verifyIdToken(token);

    // get user role from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decoded.uid)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found in system' });
    }

    return res.json({
      uid: decoded.uid,
      email: decoded.email,
      role: userDoc.data().role,
      clientId: userDoc.data().clientId
    });

  } catch (err) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = router;