import React from "react";

import { Box } from "@mui/system";

const MyVideoStreamCtx = React.createContext(null);
export const useMyVideoStream = () => React.useContext(MyVideoStreamCtx);

const MyVideoStreamContext = ({ children }) => {
  const getLocalStream = React.useCallback(async () => {
    try {
      let localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { min: 640, max: 1920 }, height: { min: 400, max: 1080 } },
      });

      const videoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];

      // "stream" is of MediaStream type
      localStream = new MediaStream([videoTrack, audioTrack]);

      return { localStream, track: { videoTrack, audioTrack } };
    } catch (err) {
      console.log(err.message);
    }
  }, []);

  return (
    <MyVideoStreamCtx.Provider value={{ getLocalStream }}>
      <Box sx={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}>{children}</Box>
    </MyVideoStreamCtx.Provider>
  );
};

export default MyVideoStreamContext;
