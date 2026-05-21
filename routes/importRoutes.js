const express = require('express');
const multer = require('multer');
const admin = require('../lib/firebase-admin');
const auth = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values.map((value) => value.replace(/^"|"$/g, '').trim());
}

function normalizePhone(phone, hasCountryCode, countryCode) {
  let value = String(phone || '').trim();
  if (!value) return '';

  value = value.replace(/\s|\(|\)|-/g, '');
  value = value.replace(/[^\d+]/g, '');
  if (!value) return '';

  if (!hasCountryCode) {
    value = value.replace(/^0+/, '');
    if (!value.startsWith('+')) {
      value = `+${countryCode || '60'}${value}`;
    }
  } else if (!value.startsWith('+')) {
    value = `+${value}`;
  }

  return value;
}

router.post('/import-contacts', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required.' });
    }

    const clientId = req.user?.clientId;
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID missing for authenticated user.' });
    }

    const hasCountryCode = req.body.hasCountryCode === 'yes';
    const countryCode = String(req.body.countryCode || '60').replace(/[^\d]/g, '') || '60';
    let tags = [];

    try {
      tags = JSON.parse(req.body.tags || '[]');
      if (!Array.isArray(tags)) tags = [];
    } catch (err) {
      tags = [];
    }

    const rawCsv = req.file.buffer.toString('utf8');
    const lines = rawCsv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      return res.status(400).json({ error: 'CSV file is empty.' });
    }

    const firstRow = parseCsvLine(lines[0]);
    const headerDetected = firstRow.some((value) => /^(first\s*name|name|phone|mobile|email)$/i.test(value));
    const rows = headerDetected ? lines.slice(1) : lines;

    const contacts = [];

    for (const row of rows) {
      const values = parseCsvLine(row);
      if (!values.length) continue;

      let firstName = '';
      let phone = '';

      if (values.length === 1) {
        phone = values[0];
      } else {
        firstName = values[0];
        phone = values[1];
      }

      const normalizedPhone = normalizePhone(phone, hasCountryCode, countryCode);
      if (!normalizedPhone) continue;

      contacts.push({
        firstName: firstName || undefined,
        phone: normalizedPhone,
        tags,
        source: 'csv-import',
        importedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    if (!contacts.length) {
      return res.status(400).json({ error: 'No valid contacts found in CSV.' });
    }

    const db = admin.firestore();
    const collectionRef = db.collection('clients').doc(clientId).collection('contacts');
    const batchSize = 400;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = db.batch();
      contacts.slice(i, i + batchSize).forEach((contact) => {
        const docRef = collectionRef.doc();
        batch.set(docRef, contact);
      });
      await batch.commit();
    }

    return res.json({ imported: contacts.length });
  } catch (error) {
    console.error('Import contacts error:', error);
    return res.status(500).json({ error: error.message || 'Server error during import.' });
  }
});

module.exports = router;
