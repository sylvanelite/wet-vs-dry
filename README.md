# wet-vs-dry
created for the NT game jam 2021 on itch.io

https://stales.itch.io/dont-go-in-the-water-stay-on-dry-land

To run, server the folder in under localhost. e.g. python -m http.server
By default, when running under localhost, the game will search for a Peer.JS server running on the same host (localhost or IP address) on port 9000.

A peer.js server can be set up by creating a node.js project with a file containing:

const { PeerServer } = require('peer');

const peerServer = PeerServer({ port: 9000 });

running this file (e.g. 'node main.js') will create the multiplayer server
