import React from "react";
import { useParams } from "react-router-dom";
import { nanoid } from "nanoid";

import { Box, Grid, IconButton } from "@mui/material";
import MicTwoToneIcon from "@mui/icons-material/MicTwoTone";
import VideocamTwoToneIcon from "@mui/icons-material/VideocamTwoTone";
import CallEndTwoToneIcon from "@mui/icons-material/CallEndTwoTone";

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

    // eslint-disable-next-line
  }, [socketFn]);

  return (
    <>
      <Box sx={{ position: "relative", height: "100%", bgcolor: "custom.dark_grey" }}>
        <Box sx={{ height: "calc(100% - 7rem)", position: "relative", overflow: "auto", padding: "0 2rem" }}>
          <Grid container justifyContent="center" alignItems="center" sx={{ height: "100%" }}>
            {/* Local stream */}
            <Grid item xs={12} sm={6} md={Array.isArray(remoteStreams) && remoteStreams.length ? 6 : 12}>
              <VideoPlayer stream={myStream} />
            </Grid>

            {/* Remote streams */}
            {remoteStreams.map((el) => (
              <Grid item xs={12} sm={6} md={6} key={nanoid()}>
                <VideoPlayer stream={el.stream} />
              </Grid>
            ))}
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
        <IconButton sx={{ bgcolor: "custom.dark_grey_md", "&:hover": { bgcolor: "custom.dark_grey_md" } }}>
          <MicTwoToneIcon sx={{ fontSize: "2.8rem", color: "white" }} />
        </IconButton>

        <IconButton sx={{ bgcolor: "custom.dark_grey_md", "&:hover": { bgcolor: "custom.dark_grey_md" } }}>
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
