const fetch = require('node-fetch');
const { Subject } = require('rxjs');

// Get CDN servers from environment
const { CDN_SERVERS, CDN_ORG } = process.env;
const SERVER_DICTIONARY = {};

if (!CDN_ORG) {
  console.error('No CDN origin was defined in environment');
}

if (!CDN_SERVERS) {
  console.warn('No CDN Servers were found in environment');
} else {
  for (const cdnServer of CDN_SERVERS.split(',')) {
    SERVER_DICTIONARY[`http://${cdnServer}/stat`] = {
      serverName: cdnServer,
      failCounter: 0
    }
  } 
}

function serve(validCDNS$, path) {
  // Query CDN from fastest to slowest until resource is found
  return new Promise((resolve, reject) => {
    const subscription = validCDNS$.subscribe(async validCDN => {

      // Fetch from all valid CDNS, lastly on origin CDN
      await fetch(`http://${validCDN.serverName}${path}`).then(
        response => {
          resolve(response)
          subscription.unsubscribe();
        },
        reason => {
          // If origin CDN doesn't have the resource it doesn't exist
          if (validCDN === CDN_ORG) {
            reject(reason);
          }
        }
      )
    })
  })
}

async function select() {
  const fetchPromises = [];
  
  // Subject to send validCDNS in queue
  const validCDNServersSubject = new Subject();

  // Run all status request and add any valid CDN to the validCDNServersSubject
  for (const serverStatPath in SERVER_DICTIONARY) {
    const fetchPromise = fetch(serverStatPath)
    fetchPromises.push(fetchPromise);

    fetchPromise.then(
      () => {
        console.log(SERVER_DICTIONARY[serverStatPath].serverName);
        // Reset server fault counter
        SERVER_DICTIONARY[serverStatPath].failCounter = 0;

        // Valid CDN server found
        validCDNServersSubject.next(SERVER_DICTIONARY[serverStatPath])
      },
      () => {
        // Count server fault
        SERVER_DICTIONARY[serverStatPath].failCounter++;

        if (SERVER_DICTIONARY[serverStatPath].failCounter > 1) {
          delete SERVER_DICTIONARY[serverStatPath];
        }
      }
    )
  }
  
  // After all fetch requests are settled push origin CDN server
  Promise.allSettled(fetchPromises).then((_) => {
    validCDNServersSubject.next(CDN_ORG)
  })

  return serve.bind(this, validCDNServersSubject.asObservable());
}

module.exports = {
  select
};
