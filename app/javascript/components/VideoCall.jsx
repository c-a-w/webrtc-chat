import React, { useState, useEffect } from 'react';
import {
  JOIN_CALL, EXCHANGE, LEAVE_CALL, broadcastData,
} from './video_util';

const VideoCall = () => {
  const [pcPeers, setPcPeers] = useState({});
  const [userId, setUserId] = useState(Math.floor(Math.random() * 10000));
  let localStream;

  useEffect(() => {
    const remoteVideoContainer = document.getElementById('remote-video-container');
    const localVideo = document.getElementById('local-video');
    navigator
      .mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;
      })
      .catch((error) => { console.log(error); });
  });

  const join = (data) => {
  };

  const joinCall = (e) => {
    App.cable.subscriptions.create(
      { channel: 'CallChannel' },
      {
        connected: () => {
          broadcastData({ type: JOIN_CALL, from: this.userId });
        },
        received: (data) => {
          console.log('RECEIVED: ', data);
          if (data.from === this.userId) return;
          switch (data.type) {
            case JOIN_CALL:
              return this.join(data);
            case EXCHANGE:
              if (data.to !== this.userId) return;
              return this.exchange(data);
            case LEAVE_CALL:
              return this.removeUser(data);
            default:
          }
        },
      },
    );
  };

  const createPC = (userId, offerBool) => {
  };

  const exchange = (data) => {
  };

  const leaveCall = () => {
  };

  const removeUser = (data) => {
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
