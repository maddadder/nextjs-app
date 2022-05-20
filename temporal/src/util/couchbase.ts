import * as couchbase from "couchbase"
import { getEnv } from "./environment"

const environment = getEnv()
const COUCHBASE_USER = environment.COUCHBASE_USER
const COUCHBASE_PASSWORD = environment.COUCHBASE_PASSWORD
const COUCHBASE_ENDPOINT = environment.COUCHBASE_ENDPOINT
let COUCHBASE_BUCKET = environment.COUCHBASE_BUCKET
let IS_CAPELLA = environment.IS_CAPELLA

if (!COUCHBASE_USER) {
  throw new Error(
    'Please define the COUCHBASE_USER environment variable inside .env.local'
  )
}

if (!COUCHBASE_PASSWORD) {
  throw new Error(
    'Please define the COUCHBASE_PASSWORD environment variable inside .env.local'
  )
}

if (!COUCHBASE_ENDPOINT) {
  throw new Error(
      'Please define the COUCHBASE_ENDPOINT environment variable inside .env.local'
  )
}

if (!COUCHBASE_BUCKET) {
  throw new Error(
      'Please define the COUCHBASE_BUCKET environment variable inside .env.local'
  )
}


/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */

let cached = global.couchbase

if (!cached) {
  cached = global.couchbase = { conn: false }
}

async function createCouchbaseCluster() {
  if (cached.conn) {
    return cached.conn
  }

  if (IS_CAPELLA === true) {
    // Capella requires TLS connection string but we'll skip certificate verification with `tls_verify=none`
    cached.conn = await couchbase.connect('couchbases://' + COUCHBASE_ENDPOINT + '?tls_verify=none', {
      username: COUCHBASE_USER,
      password: COUCHBASE_PASSWORD,
    })
  } else {
    // no TLS needed, use traditional connection string
    cached.conn = await couchbase.connect('couchbase://' + COUCHBASE_ENDPOINT, {
      username: COUCHBASE_USER,
      password: COUCHBASE_PASSWORD,
    })
  }
  return cached.conn
}

export async function connectToDatabase() {
  const cluster = await createCouchbaseCluster()
  const bucket = cluster.bucket(COUCHBASE_BUCKET);
  const collection = bucket.defaultCollection();
  const defaultCollection = bucket.collection('default');

  let dbConnection = {
    cluster,
    bucket,
    collection,
    defaultCollection,
  }

  return dbConnection;
}
