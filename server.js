require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Blockchain } = require('./blockchain');

const app = express();
const PORT = process.env.PORT || 3000;

// Load from .env
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Connection with retry logic
let blockchain;
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB connected');
        
        // Initialize Blockchain
        blockchain = new Blockchain();
        await blockchain.initialize();
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        // Don't throw error, let the app continue
    }
};

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Routes
app.post('/api/records', async (req, res) => {
    try {
        if (!blockchain) {
            return res.status(503).json({ error: 'Blockchain not initialized' });
        }

        const { studentName, studentId, courseDetails, grades } = req.body;

        if (!studentName || !studentId || !courseDetails || !grades) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

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
        console.error('Error adding record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/records', async (req, res) => {
    try {
        if (!blockchain) {
            return res.status(503).json({ error: 'Blockchain not initialized' });
        }
        const records = await blockchain.getAllBlocks();
        res.json(records);
    } catch (error) {
        console.error('Error getting records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/records/:hash', async (req, res) => {
    try {
        if (!blockchain) {
            return res.status(503).json({ error: 'Blockchain not initialized' });
        }
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

app.delete('/api/records/:hash', async (req, res) => {
    try {
        if (!blockchain) {
            return res.status(503).json({ error: 'Blockchain not initialized' });
        }
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

app.get('/api/verify', async (req, res) => {
    try {
        if (!blockchain) {
            return res.status(503).json({ error: 'Blockchain not initialized' });
        }
        const isValid = await blockchain.isChainValid();
        const blockCount = (await blockchain.getAllBlocks()).length;
        res.json({ isValid, blockCount });
    } catch (error) {
        console.error('Error verifying chain:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export the Express API
module.exports = app;