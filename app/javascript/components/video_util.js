import Axios from 'axios';

export const JOIN_CALL = 'JOIN_CALL';
export const EXCHANGE = 'EXCHANGE';
export const LEAVE_CALL = 'LEAVE_CALL';
function getServers() {
  Axios.get('api/v1/servers')
    .then(response => {
      console.log('got ice servers');
      if (response.s === 'error') {
        return null;
      }
      return response.v;
    });
}

export const ice = getServers();
export const broadcastData = data => {
  Axios.post('calls', data);
};
