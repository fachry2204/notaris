import { getJobs } from "./src/lib/actions/jobs";

async function test() {
  const result = await getJobs();
  console.log(JSON.stringify(result, null, 2));
}

test();
