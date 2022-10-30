
export function getEnv(): Env {
    return {
        COUCHBASE_USER: process.env.COUCHBASE_USER, 
        COUCHBASE_PASSWORD: process.env.COUCHBASE_PASSWORD, // as assigned
        COUCHBASE_ENDPOINT: process.env.COUCHBASE_ENDPOINT, // in project root
        COUCHBASE_BUCKET: process.env.COUCHBASE_BUCKET, // in project root
        IS_CAPELLA: false,
        TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS
    };
  }

