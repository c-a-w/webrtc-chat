import Axios from 'axios';

export const JOIN_CALL = 'JOIN_CALL';
export const EXCHANGE = 'EXCHANGE';
export const LEAVE_CALL = 'LEAVE_CALL';
export const ice = { iceServers: [
  {
    urls: 'stun:stun2.l.google.com:19302'
  }
]};

export const broadcastData = (data) => {
  fetch('calls', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {'content-type': 'application/json'}
  });
};
function getServers() {
  Axios.get('api/v1/servers')
    .then(response => {
      console.log(response);
      if (response.s === 'error') {
        return null;
      }
      return response.v;
    });
}

// export const ice = getServers();
// export const broadcastData = data => {
//   Axios.post('calls', data);
// };
