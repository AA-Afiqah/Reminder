const admin = require('../lib/firebase-admin');

module.exports = async function (req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decoded.uid)
      .get();

    if (!userDoc.exists) {
      return res.status(403).json({ error: 'User not registered in system' });
    }

    req.user = {
      uid: decoded.uid,
      ...userDoc.data()
    };

    next();

  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};