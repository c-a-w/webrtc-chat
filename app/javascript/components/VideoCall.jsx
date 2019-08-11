/* global App */

import React, { useEffect } from 'react';
import {
  JOIN_CALL, EXCHANGE, LEAVE_CALL, broadcastData, ice
} from './video_util';

const VideoCall = () => {
  let pcPeers = {};
  const userId = Math.floor(Math.random() * 10000);
  let localStream;
  let remoteVideoContainer;
  let localVideo;

  useEffect(() => {
    remoteVideoContainer = document.getElementById('remote-video-container');
    localVideo = document.getElementById('local-video');
    navigator
      .mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
      })
      .catch((error) => { console.log(error); });
  });

  const createPC = (pcUserId, offerBool) => {
    const pc = new RTCPeerConnection(ice);
    pcPeers[pcUserId] = pc;
    localStream
      .getTracks()
      .forEach((track) => pc.addTrack(track, localStream));
    if (offerBool) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer).then(() => {
          setTimeout(() => {
            broadcastData({
              type: EXCHANGE,
              from: userId,
              to: pcUserId,
              sdp: JSON.stringify(pc.localDescription),
            });
          }, 0);
        });
      });
    }
    pc.onicecandidate = (e) => {
      broadcastData({
        type: EXCHANGE,
        from: userId,
        to: pcUserId,
        sdp: JSON.stringify(e.candidate),
      });
    };
    pc.ontrack = (e) => {
      const remoteVid = document.createElement('video');
      remoteVid.id = `remoteVideoContainer+${userId}`;
      remoteVid.autoplay = 'autoplay';
      [remoteVid.srcObject] = e.streams;
      remoteVideoContainer.appendChild(remoteVid);
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected') {
        broadcastData({ type: LEAVE_CALL, from: userId });
      }
    };
    return pc;
  };

  const join = (data) => {
    createPC(data.from, true);
  };

  const exchange = (data) => {
    let pc;
    if (pcPeers[data.from]) {
      pc = pcPeers[data.from];
    } else {
      pc = createPC(data.from, false);
    }
    if (data.candidate) {
      const candidate = JSON.parse(data.candidate);
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    if (data.sdp) {
      const sdp = JSON.parse(data.sdp);
      if (sdp && !sdp.candidate) {
        pc.setRemoteDescription(sdp).then(() => {
          if (sdp.type === 'offer') {
            pc.createAnswer().then((answer) => {
              pc.setLocalDescription(answer)
                .then(() => {
                  broadcastData({
                    type: EXCHANGE,
                    from: userId,
                    to: data.from,
                    sdp: JSON.stringify(pc.localDescription),
                  });
                });
            });
          }
        });
      }
    }
  };

  const removeUser = (data) => {
    const video = document.getElementById(`remoteVideoContainer+${data.from}`);
    video && video.remove();
    const peers = pcPeers;
    delete peers[data.from];
  };

  const joinCall = () => {
    App.cable.subscriptions.create(
      { channel: 'CallChannel' },
      {
        connected: () => {
          broadcastData({ type: JOIN_CALL, from: userId });
        },
        received: (data) => {
          console.log('RECEIVED: ', data);
          if (data.from === userId) return null;
          switch (data.type) {
            case JOIN_CALL:
              return join(data);
            case EXCHANGE:
              if (data.to !== userId) return null;
              return exchange(data);
            case LEAVE_CALL:
              return removeUser(data);
            default:
          }
          return null;
        },
      },
    );
  };

  const leaveCall = () => {
    const pcKeys = Object.keys(pcPeers);
    for (let i = 0; i < pcKeys.length; i += 1) {
      pcPeers[pcKeys[i]].close();
    }
    pcPeers = {};
    localVideo
      .srcObject
      .getTracks()
      .forEach((track) => { track.stop(); });

    localVideo.srcObject = null;
    App.cable.subscriptions.subscriptions = [];
    remoteVideoContainer.innerHTML = '';
    broadcastData({ type: LEAVE_CALL, from: userId });
  };

  return (
    <div className="VideoCall">
      <div id="remote-video-container" />
      <video id="local-video" autoPlay />
      <button onClick={joinCall}>Join Call</button>
      <button onClick={leaveCall}>Leave Call</button>
    </div>
  );
};

export default VideoCall;
