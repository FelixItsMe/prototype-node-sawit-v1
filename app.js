require('dotenv').config();
const WebSocket = require('ws');
const { SerialPort } = require('serialport')
const express = require('express')
const path = require('path');
const { createServer } = require('http')
const app = express()
const httpServer = createServer(app)
const bodyParser = require('body-parser')
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development);
const cors = require('cors');
let serialPort

const wss = new WebSocket.Server({ port: 8080 });
// const serialPort = new SerialPort({
//   path: "COM8",
//   baudRate: 9600,
//   autoOpen: false
// });

// serialPort.open((err) => {
//   console.log('Port open');
//   let errMessage = null
//   if (err) {
//     console.log(err);
//   }
// })

// SerialPort.list().then(function(ports) {
  // Open a serial port for each available port
  // ports.forEach(function(port) {
  //   const serialPortList = new SerialPort({ path: port.path,  baudRate: 9600, autoOpen: false })
  //   console.log(port.path);

    // serialPorts.push(serialPort)

    // // Listen for data on the port
    // serialPort.on('data', function(data) {
    //   console.log('Data from port', port.path, ':', data.toString());
    // });
//   });
// });

async function insert(geolocation) {
  try {
    const insertedRow = await knex('telemetries').insert({
      geolocation: geolocation,
    });

    // If the insertion was successful, return the inserted row
    return insertedRow[0];
  } catch (error) {
    // Handle any errors that might occur during the insertion process
    console.error('Error inserting data:', error);
    throw error;
  }
}

async function telemetries() {
  try {
    const rows = await knex.select('geolocation', 'created_at').from('telemetries')

    // If the insertion was successful, return the inserted row
    return rows;
  } catch (error) {
    // Handle any errors that might occur during the insertion process
    console.error('Error inserting data:', error);
    throw error;
  }
}

function sendMessageToClient(client, message) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(message);
  }
}

wss.on('connection', (ws) => {
  console.log('A new client connected.');

  ws.on('message', (message) => {
    console.log('Received:', message);
    // sendMessageToClient(ws, `Server received: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});

function openSerialPort(pathSelect, baudRateSelect) {
  if (!serialPort || !serialPort.isOpen) {
    serialPort = new SerialPort({
      path: pathSelect,
      baudRate: baudRateSelect,
      autoOpen: true
    });
    serialPort.on('open', () => {
      console.log('Serial port is open and ready to read data.');
    });

    serialPort.on('data', (data) => {
      const message = data.toString();
      console.log(message);
      if (message.split(",").length == 5) {
        wss.clients.forEach((client) => {
          sendMessageToClient(client, message);
        });
      }
    });

    serialPort.on('error', (err) => {
      console.error('Error in serial port:', err.message);
    });
  } else {
    console.log('Serial port is already open.');
  }
}

function closeSerialPort() {
  if (serialPort && serialPort.isOpen) {
    serialPort.close((err) => {
      if (err) {
        console.error('Error while closing serial port:', err.message);
      } else {
        console.log('Serial port closed.');
      }
    });
  } else {
    console.log('Serial port is not open.');
  }
}

// serialPort.on('open', () => {
//   console.log('Serial port is open and ready to read data.');
// });

// serialPort.on('data', (data) => {
//   const message = data.toString();
//   console.log(message);
//   if (message.split(",").length == 5) {
//     wss.clients.forEach((client) => {
//       sendMessageToClient(client, message);
//     });
//   }
// });

// Error handling for the serial port
// serialPort.on('error', (err) => {
//   console.error('Error in serial port:', err.message);
// });

app.use(cors());
app.use(bodyParser.json())

//ROUTES
app.get('/', async (req, res) => {
  // res.sendFile('views/index.html', {root: __dirname })
  const htmlFilePath = path.join(__dirname, 'views', 'index.html');
  // const jsFilePath = path.join(__dirname, 'views', 'view.js');

  // Set the appropriate headers for the file download
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', 'inline');

  // Send the HTML file as the response
  res.sendFile(htmlFilePath);
})

// Routes to handle opening and closing serial port
app.post('/open', (req, res) => {
  openSerialPort("COM8", 9600); // Replace with the correct port and baud rate
  res.status(200).send('Serial port opened.');
});

app.post('/close', (req, res) => {
  closeSerialPort();
  res.status(200).send('Serial port closed.');
});

app.post('/save', (req, res) => {
  insert(JSON.stringify(req.body.data));
  res.status(200).send({
    message: "Disimpan"
  });
});

app.get('/telemetries', async (req, res) => {
  const data = await telemetries()
  res.status(200).send({
    telemetries: data
  });
});

//START LISTENING
app.listen(7979, function () { console.log('Server started on port 7979')})