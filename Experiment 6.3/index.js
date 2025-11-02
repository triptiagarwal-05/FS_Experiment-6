const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());

// ------------------- MongoDB Connection -------------------
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bank_transfer_demo')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ------------------- Account Model -------------------
const accountSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  balance: { type: Number, required: true, min: 0 }
});

const Account = mongoose.model('Account', accountSchema);

// ------------------- Transfer Endpoint -------------------
app.post('/transfer', async (req, res) => {
  const { sender, receiver, amount } = req.body;

  if (!sender || !receiver || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    // 1️⃣ Find sender and receiver
    const senderAcc = await Account.findOne({ username: sender });
    const receiverAcc = await Account.findOne({ username: receiver });

    if (!senderAcc) return res.status(404).json({ error: 'Sender account not found' });
    if (!receiverAcc) return res.status(404).json({ error: 'Receiver account not found' });

    // 2️⃣ Check balance
    if (senderAcc.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 3️⃣ Deduct from sender
    senderAcc.balance -= amount;
    await senderAcc.save();

    // 4️⃣ Add to receiver
    receiverAcc.balance += amount;
    await receiverAcc.save();

    return res.json({
      message: `Transferred ₹${amount} from ${sender} to ${receiver}`,
      senderNewBalance: senderAcc.balance,
      receiverNewBalance: receiverAcc.balance
    });

  } catch (err) {
    console.error('Transfer Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ------------------- Seed Sample Accounts -------------------
app.post('/seed', async (req, res) => {
  try {
    await Account.deleteMany({});
    const users = [
      { username: 'alice', balance: 1000 },
      { username: 'bob', balance: 500 }
    ];
    await Account.insertMany(users);
    res.json({ message: 'Seeded sample accounts', users });
  } catch (err) {
    res.status(500).json({ error: 'Seeding failed', details: err });
  }
});

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
