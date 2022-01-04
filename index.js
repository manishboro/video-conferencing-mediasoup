import express from "express";
const app = express();

// A module for serving http and https connections over the same port.
import https from "httpolyglot";
import fs from "fs";
import path from "path";
const __dirname = path.resolve();

app.get("/", (req, res) => {
  res.send("Hello from mediasoup app!");
});

const options = {
  key: fs.readFileSync("./server/ssl/key.pem", "utf-8"),
  cert: fs.readFileSync("./server/ssl/cert.pem", "utf-8"),
};

const httpsServer = https.createServer(options, app);

httpsServer.listen(3055, () => {
  console.log("listening on port: " + 3055);
});
