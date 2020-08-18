const fetch = require('node-fetch');

// Get CDN servers from environment
const { CDN_SERVERS, CDN_ORG } = process.env;

const VALID_SERVER_LIST = [];

if (!CDN_ORG) {
  console.error('No CDN origin was defined in environment');
}

if (!CDN_SERVERS) {
  console.warn('No CDN Servers were found in environment');
}

/**
 * Serve endpoint data querying fastest cdn first and progressing to slower ones
 * @param {string} path endpoint to fetch data from
 */
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

/**
 * Checks server status with multiple attempts for response
 * @param {string} serverName server name to status check
 * @param {number} attempts number of attempts to status check
 */
async function checkServerStatus(serverName, attempts = 2) {
  while (attempts > 0) {
    
    attempts--;

    try {
      const start = Date.now();

      const response = await fetch(`http://${serverName}/stat`, { timeout: 2000 })

      const end = Date.now();

      // Return server response time
      return end - start;
    } catch (error) { }
  }

  throw new Error(`Server ${serverName} failed status check`);
}

/**
 * Select the fastest cdns among CDN_SERVERS environment variable, to allow fetching data
 * by their response time
 * @returns serve function that queries the fastest cdn first and continues to slower ones
 */
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

  // Sort servers by fastest response time to slowest
  VALID_SERVER_LIST.sort((a, b) => a.responseTime > b.responseTime ? 1 : -1);

  // Add origin server last as fallback
  VALID_SERVER_LIST.push({ cdnServerName: CDN_ORG });

  return serve;
}

module.exports = {
  select
};
