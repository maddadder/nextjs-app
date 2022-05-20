/* eslint-disable no-var */
import * as couchbase from 'couchbase';

declare global {
    var couchbase: typeof couchbase;
}
global.couchbase = couchbase
export {};

