const { select } = require('./cdn');

async function main() {
  const serve = await select();

  // bonus section
  // serve = ....

  let response;

  try {
    response = await serve('/api/fetch-items');
  } catch (error) {
    console.log(error);
  }

  console.log(await response.text());
}

main().then(
  () => process.exit(0)
);