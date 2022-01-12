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
