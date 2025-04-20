require('dotenv').config(); // 👈 Add this at the very top

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Blockchain } = require('./blockchain');

const app = express();
const PORT = process.env.PORT || 3000;

// Load from .env
const MONGODB_URI = process.env.MONGODB_URI; // 👈 Use environment variable


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Connect MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('✅ MongoDB connected');

    // Initialize Blockchain
    global.blockchain = new Blockchain();
    await blockchain.initialize();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// Routes
app.post('/api/records', async (req, res) => {
    try {
        const { studentName, studentId, courseDetails, grades } = req.body;

        const recordData = {
            studentName,
            studentId,
            courseDetails,
            grades
        };

        const newBlock = await blockchain.addBlock(recordData);

        res.json({
            message: 'Record added successfully',
            blockHash: newBlock.hash
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/records', async (req, res) => {
    const records = await blockchain.getAllBlocks();
    res.json(records);
});

app.get('/api/records/:hash', async (req, res) => {
    const block = await blockchain.getBlock(req.params.hash);
    if (block) {
        res.json(block);
    } else {
        res.status(404).json({ error: 'Record not found' });
    }
});

app.delete('/api/records/:hash', async (req, res) => {
    try {
        const success = await blockchain.deleteBlock(req.params.hash);
        if (!success) {
            return res.status(400).json({ error: 'Cannot delete genesis block or record not found' });
        }
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/verify', async (req, res) => {
    const isValid = await blockchain.isChainValid();
    const blockCount = (await blockchain.getAllBlocks()).length;
    res.json({ isValid, blockCount });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
