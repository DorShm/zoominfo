# Question #
===========
## Scenario ##
You have to implement a "cdn" module with one exported function "select". `select` - choose faster cdn server and return a function to fetch content from selected server.

## Assumptions ##
* Environment contains list of CDN servers in the following format: `CDN_SERVERS = "domain1.org,domain2.com,domain3.com"`
* Environment contains org server `CDN_ORG = "orgdomain.com`
* Not all content exists on all servers
* Not all servers are accessible
* Each server contain `/stat` end-point return HTTP 200 if server up and working properly

## Requirement ##
1. if server is not accessible more than once, remove it from cdn servers list
2. if content not exists on cdn server, you have to choose the next fastest one
3. if content not exists on all cdn servers, fetch data from org server

## Bonus ##
* The serve function will log messages to the console: "fetch /a/b/c from server: example"
* The implementation should be written at the bonus section and not in the module.

example:

```
const {select} = require('./cdn');

async function main() {
    const serve = await select();

    // bonus section
    // serve = ....

    await serve('/api/fetch-items');
}
````