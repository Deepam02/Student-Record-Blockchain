const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
    timestamp: String,
    data: {
        studentName: String,
        studentId: String,
        courseDetails: String,
        grades: String
    },
    previousHash: String,
    hash: String,
    nonce: Number
});

module.exports = mongoose.model('Block', blockSchema);
