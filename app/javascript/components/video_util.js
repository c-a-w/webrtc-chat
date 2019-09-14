import Axios from 'axios';

export const JOIN_CALL = 'JOIN_CALL';
export const EXCHANGE = 'EXCHANGE';
export const LEAVE_CALL = 'LEAVE_CALL';
export const broadcastData = data => {
  Axios.post('calls', data);
};
