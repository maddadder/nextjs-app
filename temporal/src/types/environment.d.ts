interface Env {
    COUCHBASE_USER: string | undefined;
    COUCHBASE_PASSWORD: string | undefined;
    COUCHBASE_ENDPOINT: string | undefined;
    COUCHBASE_BUCKET: string | undefined;
    IS_CAPELLA: boolean;
    TEMPORAL_ADDRESS: string | undefined;
}