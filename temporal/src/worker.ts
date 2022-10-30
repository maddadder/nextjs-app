import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { getEnv } from "./util/environment"


run().catch((err) => console.log(err));

async function run() {
  const environment = getEnv()
  const connection = await NativeConnection.create({
    address: environment.TEMPORAL_ADDRESS, // defaults port to 7233 if not specified
  });
  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'ecommerce-oneclick',
  });

  // Start accepting tasks on the `tutorial` queue
  await worker.run();
}
