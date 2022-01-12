import * as mediasoupClient from "mediasoup-client";

export default class SocketFunction {
  constructor(socket, roomName, setRemoteStreams) {
    this.socket = socket;
    this.setRemoteStreams = setRemoteStreams;
    this.roomName = roomName;

    this.device = undefined;
    this.rtpCapabilities = undefined;
    this.producerTransport = undefined;
    this.consumerTransport = undefined;
    this.consumerTransports = [];
    this.producer = undefined;

    this.remoteStreams = [];
  }

  joinRoom(connectionParams) {
    console.log("hello");

    this.socket.emit("joinRoom", { roomName: this.roomName }, (data) => {
      // We assign to local variable and will be used when
      // loading the client Device (see createDevice above)
      this.rtpCapabilities = data.rtpCapabilities;

      console.log("Router RTP Capabilities - ", this.rtpCapabilities);

      // Once we have rtpCapabilities from the Router, create Device
      if (this.rtpCapabilities) this.createDevice(connectionParams);
    });
  }

  // A device is an endpoint connecting to a Router on the
  // server side to send/receive media
  async createDevice(connectionParams) {
    try {
      this.device = new mediasoupClient.Device();

      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-load
      // Loads the device with RTP capabilities of the Router (server side)
      await this.device.load({ routerRtpCapabilities: this.rtpCapabilities });

      console.log("Device RTP Capabilities - ", this.device.rtpCapabilities);

      // Once the device loads, create transport
      if (this.device) this.createSendTransport(connectionParams);
    } catch (error) {
      console.log("Error", error);

      if (error.name === "UnsupportedError") console.warn("Browser not supported");
    }
  }

  createSendTransport(connectionParams) {
    // See server's socket.on('createWebRtcTransport', sender?, ...)
    // this is a call from Producer, so sender = true
    this.socket.emit("createWebRtcTransport", { consumer: false }, ({ params }) => {
      // The server sends back params needed
      // to create Send Transport on the client side
      console.log("Transport Params", params);

      if (params.error) {
        console.log(params.error);
        return;
      }

      // Creates a new WebRTC Transport to send media
      // based on the server's producer transport params
      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
      this.producerTransport = this.device.createSendTransport(params);

      // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
      // this event is raised when a first call to transport.produce() is made
      // see connectSendTransport() below
      this.producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await this.socket.emit("transport-connect", { dtlsParameters });

          // Tell the transport that parameters were transmitted.
          callback();
        } catch (error) {
          errback(error);
        }
      });

      this.producerTransport.on("produce", async (parameters, callback, errback) => {
        console.log(parameters);

        try {
          // Tell the server to create a Producer
          // with the following parameters and produce
          // and expect back a server side producer id
          // see server's socket.on('transport-produce', ...)
          await this.socket.emit(
            "transport-produce",
            {
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData,
            },
            ({ id, producersExist }) => {
              // Tell the transport that parameters were transmitted and provide it with the
              // server side producer's id.
              callback({ id });

              // if producers exist, then join room
              if (producersExist) this.getProducers();
            }
          );
        } catch (error) {
          errback(error);
        }
      });

      this.connectSendTransport(connectionParams);
    });
  }

  getProducers() {
    this.socket.emit("getProducers", (producerIds) => {
      console.log("Producer IDs", producerIds);

      // For each of the producer create a consumer
      // producerIds.forEach(id => signalNewConsumerTransport(id))
      producerIds.forEach((el) => this.signalNewConsumerTransport(el));
    });
  }

  async connectSendTransport(connectionParams) {
    // we now call produce() to instruct the producer transport
    // to send media to the Router
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
    // this action will trigger the 'connect' and 'produce' events above
    if (connectionParams.track) {
      this.producer = await this.producerTransport.produce(connectionParams);

      this.producer.on("trackended", () => {
        console.log("track ended");
        // close video track
      });

      this.producer.on("transportclose", () => {
        console.log("transport ended");
        // close video track
      });
    }
  }

  async signalNewConsumerTransport(remoteProducerId) {
    console.log("signalNewConsumerTransport", remoteProducerId);

    await this.socket.emit("createWebRtcTransport", { consumer: true }, ({ params }) => {
      // The server sends back params needed
      // to create Send Transport on the client side
      if (params.error) {
        console.log(params.error);
        return;
      }

      console.log(`params... ${params}`);

      try {
        this.consumerTransport = this.device.createRecvTransport(params);
      } catch (error) {
        // exceptions:
        // {InvalidStateError} if not loaded
        // {TypeError} if wrong arguments.
        console.log(error);
        return;
      }

      this.consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-recv-connect', ...)
          await this.socket.emit("transport-recv-connect", {
            dtlsParameters,
            serverConsumerTransportId: params.id,
          });

          // Tell the transport that parameters were transmitted.
          callback();
        } catch (error) {
          // Tell the transport that something was wrong
          errback(error);
        }
      });

      this.connectRecvTransport(this.consumerTransport, remoteProducerId, params.id);
    });
  }

  async connectRecvTransport(consumerTransport, remoteProducerId, serverConsumerTransportId) {
    // For consumer, we need to tell the server first
    // to create a consumer based on the rtpCapabilities and consume
    // If the router can consume, it will send back a set of params as below
    await this.socket.emit(
      "consume",
      {
        rtpCapabilities: this.device.rtpCapabilities,
        remoteProducerId,
        serverConsumerTransportId,
      },
      async ({ params }) => {
        if (params.error) {
          console.log("Cannot Consume");
          return;
        }

        console.log(`Consumer Params ${params}`);
        // then consume with the local consumer transport
        // which creates a consumer
        const consumer = await consumerTransport.consume({
          id: params.id,
          producerId: params.producerId,
          kind: params.kind,
          rtpParameters: params.rtpParameters,
        });

        this.consumerTransports = [
          ...this.consumerTransports,
          {
            consumerTransport,
            serverConsumerTransportId: params.id,
            producerId: remoteProducerId,
            consumer,
          },
        ];

        // destructure and retrieve the video track from the producer
        const { track } = consumer;

        this.remoteStreams = [...this.remoteStreams, track];

        // Add streams
        this.setRemoteStreams((prev) => [...prev, { producerId: remoteProducerId, stream: new MediaStream([track]) }]);

        // console.log("remoteStreams", this.remoteStreams);

        // The server consumer started with media paused
        // so we need to inform the server to resume
        this.socket.emit("consumer-resume", { serverConsumerId: params.serverConsumerId });
      }
    );
  }

  findProducerFromTransportsAndClose(remoteProducerId) {
    const producerToClose = this.consumerTransports.find(
      (transportData) => transportData.producerId === remoteProducerId
    );

    producerToClose.consumerTransport.close();
    producerToClose.consumer.close();
  }

  removeProducerFromTransports(remoteProducerId) {
    return this.consumerTransports.filter((transportData) => transportData.producerId !== remoteProducerId);
  }

  getValues() {
    return { remoteStreams: this.remoteStreams };
  }
}
