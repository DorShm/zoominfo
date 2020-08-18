const fetch = require('node-fetch');
const { Subject, async, throwError } = require('rxjs');

// Get CDN servers from environment
const { CDN_SERVERS, CDN_ORG } = process.env;

const VALID_SERVER_LIST = [];

if (!CDN_ORG) {
  console.error('No CDN origin was defined in environment');
}

if (!CDN_SERVERS) {
  console.warn('No CDN Servers were found in environment');
}

async function serve(path) {
  // Query CDN from fastest to slowest until resource is found
  for (const validCDN of VALID_SERVER_LIST) {
    try {
      const response = await fetch(`http://${validCDN.cdnServerName}${path}`);

      return response;
    } catch (error) {
      if (validCDN.cdnServerName === CDN_ORG) {
        throw error;
      }
    }
  }
}

async function checkServerStatus(serverName, attempts = 2) {
  while (attempts > 0) {
    
    attempts--;

    try {
      const requestTime = Date.now();

      const response = await fetch(`http://${serverName}/stat`, { timeout: 2000 })

      // Return server response time
      return (new Date(response.headers.get('date')) - requestTime);
    } catch (error) { }
  }

  throw new Error(`Server ${serverName} failed status check`);
}

async function select() {
  // Run all status request and add any valid CDN to the VALID_SERVER_LIST
  for (const cdnServerName of CDN_SERVERS.split(',')) {
    try {
      const responseTime = await checkServerStatus(cdnServerName, 2);

      VALID_SERVER_LIST.push({
        cdnServerName,
        responseTime
      });
    } catch (error) {}
  }

  VALID_SERVER_LIST.sort((a, b) => a.responseTime > b.responseTime ? 1 : -1);
  VALID_SERVER_LIST.push({ cdnServerName: CDN_ORG });

  return serve;
}

module.exports = {
  select
};
