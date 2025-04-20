const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    previousHash: { type: String, required: true },
    hash: { type: String, required: true, unique: true },
    nonce: { type: Number, default: 0 }
});

module.exports = mongoose.model('Block', blockSchema);
