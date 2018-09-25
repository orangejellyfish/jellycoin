import crypto from 'crypto';

export default class Block {
  constructor(index, data) {
    this.index = index;
    this.data = JSON.stringify(data);
    this.timestamp = new Date().getTime();
    this.hash = this.createHash();
  }

  createHash() {
    return crypto
      .createHash('sha256')
      .update(this.index + this.data + this.timestamp)
      .digest('hex');
  }
}
