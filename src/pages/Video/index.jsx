import React from "react";
import { useParams } from "react-router-dom";
import { nanoid } from "nanoid";

import { Box, Grid } from "@mui/material";

import VideoPlayer from "../../components/VideoPlayer";
import SocketFunction from "../../utils/socket_functions";
import { socket } from "../../utils/socket";
import { useMyVideoStream } from "../../components/Contexts/MyVideoStreamContext";

const Video = () => {
  const { roomName } = useParams();
  const { getLocalStream, params } = useMyVideoStream();

  const [myStream, setMyStream] = React.useState();
  const [remoteStreams, setRemoteStreams] = React.useState([]);

  const socketFn = React.useMemo(() => new SocketFunction(socket, roomName, setRemoteStreams), [roomName]);

  React.useEffect(() => {
    socket.on("connection-success", async ({ socketId }) => {
      try {
        console.log("socketId", socketId);

        const response = await getLocalStream();

        setMyStream(response.stream);

        socketFn.joinRoom({ ...params, track: response.track });
      } catch (err) {
        console.warn(err.message);
      }
    });

    // Server informs the client of a new producer just joined
    socket.on("new-producer", ({ producerId }) => socketFn.signalNewConsumerTransport(producerId));

    socket.on("producer-closed", ({ remoteProducerId }) => {
      // Server notification is received when a producer is closed
      // we need to close the client-side consumer and associated transport
      console.log("producer closed");

      socketFn.findProducerFromTransportsAndClose(remoteProducerId);

      // Remove the consumer transport from the list
      socketFn.removeProducerFromTransports(remoteProducerId);

      setRemoteStreams((prev) => prev.filter((el) => el.producerId !== remoteProducerId));
    });

    return () => socket.removeAllListeners();
  }, [socketFn]);

  return (
    <Box sx={{ position: "relative", height: "100%", padding: "3rem" }}>
      <Grid container spacing={3} justifyContent="center" alignItems="center" sx={{ height: "100%" }}>
        {/* Local stream */}
        <Grid item xs={12} sm={12} md={6}>
          <VideoPlayer stream={myStream} />
        </Grid>

        {/* Remote streams */}
        {remoteStreams.map((el) => (
          <Grid item xs={12} sm={12} md={6} key={nanoid()}>
            <VideoPlayer stream={el.stream} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Video;
