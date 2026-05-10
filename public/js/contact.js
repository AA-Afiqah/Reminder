//console.log("USER DOC:", userDoc.data());
//console.log("CLIENT ID:", clientId);
router.get('/client-info', async (req, res) => {
  try {
    const clientId = req.clientId; // from your auth middleware

    const doc = await admin.firestore()
      .collection('clients')
      .doc(clientId)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(doc.data()); // contains field = name

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});