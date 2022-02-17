import * as mediasoupClient from "mediasoup-client";

export default class SocketFunctionTest {
  constructor(socket, room_id, handleRemoteStream) {
    this.room_id = room_id;
    this.socket = socket;
    this.handleRemoteStream = handleRemoteStream;

    // Store transport IDs inside
    this.isProducersExistCalled = undefined;

    this.device = undefined;
    this.rtpCapabilities = undefined;
    this.producerTransport = undefined;
    this.consumerTransport = undefined;

    // Store all consumers
    this.consumers = new Map();
    this.consumerTransports = new Map();
  }

  joinRoom({ track }) {
    this.socket.emit("join-room", { room_id: this.room_id, name: `Manish ${this.socket.id}` }, async (data) => {
      console.log(data);

      // Receive rtpCapabilities of router from the server
      this.rtpCapabilities = data.rtpCapabilities;

      console.log("Router RTP Capabilities - ", this.rtpCapabilities);

      if (this.rtpCapabilities) {
        this.device = new mediasoupClient.Device();

        // Loads the device with the RTP capabilities of the mediasoup router.
        // This is how the device knows about the allowed media codecs and other settings.
        await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

        console.log("Device RTP Capabilities - ", this.device.rtpCapabilities);

        if (this.device.canProduce("video") || this.device.canProduce("audio")) {
          this.signalNewProducerTransport(track);
        }
      }
    });
  }

  async signalNewProducerTransport(track) {
    this.socket.emit("createWebRtcTransport", { consumer: false, room_id: this.room_id }, (data) => {
      const { transportParams } = data;

      console.log("Producer Transport Parameters -", transportParams);

      // mediasoup server side WebRTC transports have DTLS role “auto” by default.
      // mediasoup-client selects “client” DTLS role by default for both sending and receiving transports.
      // However local DTLS role can be forced by overriding remote dtlsParameters.
      // role value with “client” to force the local DTLS role “server”
      this.producerTransport = this.device.createSendTransport(transportParams);

      this.producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await this.socket.emit("transport-connect", {
            dtlsParameters,
            transport_id: this.producerTransport.id,
            room_id: this.room_id,
          });

          // Tell the transport that parameters were transmitted.
          callback();
        } catch (error) {
          errback(error);
        }
      });

      // Gets called 2 times for audio and video
      this.producerTransport.on("produce", async (parameters, callback, errback) => {
        await this.socket.emit(
          "transport-produce",
          {
            transport_id: this.producerTransport.id,
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
            appData: parameters.appData,
            room_id: this.room_id,
          },
          ({ id }) => {
            callback({ id });
          }
        );
      });

      // Close transport if connection fails
      this.producerTransport.on("connectionstatechange", (connectionState) => {
        if (!connectionState) this.producerTransport.close();
      });

      this.socket.emit("getProducers");

      this.connectSendTransport(track);
    });
  }

  async connectSendTransport(track) {
    if (track) {
      // Produce video track
      if (track.videoTrack) {
        this.videoProducer = await this.producerTransport.produce({
          track: track.videoTrack,
          codec: this.device.rtpCapabilities.codecs.find((codec) => codec.mimeType.toLowerCase() === "video/h264"),
        });

        this.videoProducer.on("trackended", () => this.videoProducer.close());
        this.videoProducer.on("transportclose", () => this.videoProducer.close());
      }

      // Produce audio track
      if (track.audioTrack) {
        this.audioProducer = await this.producerTransport.produce({
          track: track.audioTrack,
          codec: this.device.rtpCapabilities.codecs.find((codec) => codec.mimeType.toLowerCase() === "audio/opus"),
        });

        this.audioProducer.on("trackended", () => this.audioProducer.close());
        this.audioProducer.on("transportclose", () => this.audioProducer.close());
      }
    }
  }

  async signalNewConsumerTransport(producer) {
    await this.socket.emit("createWebRtcTransport", { consumer: true, room_id: this.room_id }, (data) => {
      const { transportParams } = data;

      console.log("Consumer Transport Parameters -", transportParams);

      this.consumerTransport = this.device.createRecvTransport(transportParams);

      this.consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await this.socket.emit("transport-connect", {
            room_id: this.room_id,
            dtlsParameters,
            transport_id: transportParams.id,
          });

          // Tell the transport that parameters were transmitted.
          callback();
        } catch (error) {
          errback(error);
        }
      });

      // Close transport if connection fails
      this.consumerTransport.on("connectionstatechange", (connectionState) => {
        if (!connectionState) this.consumerTransport.close();
      });

      this.connectRecvTransport(producer);
    });
  }

  // Logic made to handle only one remote stream
  async connectRecvTransport(producer) {
    console.log("connectRecvTransport", producer);

    await this.socket.emit(
      "consume",
      {
        consumerTransportId: this.consumerTransport.id,
        producerId: producer.producer_id,
        rtpCapabilities: this.rtpCapabilities,
      },
      async (data) => {
        console.log(data);

        const { id, kind, producerId, rtpParameters } = data;

        const consumer = await this.consumerTransport.consume({ id, producerId, kind, rtpParameters });

        this.socket.emit("consumer-resume", { consumer_id: id });

        this.consumers.set(consumer.id, { consumer, consumerTransport: this.consumerTransport });

        this.setRemoteStream();
      }
    );
  }

  setRemoteStream() {
    let stream = new MediaStream();

    for (const [key, value] of this.consumers.entries()) {
      stream.addTrack(value.consumer.track);
    }

    this.handleRemoteStream(stream);
  }

  deleteConsumer(consumer_id) {
    const consumer = this.consumers.get(consumer_id);

    consumer.consumer.close();
    consumer.consumerTransport.close();

    this.consumers.delete(consumer_id);
  }

  // findProducerFromTransportsAndClose(remoteProducerId) {
  //   const producerToClose = this.consumers.find((transportData) => transportData.producerId === remoteProducerId);

  //   producerToClose.consumerTransport.close();
  //   producerToClose.consumer.close();
  // }

  // removeProducerFromTransports(remoteProducerId) {
  //   return this.consumers.filter((transportData) => transportData.producerId !== remoteProducerId);
  // }

  // getProducers() {
  //   this.socket.emit("getProducers", (data) => {
  //     const { filteredProducers } = data;

  //     console.log("filteredProducers", filteredProducers);

  //     // For each of the video / audio producer create a consumer
  //     // filteredProducers.forEach(async (producer) => await this.signalNewConsumerTransport({ producer }));
  //   });
  // }

  getRemoteStream() {
    return this.remoteStream;
  }
}
