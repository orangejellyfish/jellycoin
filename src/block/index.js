import crypto from 'crypto';

export default class Block {
  constructor(index, data, previousHash) {
    if (typeof index === 'object') {
      Object.assign(this, index);
    } else if (typeof index === 'number') {
      this.index = index;
      this.data = JSON.stringify(data);
      this.timestamp = new Date().getTime();
      this.nonce = 0;
      this.hash = this.createHash();
      this.previousHash = previousHash;
    } else {
      throw new Error('Could not construct the block.');
    }
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

  // Validate the block to ensure its hash is correct.
  isValid() {
    return this.hash === this.createHash();
  }
}
