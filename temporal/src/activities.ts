import {connectToDatabase} from "./util/couchbase";

export async function checkoutItem(itemId: string): Promise<string> 
{
  const {cluster, bucket, collection, defaultCollection} = await connectToDatabase();
  var result = await collection.get(itemId);
  return `checking out ${result.content.href}!`;
}
export async function canceledPurchase(itemId: string): Promise<string> {
  return `canceled purchase ${itemId}!`;
}
