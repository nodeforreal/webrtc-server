const express = require("express");
const wrtc = require("wrtc");
const path = require("path");
const app = express();

let senderStream;

app.use(express.json());
app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/public/main.html"));
});

app.get("/broadcast", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/public/broadcast.html"));
});

app.get("/consumer", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/public/consumer.html"));
});

/* stun/turn config */
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

app.post("/broadcast", async (req, res) => {
  const { sdp } = req.body;
  const peer = new wrtc.RTCPeerConnection(config);
  iceLogs(peer, "broadcast")
  peer.ontrack = (e) => handleTrackEvent(e, peer);
  const desc = new wrtc.RTCSessionDescription(sdp);
  await peer.setRemoteDescription(desc);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  res.json({
	sdp: peer.localDescription,
  });
});

app.post("/consumer", async (req, res) => {
  const { sdp } = req.body;
  const peer = new wrtc.RTCPeerConnection(config);
  iceLogs(peer, "consumer")
  const desc = new wrtc.RTCSessionDescription(sdp);
  await peer.setRemoteDescription(desc);
  senderStream
	.getTracks()
	.forEach((track) => peer.addTrack(track, senderStream));
  const ans = await peer.createAnswer();
  await peer.setLocalDescription(ans);
  res.json({
	sdp: peer.localDescription,
  });
});

function handleTrackEvent(ev, peer) {
  console.log(ev.streams[0]);
  senderStream = ev.streams[0];
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server has started and is listening on port: ${PORT}`);
});

const iceLogs = (peer, loc) => {
  peer.onicegatheringstatechange = () => {
	console.log("ice gathering state: ",loc , peer.iceGatheringState);
  };

  peer.oniceconnectionstatechange = () => {
	console.log("ice connection state: ",loc , peer.iceConnectionState);
  };

  peer.onconnectionstatechange = () => {
	console.log("Connection state: ",loc , peer.connectionState);
  };
};
