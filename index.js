import express from "express";
import fs from "fs";
import path from "path";
import https from "httpolyglot"; // A module for serving http and https connections over the same port.

const app = express();
const __dirname = path.resolve();

const options = {
  key: fs.readFileSync("./server/ssl/key.pem", "utf-8"),
  cert: fs.readFileSync("./server/ssl/cert.pem", "utf-8"),
};

app.get("/", (req, res) => res.send("Hello from mediasoup app!"));

app.use("/sfu", express.static(path.join(__dirname, "public")));

const httpsServer = https.createServer(options, app);
httpsServer.listen(3055, () => console.log("listening on port: " + 3055));
