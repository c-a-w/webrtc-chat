/* global App */
/* eslint-disable jsx-a11y/media-has-caption, no-console */

import Axios from 'axios';
import React from 'react';
import adapter from 'webrtc-adapter'; // eslint-disable-line no-unused-vars
import {
  JOIN_CALL,
  EXCHANGE,
  LEAVE_CALL,
  broadcastData
} from './video_util';

const VideoCall = () => {
  let peers = {};
  const userId = Math.floor(Math.random() * 10000);
  let localStream;
  let localVideo;
  let remoteVideo;
  let iceServersTwilio;
  let iceServersXirsys;

  const [selectedServer, setSelectedServer] = React.useState('xirsys');

  const getTwilioServers = () => (
    Axios.get('api/v1/servers/twilio')
      .then(response => {
        iceServersTwilio = { iceServers: response.data };
      })
      .catch(err => {
        console.log('error from twilio');
        console.log(err.message);
        console.log(err.name);
      })
  );

  const getXirsysServers = () => (
    Axios.get('api/v1/servers/xirsys')
      .then(response => {
        if (response.s !== 'error') {
          iceServersXirsys = response.data.v;
        }
      })
      .catch(err => {
        console.log('error from xirsys');
        console.log(err.message);
        console.log(err.name);
      })
  );

  React.useEffect(() => {
    remoteVideo = document.getElementById('remote-video');
    localVideo = document.getElementById('local-video');

    // set local video stream
    getTwilioServers().then(getXirsysServers).then(() => {
      console.log(iceServersXirsys);
      console.log(iceServersTwilio);
    });
    navigator
      .mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        console.log('setting local stream in useEffect');
        localStream = stream;
        localVideo.srcObject = stream;
      })
      .catch(error => { console.log(error); });
  }, []);

  const removeUser = data => {
    const video = document.getElementById('remoteVideoContainer');
    video && video.remove();
    delete peers[data.from];
  };

  const createPeerConnection = (pcUserId, shouldCreateOffer) => {
    const servers = iceServersTwilio;
    console.log(servers);
    const peerConnection = new RTCPeerConnection(servers);
    console.log(peerConnection);
    console.log(localStream);
    peers[pcUserId] = peerConnection;
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    if (shouldCreateOffer) {
      console.log(`${userId} creating offer`);
      peerConnection.createOffer().then(offer => {
        console.log(`${userId} setting local description`);
        peerConnection.setLocalDescription(offer).then(() => {
          console.log(`${userId} broadcasting local description`);
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
      console.log(`${userId} broadcasting candidate to ${pcUserId}`);
      setTimeout(() => {
        broadcastData({
          type: EXCHANGE,
          from: userId,
          to: pcUserId,
          sdp: JSON.stringify(e.candidate)
        });
      }, 0);
    };

    peerConnection.ontrack = e => {
      console.log(`${userId} setting remote video stream`);
      [remoteVideo.srcObject] = e.streams;
    };

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'disconnected') {
        broadcastData({ type: LEAVE_CALL, from: userId });
      }
    };

    return peerConnection;
  };

  const exchange = data => {
    let peerConnection;

    if (peers[data.from]) {
      // peer connection already exists, so use that one
      peerConnection = peers[data.from];
    } else {
      peerConnection = createPeerConnection(data.from, false);
    }

    if (!data.sdp || data.sdp === 'null') { return; }

    const parsedSDP = JSON.parse(data.sdp);

    if (parsedSDP.candidate) {
      console.log(`${userId} adding ice candidate`);
      peerConnection
        .addIceCandidate(new RTCIceCandidate(parsedSDP))
        .catch(e => console.log(e));
    } else {
      console.log(`${userId} setting remote description`);
      console.log(peerConnection);
      console.log(parsedSDP);
      peerConnection.setRemoteDescription(parsedSDP).then(() => {
        if (parsedSDP.type !== 'offer') { return; }

        console.log(`${userId} creating answer`);
        peerConnection.createAnswer().then(answer => {
          console.log(`${userId} setting answer as local description`);
          peerConnection.setLocalDescription(answer).then(() => {
            console.log(`${userId} broadcasting local description to ${data.from}`);
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
  };

  const joinCall = () => {
    App.cable.subscriptions.create(
      { channel: 'CallChannel' },
      {
        connected() {
          // console.log(`CONNECTED: ${userId}`);
          broadcastData({ type: JOIN_CALL, from: userId });
        },
        received(data) {
          // console.log('RECEIVED: ', data);

          // from self, so do nothing
          if (data.from === userId) {
            // console.log('data.from === userId; will not exchange, createPC or leave call');
            return;
          }

          if (data.type === JOIN_CALL) {
            // console.log('creating PC with offer');
            createPeerConnection(data.from, true);
          }

          if (data.type === EXCHANGE) {
            if (data.to !== userId) {
              // console.log('data.to !== userId, will not start exchange');
              return;
            }
            // console.log('starting exchange');
            exchange(data);
          }

          if (data.type === LEAVE_CALL) {
            // console.log('leaving call');
            removeUser(data);
          }
        }
      }
    );
  };

  const leaveCall = () => {
    Object.keys(peers).forEach(peerConnection => peers[peerConnection].close());
    peers = {};
    localVideo.srcObject.getTracks().forEach(track => track.stop());

    localVideo.srcObject = null;
    App.cable.subscriptions.subscriptions = [];
    broadcastData({ type: LEAVE_CALL, from: userId });
  };

  const handleRadioSelect = e => {
    setSelectedServer(e.target.value);
  };

  return (
    <div className="VideoCall">
      <div className="buttons">
        <button type="button" onClick={joinCall}>Join Call</button>
        <button type="button" onClick={leaveCall}>Leave Call</button>
      </div>
      <div className="radio">
        <label htmlFor="xirsys">
          <input
            type="radio"
            id="xirsys"
            name="selectedServer"
            value="xirsys"
            onChange={handleRadioSelect}
            checked={selectedServer === 'xirsys'}
          />
          Xirsys
        </label>
        <label htmlFor="twilio">
          <input
            type="radio"
            id="twilio"
            name="selectedServer"
            value="twilio"
            onChange={handleRadioSelect}
            checked={selectedServer === 'twilio'}
          />
          Twilio
        </label>
      </div>
      <div className="streams">
        <video id="local-video" autoPlay playsInline />
        <video id="remote-video" autoPlay playsInline />
      </div>
    </div>
    );
};

export default VideoCall;
