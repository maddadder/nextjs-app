# Next.js + Temporal

This example shows how to use [Temporal](https://docs.temporal.io/) with Next.js.

- Tutorial on writing this: https://docs.temporal.io/docs/typescript/nextjs-tutorial
- Lightning talk on React + Temporal: https://www.youtube.com/watch?v=WRYozSljSpw

## Instructions

```bash
cd nextjs-ecommerce-oneclick # navigate into this folder
npm i
npm run dev
```

The `dev` script does 3 things:

- runs `next dev` which opens the frontend on [localhost:3000](http://localhost:3000)
- runs `temporal:dev` which runs the Temporal Worker, Workflows, and Activities code through the TypeScript compiler in watch mode
- runs `temporal:worker` which runs the compiled `worker.ts` file

Now you can go to http://localhost:3000/api/hello and see the result:

```json
{ "name": "John Doe" }
```

## Demo

There are two versions of this for development purposes.

- http://localhost:3000/ (index) shows a realistic e-commerce situation where some of the state is managed on the frontend.
  - You can see a demo of this at our Sept 2021 meetup: https://youtu.be/JQ6FRTnQWFI
- http://localhost:3000/barebones shows buttons for the raw API calls which can be useful for learning and debugging.

![image](https://user-images.githubusercontent.com/6764957/135000553-6ac7d0b7-d2fb-4901-aee1-73251de33f67.png)

- Click "Buy item"
- Click "Get State" anytime
- Things to try
  - View workflow state in Temporal Web
  - Click "Cancel Buy" within 5 seconds

## Architecture Discussion

This example makes two decisions which often generate questions:

1. Modeling the timeout on the clientside as well as in the Temporal workflow
   - This is a UX tradeoff, not a necessary design choice
   - You can equally have the frontend poll an API endpoint that runs a query on the workflow if precision/single source of truth is important to you
   - Long polling or websocket subscriptions model is also possible for more instantaneous update but probably would require a different API architecture
2. Next.js frontend talking to a Next.js API route, instead of talking to Temporal directly
   - Temporal Clients use gRPC to talk to Temporal Server, therefore it is easier to do it from the serverside than from the browser, particularly where auth secrets are involved
   - However we do have users that use `grpc-web` on the frontend directly and do authz on the backend through authz middleware on an ambassador router/envoy proxy. Ask in our Slack for more info.

### Initial setup
```
git clone https://github.com/temporalio/helm-charts
# cd into that folder
helm dependencies update
helm install \
    --set server.replicaCount=1 \
    --set cassandra.config.cluster_size=1 \
    --set prometheus.enabled=false \
    --set grafana.enabled=false \
    --set elasticsearch.enabled=false \
    temporaltest . --timeout 15m
kubectl port-forward services/temporaltest-frontend-headless 7233:7233 --address 0.0.0.0
#open new console
kubectl port-forward services/temporaltest-web 8088:8088 --address 0.0.0.0
#open new console
docker run --rm -it --entrypoint /bin/bash --network host --env TEMPORAL_CLI_ADDRESS=localhost:7233 temporalio/admin-tools:1.14.0
tctl --namespace default namespace register
```

## Deploy
```
docker-compose build
docker push 192.168.1.151:32000/nextjs-app:1.22.44
helm install nextjs-app ./nextjs-app
```

### Couchbase
```
https://developer.couchbase.com/tutorial-quickstart-nextjs
https://github.com/couchbase-examples/nextjs-quickstart
```