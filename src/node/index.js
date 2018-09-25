import express from 'express';
import Swarm from 'discovery-swarm';
import getPort from 'get-port';
import bodyParser from 'body-parser';
import Blockchain from '../blockchain';
import Transaction from '../transaction';

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
