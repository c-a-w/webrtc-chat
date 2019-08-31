export const JOIN_CALL = 'JOIN_CALL';
export const EXCHANGE = 'EXCHANGE';
export const LEAVE_CALL = 'LEAVE_CALL';

function getServers() {
  fetch('api/v1/servers', {
    method: 'GET',
    headers: { 'content-type': 'application/json' }
  })
    .then(response => {
      console.log(response.v);
      if (response.s === 'error') {
        return null;
      }
      return response.v;
    });
}

export const ice = null; // getServers();
export const broadcastData = data => {
  fetch('calls', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'content-type': 'application/json' }
  });
};
