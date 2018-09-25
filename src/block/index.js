export default class Block {
  constructor(index, data) {
    this.index = index;
    this.data = JSON.stringify(data);
    this.timestamp = new Date().getTime();
  }
}
