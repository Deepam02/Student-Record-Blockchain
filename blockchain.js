const crypto = require('crypto-js');
const BlockModel = require('./public/models/block'); // Adjust the path as necessary

class Block {
    constructor(timestamp, data, previousHash = '', nonce = 0, hash = '') {
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.nonce = nonce;
        this.hash = hash || this.calculateHash();
    }

    calculateHash() {
        return crypto.SHA256(
            this.previousHash +
            this.timestamp +
            JSON.stringify(this.data) +
            this.nonce
        ).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block mined: " + this.hash);
    }
}

class Blockchain {
    constructor() {
        this.difficulty = 2;
    }

    async initialize() {
        const blockCount = await BlockModel.countDocuments();
        if (blockCount === 0) {
            const genesisBlock = new Block(
                new Date().toISOString(),
                { message: "Genesis Block" },
                "0"
            );
            genesisBlock.mineBlock(this.difficulty);
            await this.saveBlock(genesisBlock);
        }
    }

    async getAllBlocks() {
        return await BlockModel.find();
    }

    async getLatestBlock() {
        const blocks = await BlockModel.find().sort({ _id: -1 }).limit(1);
        return blocks[0];
    }

    async addBlock(data) {
        const latestBlock = await this.getLatestBlock();
        const newBlock = new Block(
            new Date().toISOString(),
            data,
            latestBlock.hash
        );
        newBlock.mineBlock(this.difficulty);
        await this.saveBlock(newBlock);
        return newBlock;
    }

    async getBlock(hash) {
        return await BlockModel.findOne({ hash });
    }

    async deleteBlock(hashToDelete) {
        const allBlocks = await BlockModel.find().sort({ timestamp: 1 });
        const index = allBlocks.findIndex(block => block.hash === hashToDelete);
    
        // Cannot delete if not found or is Genesis block
        if (index <= 0) return false;
    
        const previousBlock = allBlocks[index - 1];
        const blocksToUpdate = allBlocks.slice(index + 1);
    
        // Delete the block
        await BlockModel.deleteOne({ hash: hashToDelete });
    
        // Update subsequent blocks
        let prevHash = previousBlock.hash;
        for (const block of blocksToUpdate) {
            block.previousHash = prevHash;
    
            // Recalculate hash using existing nonce and other data
            const recalculatedHash = crypto.SHA256(
                block.previousHash +
                block.timestamp +
                JSON.stringify(block.data) +
                block.nonce
            ).toString();
    
            block.hash = recalculatedHash;
            await block.save();
    
            // Update prevHash for the next iteration
            prevHash = recalculatedHash;
        }
    
        return true;
    }
    

    async isChainValid() {
        const chain = await this.getAllBlocks();
        for (let i = 1; i < chain.length; i++) {
            const current = chain[i];
            const previous = chain[i - 1];

            const recalculatedHash = crypto.SHA256(
                current.previousHash +
                current.timestamp +
                JSON.stringify(current.data) +
                current.nonce
            ).toString();

            if (current.hash !== recalculatedHash) return false;
            if (current.previousHash !== previous.hash) return false;
        }
        return true;
    }

    async saveBlock(block) {
        const blockDoc = new BlockModel({
            timestamp: block.timestamp,
            data: block.data,
            previousHash: block.previousHash,
            hash: block.hash,
            nonce: block.nonce
        });
        await blockDoc.save();
    }
}

module.exports = { Block, Blockchain };
