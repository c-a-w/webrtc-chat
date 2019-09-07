/* global App */
/* eslint-disable jsx-a11y/media-has-caption, no-console */

// createPeerConnection
// join
// exchange
// removeUser
// joinCall
// leaveCall

import React from 'react';
import adapter from 'webrtc-adapter'; // eslint-disable-line no-unused-vars
import {
  JOIN_CALL, EXCHANGE, LEAVE_CALL, broadcastData, ice
} from './video_util';

function VideoCall() {
  let peers = {};
  const userId = Math.floor(Math.random() * 10000);
  let localStream;
  let localVideo;
  let remoteVideo;


  React.useEffect(() => {
    remoteVideo = document.getElementById('remote-video');
    localVideo = document.getElementById('local-video');

    // set local video stream
    navigator
      .mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
      })
      .catch(error => { console.log(error); });
  }, []);

  function join(data) {
    createPeerConnection(data.from, true);
  }

  function removeUser(data) {
    const video = document.getElementById('remoteVideoContainer');
    video && video.remove();
    delete peers[data.from];
  }

  function joinCall() {
    App.cable.subscriptions.create(
      { channel: 'CallChannel' },
      {
        connected() {
          console.log(`CONNECTED: ${userId}`);
          broadcastData({ type: JOIN_CALL, from: userId });
        },
        received(data) {
          console.log('RECEIVED: ', data);

          // from self, so do nothing
          if (data.from === userId) {
            console.log('data.from === userId; will not exchange, createPC or leave call');
            return;
          }

          if (data.type === JOIN_CALL) {
            console.log('creating PC with offer');
            createPeerConnection(data.from, true);
          }

          if (data.type === EXCHANGE) {
            if (data.to !== userId) {
              console.log('data.to !== userId, will not start exchange');
              return;
            }
            console.log('starting exchange');
            exchange(data);
          }

          if (data.type === LEAVE_CALL) {
            console.log('leaving call');
            removeUser(data);
          }
        }
      }
    );
  }

  function createPeerConnection(pcUserId, offerBool) {
    const peerConnection = new RTCPeerConnection(ice);
    peers[pcUserId] = peerConnection;
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    if (offerBool) {
      peerConnection.createOffer().then(offer => {
        peerConnection.setLocalDescription(offer).then(() => {
          broadcastData({
            type: EXCHANGE,
            from: userId,
            to: pcUserId,
            sdp: JSON.stringify(peerConnection.localDescription)
          });
        });
      });
    }
    peerConnection.onicecandidate = e => {
      console.log('on ice candidate');
      console.log(e);
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
  }

  function exchange(data) {
    let peerConnection;

    console.log('data:');
    console.log(data);
    if (peers[data.from]) {
      // peer connection already exists, so use that one
      peerConnection = peers[data.from];
    } else {
      peerConnection = createPeerConnection(data.from, false);
    }

    if (!data.sdp || data.sdp === 'null') { return; }

    const parsedSDP = JSON.parse(data.sdp);

    if (parsedSDP.candidate) {
      peerConnection.addIceCandidate(new RTCIceCandidate(parsedSDP));
    }

    if (parsedSDP && !parsedSDP.candidate) {
      peerConnection.setRemoteDescription(parsedSDP).then(() => {
        if (parsedSDP.type !== 'offer') { return; }

        peerConnection.createAnswer().then(answer => {
          peerConnection.setLocalDescription(answer).then(() => {
            broadcastData({
              type: EXCHANGE,
              from: userId,
              to: data.from,
              sdp: JSON.stringify(peerConnection.localDescription)
            });
          });
        });
      });
    }
  }

  function leaveCall() {
    Object.keys(peers).forEach(peerConnection => peers[peerConnection].close());
    peers = {};
    localVideo.srcObject.getTracks().forEach(track => track.stop());

    localVideo.srcObject = null;
    App.cable.subscriptions.subscriptions = [];
    broadcastData({ type: LEAVE_CALL, from: userId });
  }

  return (
    <div className="VideoCall">
      <video id="local-video" autoPlay playsInline />
      <video id="remote-video" autoPlay playsInline />
      <button type="button" onClick={joinCall}>Join Call</button>
      <button type="button" onClick={leaveCall}>Leave Call</button>
    </div>
    );
}

export default VideoCall;
