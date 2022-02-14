const dotenv = require("dotenv");
const express = require("express");
const https = require("httpolyglot");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");

const Room = require("./room");
const Peer = require("./peer");
const { initializeWorkers, createRouter, createTransport } = require("./mediasoup");

const app = express();

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

// Add middlewares
app.use(cors(), express.json(), express.static(path.resolve(__dirname, "../build")));

app.get("/api", (req, res) => res.send("<h1>Running !!</h1>"));

// Redirect all unmatched routes to React
app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "../build", "index.html")));

// Starting socket.io
const httpsServer = https.createServer(options, app);
const io = new Server(httpsServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Initializing workers as soon as server starts
(async () => {
  try {
    await initializeWorkers();

    httpsServer.listen(SERVER_PORT, () => console.log("Socket Server listening on port %d", SERVER_PORT));
  } catch (error) {
    console.error("Failed to initialize application [error:%o] destroying in 2 seconds...", error);
    setTimeout(() => process.exit(1), 2000);
  }
})();

let rooms = {};
let peers = {};
let transports = [];
let producers = [];
let consumers = [];

/*
    rooms = {
        [roomName]:{
            router,
            peers: [...],
        }
    }
*/

/*
    peers = {
        socketId: {
            socket,
            [roomName]: "",
            transports: [...],
            producers: [...],
            peerDetails: { name: "", isAdmin: false },
        }    
    }
*/

let roomList = new Map();

io.on("connection", async (socket) => {
  socket.emit("connection-success", { socketId: socket.id });

  socket.on("join-room", async ({ room_id, name }, callback) => {
    console.log("Room Name", room_id);
    console.log("Server Socket ID", socket.id);

    if (roomList.has(room_id)) {
      roomList.get(room_id).addPeer(new Peer(socket.id, name));
    } else {
      // Create router if room not present
      const router = await createRouter();

      roomList.set(room_id, new Room(room_id, socket, router, io));

      // Add peer after creating room
      roomList.get(room_id).addPeer(new Peer(socket.id, name));
    }

    socket.room_id = room_id;

    // Send rtpCapabilities to client
    callback({ rtpCapabilities: roomList.get(room_id).getRtpCapabilities() });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");

    if (!socket.room_id) return;

    roomList.get(socket.room_id).removePeer(socket.id);
  });

  socket.on("getProducers", () => {
    if (!roomList.has(socket.room_id)) return;
    console.log("Get producers", { name: `${roomList.get(socket.room_id).getPeers().get(socket.id).name}` });

    // Send all the current producer to newly joined member
    let producerList = roomList.get(socket.room_id).getProducerListForPeer(socket.id);

    producerList.forEach((el) => socket.emit("new-producer", [el]));
  });

  socket.on("createWebRtcTransport", async ({ room_id, consumer }, callback) => {
    console.log("Create WebRTC Transport");
    const transport = await roomList.get(room_id).createWebRtcTransport(socket.id);

    callback({
      transportParams: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    });
  });

  socket.on("transport-connect", async ({ room_id, transport_id, dtlsParameters }) => {
    if (!roomList.has(room_id)) return;

    await roomList.get(room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters);
  });

  socket.on("transport-produce", async ({ transport_id, kind, rtpParameters, appData, room_id }, callback) => {
    if (!roomList.has(room_id)) return callback({ error: "Invalid room ID" });

    const producerId = await roomList.get(room_id).produce(socket.id, transport_id, rtpParameters, kind);

    callback({ id: producerId });
  });

  socket.on("consume", async ({ consumerTransportId, producerId, rtpCapabilities }, callback) => {
    //TODO null handling
    let params = await roomList.get(socket.room_id).consume(socket.id, consumerTransportId, producerId, rtpCapabilities);

    // console.log(params);

    console.log("Consuming", {
      name: `${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`,
      producer_id: `${producerId}`,
      consumer_id: `${params.id}`,
    });

    callback(params);
  });

  socket.on("consumer-resume", async ({ consumer_id }) => {
    const consumer = roomList.get(socket.room_id).getPeers().get(socket.id).getConsumer(consumer_id);
    await consumer.resume();
  });
});
