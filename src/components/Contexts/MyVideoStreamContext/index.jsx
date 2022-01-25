import React from "react";

import { Box } from "@mui/system";

const MyVideoStreamCtx = React.createContext(null);
export const useMyVideoStream = () => React.useContext(MyVideoStreamCtx);

// mediasoup params
// encodings: [
//   { rid: "r0", maxBitrate: 100000, scalabilityMode: "S1T3" },
//   { rid: "r1", maxBitrate: 300000, scalabilityMode: "S1T3" },
//   { rid: "r2", maxBitrate: 900000, scalabilityMode: "S1T3" },
// ],
// https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
// codecOptions: { videoGoogleStartBitrate: 1000 },

const MyVideoStreamContext = ({ children }) => {
  const params = React.useMemo(() => ({}), []);

  const getLocalStream = React.useCallback(async () => {
    try {
      const myStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { min: 640, max: 1920 },
          height: { min: 400, max: 1080 },
        },
      });

      const videoTrack = myStream.getVideoTracks()[0];
      const audioTrack = myStream.getAudioTracks()[0];

      // stream is of MediaStream type
      let newStream = new MediaStream([videoTrack, audioTrack]);

      // getTracks method returns an array of all stream inputs
      // within a MediaStream object, in this case we have
      // two tracks, an audio and a video track
      // myStream.getTracks().forEach((track) => newStream.addTrack(track));

      return { stream: newStream, track: { videoTrack, audioTrack } };
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
