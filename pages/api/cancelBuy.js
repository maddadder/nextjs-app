import { Connection, WorkflowClient } from '@temporalio/client';
import { getEnv } from '../../temporal/src/util/environment';


export default async function cancelBuy(req, res) {
  const environment = getEnv()
  const { id } = req.query;
  if (!id) {
    res.status(405).send({ message: 'must send workflow id to cancel' });
    return;
  }
  const connection = new Connection({
    // // Connect to localhost with default ConnectionOptions.
    // // In production, pass options to the Connection constructor to configure TLS and other settings:
     address: environment.TEMPORAL_ADDRESS, // as provisioned
    // tls: {} // as provisioned
  });
  const client = new WorkflowClient(connection.service);
  const workflow = client.getHandle(id);
  try {
    await workflow.signal('cancelPurchase');
    res.status(200).json({ cancelled: id });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: e.details, errorCode: e.code });
    return;
  }
}
