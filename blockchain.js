const crypto = require('crypto-js');
const BlockModel = require('./models/block');

class Block {
    constructor(timestamp, data, previousHash = '', nonce = 0, hash = '') {
        // Ensure timestamp is always stored as ISO string
        this.timestamp = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.nonce = nonce;
        this.hash = hash || this.calculateHash();
    }

    calculateHash() {
        const blockString = this.previousHash + 
            this.timestamp + 
            JSON.stringify(this.data) + 
            this.nonce;
        return crypto.SHA256(blockString).toString();
    }

    mineBlock(difficulty) {
        const target = Array(difficulty + 1).join("0");
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block mined: " + this.hash);
    }

    toJSON() {
        return {
            timestamp: this.timestamp,
            data: this.data,
            previousHash: this.previousHash,
            hash: this.hash,
            nonce: this.nonce
        };
    }
}

class Blockchain {
    constructor() {
        this.difficulty = 2;
    }

    async initialize() {
        try {
            const blockCount = await BlockModel.countDocuments();
            if (blockCount === 0) {
                console.log("Creating genesis block...");
                const genesisBlock = new Block(
                    new Date().toISOString(),
                    { message: "Genesis Block" },
                    "0"
                );
                genesisBlock.mineBlock(this.difficulty);
                await this.saveBlock(genesisBlock);
                console.log("Genesis block created successfully");
            }
        } catch (error) {
            console.error("Error initializing blockchain:", error);
            throw error;
        }
    }

    async getAllBlocks() {
        try {
            return await BlockModel.find().sort({ timestamp: 1 });
        } catch (error) {
            console.error("Error getting all blocks:", error);
            throw error;
        }
    }

    async getLatestBlock() {
        try {
            const blocks = await BlockModel.find().sort({ timestamp: -1 }).limit(1);
            if (blocks.length === 0) {
                throw new Error("No blocks found in the chain");
            }
            return blocks[0];
        } catch (error) {
            console.error("Error getting latest block:", error);
            throw error;
        }
    }

    async addBlock(data) {
        try {
            const latestBlock = await this.getLatestBlock();
            const newBlock = new Block(
                new Date().toISOString(),
                data,
                latestBlock.hash
            );
            
            console.log("Mining new block...");
            newBlock.mineBlock(this.difficulty);
            
            console.log("Saving new block...");
            await this.saveBlock(newBlock);
            
            // Verify the chain after adding new block
            const isValid = await this.isChainValid();
            console.log("Chain validity after adding block:", isValid);
            
            return newBlock;
        } catch (error) {
            console.error("Error adding block:", error);
            throw error;
        }
    }

    async getBlock(hash) {
        try {
            return await BlockModel.findOne({ hash });
        } catch (error) {
            console.error("Error getting block:", error);
            throw error;
        }
    }

    async deleteBlock(hashToDelete) {
        try {
            const allBlocks = await this.getAllBlocks();
            const index = allBlocks.findIndex(block => block.hash === hashToDelete);
    
            // Can't delete genesis block or non-existent block
            if (index <= 0) return false;
    
            const previousBlock = allBlocks[index - 1];
            const blocksToUpdate = allBlocks.slice(index + 1);
    
            // Delete the target block
            await BlockModel.deleteOne({ hash: hashToDelete });
    
            // Update and re-mine all subsequent blocks
            let lastBlock = previousBlock;
    
            for (const mongoBlock of blocksToUpdate) {
                const blockData = mongoBlock.toObject();
    
                // Create a new Block with updated previousHash
                const updatedBlock = new Block(
                    blockData.timestamp,
                    blockData.data,
                    lastBlock.hash
                );
    
                // Mine to get a valid hash
                updatedBlock.mineBlock(this.difficulty);
    
                // Update the MongoDB document
                await BlockModel.updateOne(
                    { _id: mongoBlock._id },
                    updatedBlock.toJSON()
                );
    
                // Move to next
                lastBlock = updatedBlock;
            }
    
            return true;
    
        } catch (error) {
            console.error("Error deleting block:", error);
            throw error;
        }
    }
    

    async isChainValid() {
        try {
            const chain = await this.getAllBlocks();
            console.log("Verifying chain with", chain.length, "blocks");
            
            for (let i = 1; i < chain.length; i++) {
                const current = chain[i];
                const previous = chain[i - 1];

                // Convert MongoDB document to plain object and ensure timestamp is ISO string
                const currentData = current.toObject();
                const previousData = previous.toObject();

                // Create a new Block instance with the current block's data
                const currentBlock = new Block(
                    currentData.timestamp,
                    currentData.data,
                    currentData.previousHash,
                    currentData.nonce
                );

                // Calculate hash using the same method as during mining
                const recalculatedHash = currentBlock.calculateHash();

                console.log("Block", i, "verification:");
                console.log("Current hash:", currentData.hash);
                console.log("Recalculated hash:", recalculatedHash);
                console.log("Previous hash:", currentData.previousHash);
                console.log("Expected previous hash:", previousData.hash);
                console.log("Block data:", JSON.stringify(currentData.data));
                console.log("Timestamp used:", currentData.timestamp);

                if (currentData.hash !== recalculatedHash) {
                    console.log("Hash mismatch detected");
                    return false;
                }
                if (currentData.previousHash !== previousData.hash) {
                    console.log("Previous hash mismatch detected");
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error("Error verifying chain:", error);
            throw error;
        }
    }

    async saveBlock(block) {
        try {
            const blockDoc = new BlockModel(block.toJSON());
            await blockDoc.save();
            console.log("Block saved successfully:", block.hash);
        } catch (error) {
            console.error("Error saving block:", error);
            throw error;
        }
    }
}

module.exports = { Block, Blockchain };