const { select } = require('./cdn');

async function main() {
  const serve = await select();

  // bonus section
  // serve = ....

  const response = await serve('/stat');

  console.log(response);
}

main().then(
  () => process.exit(0)
);