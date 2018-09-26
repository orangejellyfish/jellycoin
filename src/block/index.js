import crypto from 'crypto';

export default class Block {
  constructor(index, data, previousHash) {
    this.index = index;
    this.data = JSON.stringify(data);
    this.timestamp = new Date().getTime();
    this.nonce = 0;
    this.hash = this.createHash();
    this.previousHash = previousHash;
  }

  createHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.data +
        this.timestamp +
        this.previousHash +
        this.nonce
      )
      .digest('hex');
  }

  // Find a digest of the block starting with a given number of zeroes (the
  // "difficulty") and update the hash property accordingly.
  findNonce(difficulty) {
    const zeroes = '0'.repeat(difficulty);

    while (!this.hash.startsWith(zeroes)) {
      this.nonce++;
      this.hash = this.createHash();
    }
  }
}
