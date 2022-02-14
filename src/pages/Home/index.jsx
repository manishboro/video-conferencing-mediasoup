import React from "react";
import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";

import { Grid } from "@mui/material";
import { Box } from "@mui/system";
import VideoCameraFrontIcon from "@mui/icons-material/VideoCameraFront";
import KeyboardIcon from "@mui/icons-material/Keyboard";

import CustomButton from "../../components/Reusable/CustomButton";
import VideoPlayer from "../../components/VideoPlayer";
import { useMyVideoStream } from "../../components/Contexts/MyVideoStreamContext";

const Home = () => {
  const navigate = useNavigate();
  const [stream, setStream] = React.useState();
  const { getLocalStream } = useMyVideoStream();

  React.useEffect(() => {
    const myStream = async () => {
      const response = await getLocalStream();
      setStream(response.localStream);
    };

    myStream();
  }, []);

  const createMeeting = () => {
    navigate(`/video/${nanoid()}?admin=true`);
    window.location.reload();
  };

  return (
    <Box sx={{ position: "relative", height: "100%", padding: "3rem" }}>
      <Grid container spacing={3} justifyContent="center" alignItems="center" sx={{ height: "100%" }}>
        <Grid item xs={12} sm={12} md={6}>
          <VideoPlayer stream={stream} muted={true} />
        </Grid>

        <Grid item xs={12} sm={12} md={6} sx={{ textAlign: "center" }}>
          <CustomButton text="Create Meeting" Icon={VideoCameraFrontIcon} IconDirection="left" fn={createMeeting} />

          <CustomButton
            text="Join Meeting"
            rootStyles={{ marginLeft: "1.5rem" }}
            Icon={KeyboardIcon}
            IconDirection="left"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
