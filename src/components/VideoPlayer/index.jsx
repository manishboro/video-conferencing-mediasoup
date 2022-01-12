import { Box } from "@mui/system";
import React from "react";

const VideoPlayer = ({ stream }) => {
  const videoRef = React.useRef();

  React.useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <Box
      sx={{
        position: "relative",
        /* 16:9, for an aspect ratio of 1:1 change to this value to 100% */
        paddingBottom: "56.25%",
        backgroundColor: "#dcdcdc",
      }}
    >
      {stream && (
        <Box
          component="video"
          playsInline
          ref={videoRef}
          autoPlay
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      )}
    </Box>
  );
};

export default VideoPlayer;
