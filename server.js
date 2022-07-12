const express = require("express");
const bodyParser = require("body-parser");
const ExpressPeerServer = require("peer").ExpressPeerServer;
const cors = require("cors");
const http = require("http");

class Server {
  constructor() {
    this.port = process.env.PORT || 5000;
    this.app = express();
    this.server = http.createServer(this.app);
    this.optionsForPeerjs = {
      debug: true,
    };
  }
  onError(error) {
    if (error.syscall !== "listen") {
      throw error;
    }

    const bind =
      typeof port === "string" ? "Pipe " + this.port : "Port " + this.port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  config() {
    const peerServer = ExpressPeerServer(this.server, this.optionsForPeerjs);
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(
      bodyParser.urlencoded({
        extended: false,
      })
    );
    this.app.use("/peer", peerServer);
    peerServer.on("connection", (client) => {
      console.log("Client connected : ", client);
    });
  }

  start() {
    this.config();
    this.app.set("port", this.port);
    this.server.listen(this.port);
    this.server.on("error", this.onError);
    console.log(" listening on port ", this.port);
  }
}

const app = new Server();
app.start();
