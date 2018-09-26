import express from 'express';
import Swarm from 'discovery-swarm';
import getPort from 'get-port';
import bodyParser from 'body-parser';
import Blockchain from '../blockchain';
import Transaction from '../transaction';
import Block from '../block';

const P2P_CHANNEL = 'jc';
const server = express();
const swarm = Swarm();
const peers = [];
let chain = new Blockchain();

// Utility functions for P2P communication. We can "broadcast" a message to the
// entire network or we can directly "message" an individual peer.
function broadcast(message) {
  peers.forEach(peer => peer.write(JSON.stringify(message)));
}

function message(peer, message) {
  peer.write(JSON.stringify(message));
}

// Handle messages from the P2P network.
function handleGetBlockchain(peer) {
  console.log('\nPeer requested full chain... sending');
  message(peer, { message: 'BLOCKCHAIN', data: chain });
}

function handleReceiveBlockchain(peer, packet) {
  // A peer has sent us their current copy of the chain. If theirs is
  // longer than ours we can replace ours.
  //
  // TODO: validate the received chain in full.
  //
  console.log('\nReceived chain from peer...');
  const newChain = new Blockchain(packet.data);

  if (newChain.getLatestBlock().index > chain.getLatestBlock().index) {
    console.log('Received chain is longer... replacing');
    chain = newChain;
  } else {
    console.log('Received chain is not longer... ignoring');
  }
}

function handleReceiveBlock(peer, packet) {
  // A peer has created a new block. We need to validate the block in its own
  // right to ensure the peer has got the correct proof-of-work nonce. We also
  // need to check whether we can append the block to the chain we currently
  // hold. If our chain is more than one block behind we'll have to ask peers to
  // send their latest version.
  const newBlock = new Block(packet.data);

  console.log('\nReceived new block...');
  if (newBlock.isValid()) {
    console.log('New block is valid...');

    if (chain.validateBlock(newBlock)) {
      console.log('New block is valid for our current chain... appending');
      return chain.append(newBlock);
    }

    console.log('New block is invalid for our current chain...');
    return broadcast({ message: 'GET_BLOCKCHAIN' });
  }

  console.log('New block is invalid... ignoring');
}


// Start the HTTP server and the P2P connection.
(async () => {
  const HTTP_SERVER_PORT = await getPort();
  const P2P_SERVER_PORT = await getPort();

  // Start the P2P server and join the control channel for this blockchain. When
  // we receive connections from peers we set up a number of handlers to respond
  // to messages received from that peer.
  swarm.listen(P2P_SERVER_PORT);
  swarm.join(P2P_CHANNEL);

  swarm.on('connection', (connection) => {
    peers.push(connection);

    connection.on('data', (data) => {
      const obj = JSON.parse(data);

      switch (obj.message) {
        case 'GET_BLOCKCHAIN':
          // A peer needs the full chain.
          return handleGetBlockchain(connection, obj);

        case 'BLOCKCHAIN':
          // A peer has sent us their copy of the chain.
          return handleReceiveBlockchain(connection, obj);

        case 'BLOCK':
          // A peer has sent us a new block.
          return handleReceiveBlock(connection, obj);

        default:
          // Ignore unknown messages.
      }
    });
  });

  // Start an HTTP server on a given port. Nodes in our network offer a limited
  // HTTP API through which they can be controlled.
  server.use(bodyParser.json());
  server.listen(HTTP_SERVER_PORT, () => {
    console.log(`\nHTTP server listening on port ${HTTP_SERVER_PORT}`);
  });

  // Get the current state of the chain stored by this node.
  server.get('/blockchain', (req, res) => {
    res.json(chain);
  });

  // Create a new block.
  server.post('/block', (req, res) => {
    if (!chain) {
      return res.sendStatus(400);
    }

    console.log('\nCreating new block...');

    chain.createBlock(
      new Transaction(req.body.from, req.body.to, req.body.amount),
    );

    return res.sendStatus(201);
  });
})();
