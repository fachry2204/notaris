const { getNextTrackingCode } = require('./src/lib/actions/jobs');

async function check() {
  const result = await getNextTrackingCode("Badan Hukum/Usaha");
  console.log("Next Code BH:", result.data);
}

check();
