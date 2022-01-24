import { Box } from "@mui/system";
import React from "react";

const VideoPlayer = ({ stream }) => {
  const videoRef = React.useRef();

  React.useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <Box sx={{ width: "100%", maxWidth: "120rem", margin: "auto", padding: ".5rem" }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          height: 0,
          paddingBottom: "56.25%" /* 16:9, for an aspect ratio of 1:1 change to this value to 100% */,
          backgroundColor: "#dcdcdc",
          overflow: "hidden",
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
              width: "100% !important",
              maxWidth: "100%",
              height: "100% !important",
              transform: "rotateY(180deg)",
              objectFit: "cover",
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default VideoPlayer;
