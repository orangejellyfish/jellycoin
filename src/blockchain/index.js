import Block from '../block';
import Transaction from '../transaction';

export default class Blockchain {
  constructor(blockchain) {
    if (blockchain) {
      this.chain = blockchain.chain;
    } else {
      this.chain = [];
      this.createGenesisBlock();
    }
  }

  createGenesisBlock() {
    const genesisTransaction = new Transaction(null, 'alice', 50);
    const genesisBlock = new Block(0, genesisTransaction, '0'.repeat(64));

    this.chain.push(genesisBlock);
  }
}
