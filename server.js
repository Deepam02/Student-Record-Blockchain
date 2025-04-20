require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Blockchain } = require('./blockchain');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB connection logic (shared across requests)
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
    }
};

// Re-initialize blockchain each time (due to Vercel stateless nature)
const getBlockchain = async () => {
    const blockchain = new Blockchain();
    await blockchain.initialize();
    return blockchain;
};

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await connectDB();
        res.json({
            status: 'ok',
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        });
    } catch (err) {
        res.status(500).json({ error: 'MongoDB connection failed' });
    }
});

// Create a new block
app.post('/api/records', async (req, res) => {
    try {
        await connectDB();
        const blockchain = await getBlockchain();

        const { studentName, studentId, courseDetails, grades } = req.body;

        if (!studentName || !studentId || !courseDetails || !grades) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const recordData = { studentName, studentId, courseDetails, grades };
        const newBlock = await blockchain.addBlock(recordData);

        res.json({
            message: 'Record added successfully',
            blockHash: newBlock.hash
        });
    } catch (error) {
        console.error('Error adding record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all blocks
app.get('/api/records', async (req, res) => {
    try {
        await connectDB();
        const blockchain = await getBlockchain();
        const records = await blockchain.getAllBlocks();
        res.json(records);
    } catch (error) {
        console.error('Error getting records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get block by hash
app.get('/api/records/:hash', async (req, res) => {
    try {
        await connectDB();
        const blockchain = await getBlockchain();
        const block = await blockchain.getBlock(req.params.hash);
        if (block) {
            res.json(block);
        } else {
            res.status(404).json({ error: 'Record not found' });
        }
    } catch (error) {
        console.error('Error getting record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete block by hash
app.delete('/api/records/:hash', async (req, res) => {
    try {
        await connectDB();
        const blockchain = await getBlockchain();
        const success = await blockchain.deleteBlock(req.params.hash);
        if (!success) {
            return res.status(400).json({ error: 'Cannot delete genesis block or record not found' });
        }
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify chain
app.get('/api/verify', async (req, res) => {
    try {
        await connectDB();
        const blockchain = await getBlockchain();
        const isValid = await blockchain.isChainValid();
        const blockCount = (await blockchain.getAllBlocks()).length;
        res.json({ isValid, blockCount });
    } catch (error) {
        console.error('Error verifying chain:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start only in local dev
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running locally on port ${PORT}`);
    });
}

// Export handler for Vercel
module.exports = app;
