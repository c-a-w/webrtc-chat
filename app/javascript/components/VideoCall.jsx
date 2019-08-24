/* global App */
/* eslint-disable jsx-a11y/media-has-caption */

// createPeerConnection
// join
// exchange
// removeUser
// joinCall
// leaveCall

import React, { useEffect } from 'react';
import adapter from 'webrtc-adapter'; // eslint-disable-line no-unused-vars
import {
  JOIN_CALL, EXCHANGE, LEAVE_CALL, broadcastData, ice
} from './video_util';

const VideoCall = () => {
  let pcPeers = {};
  const userId = Math.floor(Math.random() * 10000);
  let localStream;
  let remoteVideoContainer;
  let localVideo;
  let remoteVideo;


  useEffect(() => {
    remoteVideo = document.getElementById('remote-video');
    localVideo = document.getElementById('local-video');
    navigator
      .mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
      })
      .catch(error => { console.log(error); });
  }, []);

  const createPeerConnection = (pcUserId, offerBool) => {
    const peerConnection = new RTCPeerConnection(ice);
    pcPeers[pcUserId] = peerConnection;
    localStream
      .getTracks()
      .forEach(track => peerConnection.addTrack(track, localStream));
    if (offerBool) {
      peerConnection
        .createOffer()
        .then(offer => {
          peerConnection
            .setLocalDescription(offer)
            .then(() => {
              setTimeout(() => {
                broadcastData({
                  type: EXCHANGE,
                  from: userId,
                  to: pcUserId,
                  sdp: JSON.stringify(peerConnection.localDescription)
                });
              }, 0);
            });
        });
    }
    peerConnection.onicecandidate = e => {
      broadcastData({
        type: EXCHANGE,
        from: userId,
        to: pcUserId,
        sdp: JSON.stringify(e.candidate)
      });
    };
    peerConnection.ontrack = e => {
      [remoteVideo.srcObject] = e.streams;
    };
    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'disconnected') {
        broadcastData({ type: LEAVE_CALL, from: userId });
      }
    };
    return peerConnection;
  };

  const join = data => {
    createPeerConnection(data.from, true);
  };

  const exchange = data => {
    let peerConnection;
    if (pcPeers[data.from]) {
      peerConnection = pcPeers[data.from];
    } else {
      peerConnection = createPeerConnection(data.from, false);
    }
    if (data.candidate) {
      const candidate = JSON.parse(data.candidate);
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    if (data.sdp) {
      const sdp = JSON.parse(data.sdp);
      if (sdp && !sdp.candidate) {
        peerConnection.setRemoteDescription(sdp).then(() => {
          if (sdp.type === 'offer') {
            peerConnection.createAnswer().then(answer => {
              peerConnection.setLocalDescription(answer)
                .then(() => {
                  broadcastData({
                    type: EXCHANGE,
                    from: userId,
                    to: data.from,
                    sdp: JSON.stringify(peerConnection.localDescription)
                  });
                });
            });
          }
        });
      }
    }
  };

  const removeUser = data => {
    const video = document.getElementById('remoteVideoContainer');
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
        received: data => {
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
        }
      },
    );
  };

  const leaveCall = () => {
    Object.keys(pcPeers).forEach(peerConnection => pcPeers[peerConnection].close());
    pcPeers = {};
    localVideo
      .srcObject
      .getTracks()
      .forEach(track => { track.stop(); });

    localVideo.srcObject = null;
    App.cable.subscriptions.subscriptions = [];
    broadcastData({ type: LEAVE_CALL, from: userId });
  };

  return (
    <div className="VideoCall">
      <video id="local-video" autoPlay playsInline />
      <video id="remote-video" autoPlay playsInline />
      <button type="button" onClick={joinCall}>Join Call</button>
      <button type="button" onClick={leaveCall}>Leave Call</button>
    </div>
  );
};

export default VideoCall;
