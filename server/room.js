const { createTransport } = require("./mediasoup");

module.exports = class Room {
  constructor(room_id, socket, router, io) {
    this.room_id = room_id;
    this.socket = socket;
    this.peers = new Map();
    this.router = router;
    this.io = io;
  }

  addPeer(peer) {
    this.peers.set(peer.id, peer);
  }

  getPeers() {
    return this.peers;
  }

  getRtpCapabilities() {
    return this.router.rtpCapabilities;
  }

  getProducerListForPeer(socket_id) {
    let producerList = [];

    this.peers.forEach((peer) => {
      peer.producers.forEach(
        (producer) =>
          peer.id !== socket_id &&
          producerList.push({
            producer_id: producer.id,
            kind: producer.kind,
            producer_socket_id: peer.id,
          })
      );
    });

    return producerList;
  }

  async createWebRtcTransport(socket_id) {
    const transport = await createTransport("webRtc", this.router);
    this.peers.get(socket_id).addTransport(transport);
    return transport;
  }

  async connectPeerTransport(socket_id, transport_id, dtlsParameters) {
    if (!this.peers.has(socket_id)) return;
    await this.peers.get(socket_id).connectTransport(transport_id, dtlsParameters);
  }

  async produce(socket_id, producerTransportId, rtpParameters, kind) {
    // handle undefined errors
    return new Promise(
      async function (resolve, reject) {
        let producer = await this.peers.get(socket_id).createProducer(producerTransportId, rtpParameters, kind);
        resolve(producer.id);

        // Broadcast to other peers my producer details
        this.broadCast(socket_id, "new-producer", [
          {
            producer_id: producer.id,
            producer_socket_id: socket_id,
            kind: producer.kind,
          },
        ]);
      }.bind(this)
    );
  }

  async consume(socket_id, consumer_transport_id, producer_id, rtpCapabilities) {
    // handle nulls
    if (!this.router.canConsume({ producerId: producer_id, rtpCapabilities })) {
      console.error("can not consume");
      return;
    }

    let { consumer, params } = await this.peers.get(socket_id).createConsumer(consumer_transport_id, producer_id, rtpCapabilities);

    consumer.on(
      "producerclose",
      function () {
        console.log("Consumer closed due to producerclose event", {
          name: `${this.peers.get(socket_id).name}`,
          consumer_id: `${consumer.id}`,
        });

        this.peers.get(socket_id).removeConsumer(consumer.id);

        // tell client consumer is dead
        this.io.to(socket_id).emit("producer-closed", { consumer_id: consumer.id });
      }.bind(this)
    );

    return params;
  }

  // Broadcast to other peers
  broadCast(socket_id, name, data) {
    for (let otherID of Array.from(this.peers.keys()).filter((id) => id !== socket_id)) {
      this.send(otherID, name, data);
    }
  }

  async removePeer(socket_id) {
    this.peers.get(socket_id).close();
    this.peers.delete(socket_id);
  }

  send(socket_id, name, data) {
    this.io.to(socket_id).emit(name, data);
  }
};
