const bcrypt = require('bcrypt');

async function test() {
  const pass = 'password';
  const hash = await bcrypt.hash(pass, 10);
  console.log('Hash:', hash);
  const match = await bcrypt.compare(pass, hash);
  console.log('Match:', match);
}

test().catch(console.error);
