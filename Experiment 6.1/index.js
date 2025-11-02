const express = require('express');
const app = express();
const PORT = 3000;

// ------------------- Logging Middleware -------------------
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ------------------- Bearer Token Middleware -------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (token === 'mysecrettoken') {
    next();
  } else {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// ------------------- Routes -------------------

// Public route
app.get('/public', (req, res) => {
  res.send('This is a public route accessible without authentication.');
});

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.send('This is a protected route. You provided the correct Bearer token!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
