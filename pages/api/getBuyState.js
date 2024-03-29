import { Connection, WorkflowClient } from '@temporalio/client';
import { getEnv } from '../../temporal/src/util/environment';


export default async function queryState(req, res) {
  const environment = getEnv()
  const { id } = req.query;
  if (!id) {
    res.status(405).send({ message: 'must send workflow id to query' });
    return;
  }
  const connection = new Connection({
    // // Connect to localhost with default ConnectionOptions.
    // // In production, pass options to the Connection constructor to configure TLS and other settings:
     address: environment.TEMPORAL_ADDRESS, // as provisioned
    // tls: {} // as provisioned
  });
  const client = new WorkflowClient(connection.service);
  console.log({ id });
  const workflow = client.getHandle(id);
  try {
    const purchaseState = await workflow.query('purchaseState');
    res.status(200).json({ purchaseState });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: e.details, errorCode: e.code });
    return;
  }
}
