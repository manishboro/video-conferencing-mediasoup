import React from "react";

import { Box } from "@mui/system";

const MyVideoStreamCtx = React.createContext(null);
export const useMyVideoStream = () => React.useContext(MyVideoStreamCtx);

const MyVideoStreamContext = ({ children }) => {
  const params = React.useMemo(
    () => ({
      // mediasoup params
      encodings: [
        { rid: "r0", maxBitrate: 100000, scalabilityMode: "S1T3" },
        { rid: "r1", maxBitrate: 300000, scalabilityMode: "S1T3" },
        { rid: "r2", maxBitrate: 900000, scalabilityMode: "S1T3" },
      ],
      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
      codecOptions: { videoGoogleStartBitrate: 1000 },
    }),
    []
  );

  // const joinRoom = (params) => {
  //   console.log("joinRoom", params);

  //   socket.emit("joinRoom", { roomName }, (data) => {
  //     // We assign to local variable and will be used when
  //     // loading the client Device (see createDevice above)
  //     rtpCapabilities = data.rtpCapabilities;

  //     console.log("Router RTP Capabilities - ", rtpCapabilities);

  //     // Once we have rtpCapabilities from the Router, create Device
  //     if (rtpCapabilities) createDevice(params);
  //   });
  // };

  // // A device is an endpoint connecting to a Router on the
  // // server side to send/receive media
  // const createDevice = async (params) => {
  //   try {
  //     device = new mediasoupClient.Device();

  //     // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-load
  //     // Loads the device with RTP capabilities of the Router (server side)
  //     await device.load({ routerRtpCapabilities: rtpCapabilities });

  //     console.log("Device RTP Capabilities - ", device.rtpCapabilities);

  //     // Once the device loads, create transport
  //     if (device) createSendTransport(params);
  //   } catch (error) {
  //     console.log("Error", error);

  //     if (error.name === "UnsupportedError") {
  //       console.warn("Browser not supported");
  //     }
  //   }
  // };

  // const createSendTransport = (params) => {
  //   // See server's socket.on('createWebRtcTransport', sender?, ...)
  //   // this is a call from Producer, so sender = true
  //   socket.emit("createWebRtcTransport", { consumer: false }, ({ transportParams }) => {
  //     // The server sends back params needed
  //     // to create Send Transport on the client side
  //     console.log("Transport Params", transportParams);

  //     if (transportParams.error) {
  //       console.log(params.error);
  //       return;
  //     }

  //     // Creates a new WebRTC Transport to send media
  //     // based on the server's producer transport params
  //     // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
  //     producerTransport = device.createSendTransport(transportParams);

  //     // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
  //     // this event is raised when a first call to transport.produce() is made
  //     // see connectSendTransport() below
  //     producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
  //       try {
  //         // Signal local DTLS parameters to the server side transport
  //         // see server's socket.on('transport-connect', ...)
  //         await socket.emit("transport-connect", { dtlsParameters });

  //         // Tell the transport that parameters were transmitted.
  //         callback();
  //       } catch (error) {
  //         errback(error);
  //       }
  //     });

  //     producerTransport.on("produce", async (parameters, callback, errback) => {
  //       console.log(parameters);

  //       try {
  //         // Tell the server to create a Producer
  //         // with the following parameters and produce
  //         // and expect back a server side producer id
  //         // see server's socket.on('transport-produce', ...)
  //         await socket.emit(
  //           "transport-produce",
  //           {
  //             kind: parameters.kind,
  //             rtpParameters: parameters.rtpParameters,
  //             appData: parameters.appData,
  //           },
  //           ({ id, producersExist }) => {
  //             // Tell the transport that parameters were transmitted and provide it with the
  //             // server side producer's id.
  //             callback({ id });

  //             // if producers exist, then join room
  //             if (producersExist) getProducers();
  //           }
  //         );
  //       } catch (error) {
  //         errback(error);
  //       }
  //     });

  //     connectSendTransport(params);
  //   });
  // };

  // const connectSendTransport = async (params) => {
  //   // we now call produce() to instruct the producer transport
  //   // to send media to the Router
  //   // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
  //   // this action will trigger the 'connect' and 'produce' events above
  //   if (params.track) {
  //     producer = await producerTransport.produce(params);

  //     producer.on("trackended", () => {
  //       console.log("track ended");
  //       // close video track
  //     });

  //     producer.on("transportclose", () => {
  //       console.log("transport ended");
  //       // close video track
  //     });
  //   }
  // };

  // const getProducers = () => {
  //   socket.emit("getProducers", (producerIds) => {
  //     console.log(producerIds);
  //     // for each of the producer create a consumer
  //     // producerIds.forEach(id => signalNewConsumerTransport(id))
  //     producerIds.forEach(signalNewConsumerTransport);
  //   });
  // };

  // const signalNewConsumerTransport = async (remoteProducerId) => {
  //   await socket.emit("createWebRtcTransport", { consumer: true }, ({ transportParams }) => {
  //     // The server sends back transportParams needed
  //     // to create Send Transport on the client side
  //     if (transportParams.error) {
  //       console.log(transportParams.error);
  //       return;
  //     }
  //     console.log(`transportParams... ${transportParams}`);

  //     let consumerTransport;
  //     try {
  //       consumerTransport = device.createRecvTransport(transportParams);
  //     } catch (error) {
  //       // exceptions:
  //       // {InvalidStateError} if not loaded
  //       // {TypeError} if wrong arguments.
  //       console.log(error);
  //       return;
  //     }

  //     consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
  //       try {
  //         // Signal local DTLS parameters to the server side transport
  //         // see server's socket.on('transport-recv-connect', ...)
  //         await socket.emit("transport-recv-connect", {
  //           dtlsParameters,
  //           serverConsumerTransportId: transportParams.id,
  //         });

  //         // Tell the transport that parameters were transmitted.
  //         callback();
  //       } catch (error) {
  //         // Tell the transport that something was wrong
  //         errback(error);
  //       }
  //     });

  //     connectRecvTransport(consumerTransport, remoteProducerId, transportParams.id);
  //   });
  // };

  // const connectRecvTransport = async (consumerTransport, remoteProducerId, serverConsumerTransportId) => {
  //   // For consumer, we need to tell the server first
  //   // to create a consumer based on the rtpCapabilities and consume
  //   // If the router can consume, it will send back a set of params as below
  //   await socket.emit(
  //     "consume",
  //     {
  //       rtpCapabilities: device.rtpCapabilities,
  //       remoteProducerId,
  //       serverConsumerTransportId,
  //     },
  //     async ({ params }) => {
  //       if (params.error) {
  //         console.log("Cannot Consume");
  //         return;
  //       }

  //       console.log(`Consumer Params ${params}`);
  //       // then consume with the local consumer transport
  //       // which creates a consumer
  //       const consumer = await consumerTransport.consume({
  //         id: params.id,
  //         producerId: params.producerId,
  //         kind: params.kind,
  //         rtpParameters: params.rtpParameters,
  //       });

  //       consumerTransports = [
  //         ...consumerTransports,
  //         {
  //           consumerTransport,
  //           serverConsumerTransportId: params.id,
  //           producerId: remoteProducerId,
  //           consumer,
  //         },
  //       ];

  //       // destructure and retrieve the video track from the producer
  //       const { track } = consumer;
  //       setRemoteStreams((prev) => [...prev, new MediaStream([track])]);

  //       // The server consumer started with media paused
  //       // so we need to inform the server to resume
  //       socket.emit("consumer-resume", {
  //         serverConsumerId: params.serverConsumerId,
  //       });
  //     }
  //   );
  // };

  // const socketFn = React.useMemo(() => new SocketFunction(socket, "abcd"));

  const getLocalStream = React.useCallback(async () => {
    try {
      const myStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { min: 640, max: 1920 },
          height: { min: 400, max: 1080 },
        },
      });

      const track = myStream.getVideoTracks()[0];

      return { stream: myStream, track };
    } catch (err) {
      console.log(err.message);
    }
  }, []);

  return (
    <MyVideoStreamCtx.Provider value={{ params, getLocalStream }}>
      <Box sx={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>{children}</Box>
    </MyVideoStreamCtx.Provider>
  );
};

export default MyVideoStreamContext;
