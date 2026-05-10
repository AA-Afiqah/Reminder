const express = require('express');
const router = express.Router();
const admin = require('../lib/firebase-admin');
const auth = require('../middleware/auth');

/**
 * ASSIGN ROLE (ADMIN ONLY)
 */
router.post('/assign-user', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { uid, role, clientId } = req.body;

  await admin.firestore()
    .collection('users')
    .doc(uid)
    .set({
      role,
      clientId: clientId || null
    });

  res.json({ message: 'User assigned successfully' });
});

module.exports = router;