import { Routes, Route } from "react-router-dom";
import MyVideoStreamContext from "./components/Contexts/MyVideoStreamContext";
import Error from "./pages/Error";
import Home from "./pages/Home";
import Video from "./pages/Video";

function App() {
  return (
    <MyVideoStreamContext>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video/:roomName" element={<Video />} />
        <Route path="*" element={<Error />} />
      </Routes>
    </MyVideoStreamContext>
  );
}

export default App;
