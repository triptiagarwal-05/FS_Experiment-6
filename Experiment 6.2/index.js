const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const PORT = 3000;
const SECRET_KEY = 'myjwtsecretkey';

// Hardcoded user (for demo)
const USER = {
  username: 'bankuser',
  password: 'securepassword'
};

// Simulated account data
let account = {
  balance: 1000
};

// -------------------- LOGIN --------------------
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === USER.username && password === USER.password) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ message: 'Login successful', token });
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

// -------------------- JWT Middleware --------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // attach decoded user info to request
    next();
  });
};

// -------------------- Protected Routes --------------------

// View balance
app.get('/balance', authenticateToken, (req, res) => {
  res.json({ balance: account.balance });
});

// Deposit money
app.post('/deposit', authenticateToken, (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }
  account.balance += amount;
  res.json({ message: `Deposited ₹${amount}`, newBalance: account.balance });
});

// Withdraw money
app.post('/withdraw', authenticateToken, (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }
  if (amount > account.balance) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  account.balance -= amount;
  res.json({ message: `Withdrew ₹${amount}`, newBalance: account.balance });
});

// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
