const express = require("express");
const wrtc = require("wrtc");
const path = require("path");
const app = express();

let senderStream;

app.use(express.json());
app.use(express.static("./public"));

app.get("/broadcast", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/public/broadcast.html"));
});

app.get("/consumer", (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "/public/consumer.html"));
});

app.post("/broadcast", async (req, res) => {
  const { sdp } = req.body;
  const peer = new wrtc.RTCPeerConnection();
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
  const peer = new wrtc.RTCPeerConnection();
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
