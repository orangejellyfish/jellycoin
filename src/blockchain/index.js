import Block from '../block';
import Transaction from '../transaction';

export default class Blockchain {
  constructor(blockchain) {
    if (blockchain) {
      this.chain = blockchain.chain;
      this.difficulty = blockchain.difficulty;
    } else {
      this.chain = [];
      this.difficulty = 4;
      this.createGenesisBlock();
    }
  }

  // Create the first ("genesis") block in the chain. A block must contain a
  // reference to the hash of the previous block but in this special case we
  // use a fake hash of all zeroes.
  createGenesisBlock() {
    const genesisTransaction = new Transaction(null, 'alice', 50);
    const genesisBlock = new Block(0, genesisTransaction, '0'.repeat(64));

    genesisBlock.findNonce(this.difficulty);
    this.chain.push(genesisBlock);
  }

  // Create the next block in the chain based on the index and hash of the
  // current latest block.
  createBlock(data) {
    const previousBlock = this.chain[this.chain.length - 1];
    const nextIndex = previousBlock.index + 1;
    const nextBlock = new Block(nextIndex, data, previousBlock.hash);

    nextBlock.findNonce(this.difficulty);
    this.chain.push(nextBlock);

    return nextBlock;
  }

  validateBlock(block) {
    const previousBlock = this.chain[this.chain.length - 1];

    return block.previousHash === previousBlock.hash
      && block.index === previousBlock.index + 1;
  }

  append(block) {
    this.chain.push(block);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }
}
