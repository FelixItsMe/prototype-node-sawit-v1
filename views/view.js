const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

console.log("Hello world");
ws.on('open', () => {
  console.log('Connected to the server.');

  ws.send('Hello, server!');
});

ws.on('message', (message) => {
  console.log('Received from server:', message);
});

ws.on('close', () => {
  console.log('Connection to server closed.');
});
