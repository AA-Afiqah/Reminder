const express = require('express');
const app = express();

const contactRoutes = require('./routes/contactRoutes');
const importRoutes = require('./routes/importRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use(express.json());

// API routes
app.use('/api', contactRoutes);
app.use('/api', importRoutes);
app.use('/api', adminRoutes);

// Static frontend
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port', PORT);
});