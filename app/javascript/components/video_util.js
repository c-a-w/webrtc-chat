export const JOIN_CALL = 'JOIN_CALL';
export const EXCHANGE = 'EXCHANGE';
export const LEAVE_CALL = 'LEAVE_CALL';

function getServers() {
  const response = fetch('api/v1/servers', {
    method: 'GET',
    headers: { 'content-type': 'application/json' }
  });

  if (response.s === 'error') {
    console.log(response.v);
    return null;
  }
  return response.v;
}

export const ice = getServers();
export const broadcastData = data => {
  fetch('calls', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'content-type': 'application/json' }
  });
};
