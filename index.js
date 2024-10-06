const express = require("express");
const path = require("path");
const Websocket = require("ws");
const wrtc = require("wrtc");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("Port is listening on " + PORT);
});

const config = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "92bd35bda92e2b08f8052c74",
      credential: "rlp6S0cU7HuSSUBv",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "92bd35bda92e2b08f8052c74",
      credential: "rlp6S0cU7HuSSUBv",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "92bd35bda92e2b08f8052c74",
      credential: "rlp6S0cU7HuSSUBv",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "92bd35bda92e2b08f8052c74",
      credential: "rlp6S0cU7HuSSUBv",
    },
  ],
};

const websocket = new Websocket.Server({ port: 3300 });

websocket.on("connection", (ws) => {
  console.log("ws connection opened.");

  const peer = new wrtc.RTCPeerConnection(config);
  peer.addTransceiver("video", { direction: "recvonly" });

  const dc = peer.createDataChannel("chat");

  dc.onopen = () => {
    console.log("webrtc datachannel connection established.");
  };

  dc.onmessage = (event) => {
    console.log("on datachannel message:", event.data);
  };

  peer.onicecandidate = (e) => {
    if (e.candidate) {
      ws.send(
        JSON.stringify({
          event: "candidate",
          data: e.candidate,
        })
      );
      console.log("sent icecandidate to client.", e.candidate);
    }
  };

  peer.ontrack = (event, peer) => {
    console.log("streams from client:", event);
  };

  peer
    .createOffer()
    .then((offer) => {
      return peer.setLocalDescription(offer);
    })
    .then(() => {
      ws.send(
        JSON.stringify({
          event: "offer",
          data: peer.localDescription,
        })
      );
      console.log("sent offer to the client.");
    });

  ws.on("message", (buffer) => {
    const { event, data } = JSON.parse(buffer.toString());

    if (event === "answer") {
      console.log("answer received from client.", data);
      peer.setRemoteDescription(data);
    }

    if (event === "candidate") {
      console.log("candidate received from client.", data);
      peer.addIceCandidate(data);
    }
  });

  ws.on("close", () => {
    console.log("ws disconnected.");
  });
});
