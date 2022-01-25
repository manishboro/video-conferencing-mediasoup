// const dotenv = require("dotenv");

// const express = require("express");
// const app = express();

// const https = require("httpolyglot");
// const fs = require("fs");
// const cors = require("cors");
// const path = require("path");
// const { Server } = require("socket.io");

// const { initializeWorkers, createRouter, createTransport } = require("./mediasoup");

// dotenv.config();
// console.log("Environment :", process.env.NODE_ENV);

// const PROCESS_NAME = process.env.PROCESS_NAME || "FFmpeg";
// const SERVER_PORT = process.env.SERVER_PORT || 3000;

// app.use(cors(), express.json(), express.static(path.resolve(__dirname, "../build")));

// // SSL cert for HTTPS access
// const options = {
//   key: fs.readFileSync(process.env.KEY_LOCATION),
//   cert: fs.readFileSync(process.env.CERT_LOCATION),
//   ca: fs.readFileSync(process.env.CA_LOCATION),
// };

// let rooms = {}; // { roomName1: { Router, rooms: [ sicketId1, ... ] }, ...}
// let peers = {}; // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,] }, consumers = [id1, id2,], peerDetails }, ...}
// let transports = []; // [ { socketId1, roomName1, transport, consumer }, ... ]
// let producers = []; // [ { socketId1, roomName1, producer, }, ... ]
// let consumers = []; // [ { socketId1, roomName1, consumer, }, ... ]

// // Add middlewares
// app.use(cors(), express.json(), express.static(path.resolve(__dirname, "../build")));

// app.get("/api", (req, res) => res.send("<h1>Running !!</h1>"));

// // Redirect all unmatched routes to React
// app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "../build", "index.html")));

// // Starting socket.io
// const httpsServer = https.createServer(options, app);
// const connections = new Server(httpsServer, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
// });

// // Initializing workers as soon as server starts
// (async () => {
//   try {
//     console.log("starting server [processName:%s]", PROCESS_NAME);
//     await initializeWorkers();

//     httpsServer.listen(SERVER_PORT, () => console.log("Socket Server listening on port %d", SERVER_PORT));
//   } catch (error) {
//     console.error("Failed to initialize application [error:%o] destroying in 2 seconds...", error);
//     setTimeout(() => process.exit(1), 2000);
//   }
// })();

// connections.on("connection", async (socket) => {
//   console.log("socket ID", socket.id);

//   socket.emit("connection-success", { socketId: socket.id });

//   socket.on("disconnect", () => {
//     // do some cleanup
//     console.log("peer disconnected");
//     consumers = removeItems(consumers, socket.id, "consumer", socket);
//     producers = removeItems(producers, socket.id, "producer", socket);
//     transports = removeItems(transports, socket.id, "transport", socket);

//     if (peers[socket.id]) {
//       const { roomName } = peers[socket.id];
//       delete peers[socket.id];

//       // Remove socket from room
//       rooms[roomName] = {
//         router: rooms[roomName].router,
//         peers: rooms[roomName].peers.filter((socketId) => socketId !== socket.id),
//       };
//     }
//   });

//   socket.on("joinRoom", async ({ roomName }, callback) => {
//     console.log("roomName", roomName);

//     const router = await createRoom(roomName, socket.id);

//     peers[socket.id] = {
//       socket,
//       roomName, // Name for the Router this Peer joined
//       transports: [],
//       producers: [],
//       consumers: [],
//       peerDetails: { name: "", isAdmin: false }, // Is this Peer the Admin?
//     };

//     // get Router RTP Capabilities
//     const rtpCapabilities = router.rtpCapabilities;

//     // call callback from the client and send back the rtpCapabilities
//     callback({ rtpCapabilities });
//   });

//   // Client emits a request to create server side Transport
//   // We need to differentiate between the producer and consumer transports
//   socket.on("createWebRtcTransport", async ({ consumer }, callback) => {
//     // get Room Name from Peer's properties
//     const roomName = peers[socket.id].roomName;

//     // get Router (Room) object this peer is in based on RoomName
//     const router = rooms[roomName].router;

//     createTransport("webRtc", router).then(
//       (transport) => {
//         callback({
//           params: {
//             id: transport.id,
//             iceParameters: transport.iceParameters,
//             iceCandidates: transport.iceCandidates,
//             dtlsParameters: transport.dtlsParameters,
//           },
//         });

//         // add transport to Peer's properties
//         addTransport(transport, roomName, consumer, socket);
//       },
//       (error) => console.log(error)
//     );
//   });

//   socket.on("getProducers", (callback) => {
//     // return all producer transports
//     const { roomName } = peers[socket.id];

//     let producerList = [];

//     producers.forEach((producerData) => {
//       if (producerData.socketId !== socket.id && producerData.roomName === roomName)
//         producerList = [...producerList, producerData.producer.id];
//     });

//     // return the producer list back to the client
//     callback(producerList);
//   });

//   // see client's socket.emit('transport-connect', ...)
//   socket.on("transport-connect", ({ dtlsParameters }) => {
//     console.log("DTLS PARAMS... ", { dtlsParameters });

//     getTransport(socket.id).connect({ dtlsParameters });
//   });

//   // see client's socket.emit('transport-produce', ...)
//   socket.on("transport-produce", async ({ kind, rtpParameters, appData }, callback) => {
//     // call produce based on the parameters from the client
//     const producer = await getTransport(socket.id).produce({ kind, rtpParameters });

//     // add producer to the producers array
//     const { roomName } = peers[socket.id];

//     addProducer(producer, roomName, socket);

//     informConsumers(roomName, socket.id, producer.id);

//     console.log("Producer ID: ", producer.id, producer.kind);

//     producer.on("transportclose", () => {
//       console.log("transport for this producer closed ");
//       producer.close();
//     });

//     // Send back to the client the Producer's id
//     callback({ id: producer.id, producersExist: producers.length > 1 ? true : false });
//   });

//   // see client's socket.emit('transport-recv-connect', ...)
//   socket.on("transport-recv-connect", async ({ dtlsParameters, serverConsumerTransportId }) => {
//     console.log(`DTLS PARAMS: ${dtlsParameters}`);

//     const consumerTransport = transports.find(
//       (transportData) => transportData.consumer && transportData.transport.id == serverConsumerTransportId
//     ).transport;

//     await consumerTransport.connect({ dtlsParameters });
//   });

//   socket.on("consume", async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId }, callback) => {
//     try {
//       const { roomName } = peers[socket.id];

//       const router = rooms[roomName].router;

//       let consumerTransport = transports.find(
//         (transportData) => transportData.consumer && transportData.transport.id == serverConsumerTransportId
//       ).transport;

//       // check if the router can consume the specified producer
//       if (router.canConsume({ producerId: remoteProducerId, rtpCapabilities })) {
//         // transport can now consume and return a consumer
//         const consumer = await consumerTransport.consume({
//           producerId: remoteProducerId,
//           rtpCapabilities,
//           paused: true,
//         });

//         consumer.on("transportclose", () => {
//           console.log("transport close from consumer");
//         });

//         consumer.on("producerclose", () => {
//           console.log("producer of consumer closed");
//           socket.emit("producer-closed", { remoteProducerId });

//           consumerTransport.close([]);
//           transports = transports.filter((transportData) => transportData.transport.id !== consumerTransport.id);
//           consumer.close();
//           consumers = consumers.filter((consumerData) => consumerData.consumer.id !== consumer.id);
//         });

//         addConsumer(consumer, roomName, socket);

//         // From the consumer extract the following params
//         // to send back to the Client
//         const params = {
//           id: consumer.id,
//           producerId: remoteProducerId,
//           kind: consumer.kind,
//           rtpParameters: consumer.rtpParameters,
//           serverConsumerId: consumer.id,
//         };

//         // send the parameters to the client
//         callback({ params });
//       }
//     } catch (error) {
//       console.log(error.message);
//       callback({ params: { error: error } });
//     }
//   });

//   socket.on("consumer-resume", async ({ serverConsumerId }) => {
//     console.log("consumer resume");

//     const { consumer } = consumers.find((consumerData) => consumerData.consumer.id === serverConsumerId);

//     await consumer.resume();
//   });
// });

// const createRoom = async (roomName, socketId) => {
//   // Create router for every new room
//   let router;
//   let peers = [];

//   if (rooms[roomName]) {
//     router = rooms[roomName].router;
//     peers = rooms[roomName].peers || [];
//   } else {
//     router = await createRouter();
//   }

//   console.log(`Router ID: ${router.id}`, peers.length);

//   rooms[roomName] = { router: router, peers: [...peers, socketId] };

//   return router;
// };

// const addTransport = (transport, roomName, consumer, socket) => {
//   transports = [...transports, { socketId: socket.id, transport, roomName, consumer }];

//   peers[socket.id] = { ...peers[socket.id], transports: [...peers[socket.id].transports, transport.id] };
// };

// const addProducer = (producer, roomName, socket) => {
//   producers = [...producers, { socketId: socket.id, producer, roomName }];

//   peers[socket.id] = { ...peers[socket.id], producers: [...peers[socket.id].producers, producer.id] };
// };

// const addConsumer = (consumer, roomName, socket) => {
//   // add the consumer to the consumers list
//   consumers = [...consumers, { socketId: socket.id, consumer, roomName }];

//   // add the consumer id to the peers list
//   peers[socket.id] = { ...peers[socket.id], consumers: [...peers[socket.id].consumers, consumer.id] };
// };

// const informConsumers = (roomName, socketId, id) => {
//   console.log(`just joined, id ${id} ${roomName}, ${socketId}`);
//   // A new producer just joined
//   // let all consumers to consume this producer
//   producers.forEach((producerData) => {
//     if (producerData.socketId !== socketId && producerData.roomName === roomName) {
//       const producerSocket = peers[producerData.socketId].socket;
//       // use socket to send producer id to producer
//       producerSocket.emit("new-producer", { producerId: id });
//     }
//   });
// };

// const getTransport = (socketId) => {
//   const [producerTransport] = transports.filter((transport) => transport.socketId === socketId && !transport.consumer);

//   return producerTransport.transport;
// };

// const removeItems = (items, socketId, type, socket) => {
//   items.forEach((item) => {
//     if (item.socketId === socket.id) item[type].close();
//   });

//   items = items.filter((item) => item.socketId !== socket.id);

//   return items;
// };

const dotenv = require("dotenv");

const express = require("express");
const app = express();

const https = require("httpolyglot");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");

const { initializeWorkers, createRouter, createTransport } = require("./mediasoup");

dotenv.config();
console.log("Environment :", process.env.NODE_ENV);

const PROCESS_NAME = process.env.PROCESS_NAME || "FFmpeg";
const SERVER_PORT = process.env.SERVER_PORT || 3000;

app.use(cors(), express.json(), express.static(path.resolve(__dirname, "../build")));

// SSL cert for HTTPS access
const options = {
  key: fs.readFileSync(process.env.KEY_LOCATION),
  cert: fs.readFileSync(process.env.CERT_LOCATION),
  ca: fs.readFileSync(process.env.CA_LOCATION),
};

let rooms = {}; // { roomName1: { Router, rooms: [ socketId1, ... ] }, ...}
let peers = {}; // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,] }, consumers = [id1, id2,], peerDetails }, ...}
let transports = []; // [ { socketId1, roomName1, transport, consumer }, ... ]
let producers = []; // [ { socketId1, roomName1, producer, }, ... ]
let consumers = []; // [ { socketId1, roomName1, consumer, }, ... ]

// Add middlewares
app.use(cors(), express.json(), express.static(path.resolve(__dirname, "../build")));

app.get("/api", (req, res) => res.send("<h1>Running !!</h1>"));

// Redirect all unmatched routes to React
app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "../build", "index.html")));

// Starting socket.io
const httpsServer = https.createServer(options, app);
const connections = new Server(httpsServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Initializing workers as soon as server starts
(async () => {
  try {
    console.log("starting server [processName:%s]", PROCESS_NAME);
    await initializeWorkers();

    httpsServer.listen(SERVER_PORT, () => console.log("Socket Server listening on port %d", SERVER_PORT));
  } catch (error) {
    console.error("Failed to initialize application [error:%o] destroying in 2 seconds...", error);
    setTimeout(() => process.exit(1), 2000);
  }
})();

connections.on("connection", async (socket) => {
  console.log("socket ID", socket.id);

  socket.emit("connection-success", { socketId: socket.id });

  socket.on("disconnect", () => {
    // do some cleanup
    console.log("peer disconnected");
    consumers = removeItems(consumers, socket.id, "consumer", socket);
    producers = removeItems(producers, socket.id, "producer", socket);
    transports = removeItems(transports, socket.id, "transport", socket);

    if (peers[socket.id]) {
      const { roomName } = peers[socket.id];
      delete peers[socket.id];

      // Remove socket from room
      rooms[roomName] = {
        router: rooms[roomName].router,
        peers: rooms[roomName].peers.filter((socketId) => socketId !== socket.id),
      };
    }
  });

  socket.on("joinRoom", async ({ roomName }, callback) => {
    console.log("roomName", roomName);

    const router = await createRoom(roomName, socket.id);

    peers[socket.id] = {
      socket,
      roomName, // Name for the Router this Peer joined
      transports: [],
      producers: [],
      consumers: [],
      peerDetails: { name: "", isAdmin: false }, // Is this Peer the Admin?
    };

    // get Router RTP Capabilities
    const rtpCapabilities = router.rtpCapabilities;

    // call callback from the client and send back the rtpCapabilities
    callback({ rtpCapabilities });
  });

  // Client emits a request to create server side Transport
  // We need to differentiate between the producer and consumer transports
  socket.on("createWebRtcTransport", async ({ consumer }, callback) => {
    // get Room Name from Peer's properties
    const roomName = peers[socket.id].roomName;

    // get Router (Room) object this peer is in based on RoomName
    const router = rooms[roomName].router;

    createTransport("webRtc", router).then(
      (transport) => {
        callback({
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        });

        // add transport to Peer's properties
        addTransport(transport, roomName, consumer, socket);
      },
      (error) => console.log(error)
    );
  });

  socket.on("getProducers", (callback) => {
    // return all producer transports
    const { roomName } = peers[socket.id];

    let producerList = [];

    producers.forEach((producerData) => {
      if (producerData.socketId !== socket.id && producerData.roomName === roomName)
        producerList = [...producerList, producerData.producer.id];
    });

    // return the producer list back to the client
    callback(producerList);
  });

  // see client's socket.emit('transport-connect', ...)
  socket.on("transport-connect", ({ dtlsParameters }) => {
    console.log("DTLS PARAMS... ", { dtlsParameters });

    getTransport(socket.id).connect({ dtlsParameters });
  });

  // see client's socket.emit('transport-produce', ...)
  socket.on("transport-produce", async ({ kind, rtpParameters, appData }, callback) => {
    // call produce based on the parameters from the client
    const producer = await getTransport(socket.id).produce({ kind, rtpParameters });

    // *** same socketId with different producers return same producerId

    // Add producer to the producers array
    const { roomName } = peers[socket.id];

    addProducer(producer, roomName, socket);

    informConsumers(roomName, socket.id, producer.id);

    console.log("Producer ID: ", producer.id, producer.kind);

    producer.on("transportclose", () => {
      console.log("transport for this producer closed ");
      producer.close();
    });

    // Send back to the client the Producer's id
    callback({ id: producer.id, kind: producer.kind, producersExist: producers.length > 1 ? true : false });
  });

  // see client's socket.emit('transport-recv-connect', ...)
  socket.on("transport-recv-connect", async ({ dtlsParameters, serverConsumerTransportId }) => {
    console.log(`DTLS PARAMS: ${dtlsParameters}`);

    const consumerTransport = transports.find(
      (transportData) => transportData.consumer && transportData.transport.id == serverConsumerTransportId
    ).transport;

    await consumerTransport.connect({ dtlsParameters });
  });

  socket.on("consume", async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId }, callback) => {
    try {
      const { roomName } = peers[socket.id];

      const router = rooms[roomName].router;

      let consumerTransport = transports.find(
        (transportData) => transportData.consumer && transportData.transport.id == serverConsumerTransportId
      ).transport;

      // check if the router can consume the specified producer
      if (router.canConsume({ producerId: remoteProducerId, rtpCapabilities })) {
        // transport can now consume and return a consumer
        const consumer = await consumerTransport.consume({
          producerId: remoteProducerId,
          rtpCapabilities,
          paused: true,
        });

        consumer.on("transportclose", () => {
          console.log("transport close from consumer");
        });

        consumer.on("producerclose", () => {
          console.log("producer of consumer closed");
          socket.emit("producer-closed", { remoteProducerId });

          consumerTransport.close([]);
          transports = transports.filter((transportData) => transportData.transport.id !== consumerTransport.id);
          consumer.close();
          consumers = consumers.filter((consumerData) => consumerData.consumer.id !== consumer.id);
        });

        addConsumer(consumer, roomName, socket);

        // From the consumer extract the following params
        // to send back to the Client
        const params = {
          id: consumer.id,
          producerId: remoteProducerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          serverConsumerId: consumer.id,
        };

        // send the parameters to the client
        callback({ params });
      }
    } catch (error) {
      console.log(error.message);
      callback({ params: { error: error } });
    }
  });

  socket.on("consumer-resume", async ({ serverConsumerId }) => {
    console.log("consumer resume");

    const { consumer } = consumers.find((consumerData) => consumerData.consumer.id === serverConsumerId);

    await consumer.resume();
  });
});

const createRoom = async (roomName, socketId) => {
  // Create router for every new room
  let router;
  let peers = [];

  if (rooms[roomName]) {
    router = rooms[roomName].router;
    peers = rooms[roomName].peers || [];
  } else {
    router = await createRouter();
  }

  console.log(`Router ID: ${router.id}`, peers.length);

  rooms[roomName] = { router: router, peers: [...peers, socketId] };

  return router;
};

const addTransport = (transport, roomName, consumer, socket) => {
  transports = [...transports, { socketId: socket.id, transport, roomName, consumer }];

  peers[socket.id] = { ...peers[socket.id], transports: [...peers[socket.id].transports, transport.id] };
};

const addProducer = (producer, roomName, socket) => {
  // kind can be "audio" or "video"
  producers = [
    ...producers,
    {
      socketId: socket.id,
      kind: producer.kind,
      producer,
      roomName,
    },
  ];

  peers[socket.id] = { ...peers[socket.id], producers: [...peers[socket.id].producers, producer.id] };
};

const addConsumer = (consumer, roomName, socket) => {
  // add the consumer to the consumers list
  consumers = [...consumers, { socketId: socket.id, consumer, roomName }];

  // add the consumer id to the peers list
  peers[socket.id] = { ...peers[socket.id], consumers: [...peers[socket.id].consumers, consumer.id] };
};

const informConsumers = (roomName, socketId, id) => {
  console.log(`just joined, id ${id} ${roomName}, ${socketId}`);

  // A new producer just joined. Let all consumers to consume this producer except itself.
  producers.forEach((producerData) => {
    if (producerData.socketId !== socketId && producerData.roomName === roomName) {
      const producerSocket = peers[producerData.socketId].socket;
      // use socket to send producer id to producer
      producerSocket.emit("new-producer", { producerId: id });
    }
  });
};

const getTransport = (socketId) => {
  const [producerTransport] = transports.filter((transport) => transport.socketId === socketId && !transport.consumer);

  return producerTransport.transport;
};

const removeItems = (items, socketId, type, socket) => {
  items.forEach((item) => {
    if (item.socketId === socket.id) item[type].close();
  });

  items = items.filter((item) => item.socketId !== socket.id);

  return items;
};
