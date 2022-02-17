import React from "react";
import { nanoid } from "nanoid";
import { useParams } from "react-router-dom";

import { Box, Grid, IconButton } from "@mui/material";
import MicTwoToneIcon from "@mui/icons-material/MicTwoTone";
import VideocamTwoToneIcon from "@mui/icons-material/VideocamTwoTone";
import CallEndTwoToneIcon from "@mui/icons-material/CallEndTwoTone";

import VideoPlayer from "../../components/VideoPlayer";
import SocketFunctionTest from "../../utils/socket_functions";
import { socket } from "../../utils/socket";
import { useMyVideoStream } from "../../components/Contexts/MyVideoStreamContext";

const Video = () => {
  const { roomName } = useParams();
  const { getLocalStream } = useMyVideoStream();

  const [localStream, setLocalStream] = React.useState();
  const [remoteStream, setRemoteStream] = React.useState();

  const socketFn = React.useMemo(() => new SocketFunctionTest(socket, roomName, setRemoteStream), [roomName]);

  React.useEffect(() => {
    socket.on("connection-success", async ({ socketId }) => {
      console.log("socketId", socketId);

      try {
        const response = await getLocalStream();

        setLocalStream(response.localStream);

        socketFn.joinRoom({ track: response.track });
      } catch (err) {
        console.warn(err.message);
      }
    });

    // Server informs the client of a new producer just joined
    socket.on("new-producer", async (data) => {
      console.log("new-producer", data);

      if (Array.isArray(data) && data.length === 1) {
        await socketFn.signalNewConsumerTransport(data[0]);
        return;
      }

      // if (Array.isArray(data) && data.length > 1) {
      //   // console.log(data);
      //   // data.forEach(async (el) => await socketFn.signalNewConsumerTransport(el));
      //   await socketFn.signalNewConsumerTransport(data[0]);
      //   await socketFn.signalNewConsumerTransport(data[1]);
      //   return;
      // }
    });

    socket.on("producer-closed", ({ consumer_id }) => {
      // Server notification is received when a producer is closed
      // we need to close the client-side consumer and associated transport
      console.log("producer closed");

      setRemoteStream(undefined);

      socketFn.deleteConsumer(consumer_id);

      // socketFn.findProducerFromTransportsAndClose(remoteProducerId);

      // // Remove the consumer transport from the list
      // socketFn.removeProducerFromTransports(remoteProducerId);

      // setRemoteStream(undefined);
    });

    return () => socket.removeAllListeners();

    // eslint-disable-next-line
  }, [socketFn]);

  // console.log("remoteStream", stream);

  return (
    <>
      <Box sx={{ position: "relative", height: "100%", bgcolor: "custom.dark_grey" }}>
        <Box sx={{ height: "calc(100% - 7rem)", position: "relative", overflow: "auto", padding: "0 2rem" }}>
          <Grid container justifyContent="center" alignItems="center" sx={{ height: "100%" }}>
            {/* Local stream */}
            <Grid item xs={12} sm={remoteStream ? 6 : 12} md={remoteStream ? 6 : 12}>
              <VideoPlayer stream={localStream} muted={true} />
            </Grid>

            {/* Remote stream */}
            {remoteStream ? (
              <Grid item xs={12} sm={6} md={6} key={nanoid()}>
                <VideoPlayer stream={remoteStream} />
              </Grid>
            ) : null}
          </Grid>
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "7rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          "& > *:not(:last-child)": { marginRight: "1rem" },
        }}
      >
        <IconButton
          sx={{
            bgcolor: "custom.dark_grey_md",
            "&:hover": { bgcolor: "custom.dark_grey_md" },
          }}
        >
          <MicTwoToneIcon sx={{ fontSize: "2.8rem", color: "white" }} />
        </IconButton>

        <IconButton
          sx={{
            bgcolor: "custom.dark_grey_md",
            "&:hover": { bgcolor: "custom.dark_grey_md" },
          }}
        >
          <VideocamTwoToneIcon sx={{ fontSize: "2.8rem", color: "white" }} />
        </IconButton>

        <IconButton
          sx={{
            bgcolor: "custom.medium_red",
            width: "6rem",
            borderRadius: "3rem",
            "&:hover": { bgcolor: "custom.medium_red" },
          }}
        >
          <CallEndTwoToneIcon sx={{ fontSize: "2.8rem", color: "white" }} />
        </IconButton>
      </Box>
    </>
  );
};

export default Video;
