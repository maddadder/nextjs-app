import Head from 'next/head';
import React from 'react';
import { v4 as uuid4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function fetchAPI(str, obj?: RequestInit) {
  return fetch(str, obj)
    .then(async (res) => {
      console.log(res);
      if (res.ok) return res.json();
      try {
        const { message, errorCode } = await res.json();
        throw new Error(errorCode + ': ' + message);
      } catch (err) {
        throw new Error(res.status + ': ' + res.statusText);
      }
    })
    .catch((err) => {
      console.error(err);
      toast.error(err, {
        position: 'top-right',
        autoClose: 5000,
        closeOnClick: true,
        draggable: true,
      });
      // throw err
    });
}

export default function Bones({ data }) {
  return (
    <div className="pt-8 pb-80 sm:pt-12 sm:pb-40 lg:pt-24 lg:pb-48">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:static">
        <Head>
          <title>BUY SOMETHIN&apos; WILL YA!</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <header className="relative overflow-hidden">
          <div className="sm:max-w-lg">
            <h1 className="text-4xl font font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              BUY SOMETHIN&apos; WILL YA!
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Buy some NFTs, then change your mind. Or maybe not. 
            </p>
          </div>
        </header>
        <ToastContainer />
        <ProductList products={data} />
        <p className="mt-4 text-xl text-gray-500">
          Source code on{' '}
          <a className="text-blue-400" href="https://github.com/maddadder/nextjs-app">
            github
          </a>
          .
        </p>
      </div>
    </div>
  );
}

function ProductList({products}) {
  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 md:grid-cols-4">
          {products.map((product) => (
            <Product product={product} key={product.pid} />
          ))}
        </div>
      </div>
    </div>
  );
}
function RenderImage({product}) {
  if(product.imgHref) {
    return (
      <img src={product.imgHref} alt={product.content} style={{ width: "100%" }} />
    );
  }
  else if(product.imgContent)
  {
    return (
      <img src={"data:image/jpg;base64," + product.imgContent} alt={product.content} style={{ width: "100%" }} />
    );
  }
  else{
    return (
      <span></span>
    );
  }
}

type ITEMSTATE = 'NEW' | 'SENDING' | 'ORDERED' | 'CONFIRMED' | 'CANCELLING' | 'ERROR' | 'PURCHASE_PENDING' | 'PURCHASE_CONFIRMED' | 'PURCHASE_CANCELED';

function Product({ product }) {
  const itemId = product.pid;
  const [state, setState] = React.useState<ITEMSTATE>('NEW');
  const stateRef = React.useRef<ITEMSTATE>();
  stateRef.current = state;

  // Generate a uuid for initiating this transaction.
  // This is generated on this client for idempotency concerns.
  // The request handler starts a Temporal Workflow using this transaction ID as
  // a unique workflow ID, this allows us to retry the HTTP call and avoid
  // purchasing the same product more than once
  // In more advanced scenarios you may want to persist this in LocalStorage or
  // in the backend to be able to resume this transaction.
  const [transactionId, setTransactionId] = React.useState(uuid4());
  const toastId = React.useRef(null);
  function buyProduct() {
    setState('SENDING');
    fetchAPI('/api/startBuy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId, transactionId }),
    }).then(() => {
      setState('ORDERED');
      toastId.current = toast.success('Purchased! Cancel if you change your mind', {
        position: 'top-right',
        autoClose: 5000,
        closeOnClick: true,
        draggable: true,
        onClose: () => {
          console.log({ state: stateRef.current });
          if (stateRef.current === 'ORDERED') {
            setState('CONFIRMED');
          } else if (stateRef.current === 'CANCELLING') {
            setState('NEW');
            setTransactionId(uuid4());
          }
        },
      });
    });
  }
  function getState() {
    if (state != "NEW") {
      console.log(state)
      setState('SENDING');
      fetchAPI('/api/getBuyState?id=' + transactionId).then((x) => setState(x.purchaseState))
        .catch(err => setState(err))
    }
  }
  function cancelBuy() {
    if (state === 'ORDERED' || state === 'PURCHASE_PENDING') {
      setState('CANCELLING');
      fetchAPI('/api/cancelBuy?id=' + transactionId).catch((err) => {
        setState('ERROR');
        toast.error(err, {
          position: 'top-right',
          autoClose: 5000,
          closeOnClick: true,
          draggable: true,
        });
      });
      toast.dismiss(toastId.current);
    }
  }
  return (
    <div key={product.pid} className="relative group">
      <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-gray-100 text-center">
        {/* eslint-disable @next/next/no-img-element */}
        <a href={product.href} target={product.target}>
        <RenderImage product={product} />
        </a>
        <div className="flex items-end p-4" aria-hidden="true">
          {
            {
              NEW: (
                <button
                  onClick={buyProduct}
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  Buy Now
                </button>
              ),
              PURCHASE_CANCELED: (
                <button
                  onClick={buyProduct}
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  Buy Now
                </button>
              ),
              SENDING: (
                <div className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center">
                  Sending...
                </div>
              ),
              ORDERED: (
                <button
                  onClick={cancelBuy}
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  Click to Cancel
                </button>
              ),
              PURCHASE_PENDING: (
                <button
                  onClick={cancelBuy}
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  Click to Cancel
                </button>
              ),
              CONFIRMED: (
                <div className="w-full  opacity-100 bg-white bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center">
                  Purchased!
                </div>
              ),
              PURCHASE_CONFIRMED: (
                <div className="w-full  opacity-100 bg-white bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center">
                  Purchased Confirmed
                </div>
              ),
              CANCELLING: (
                <div className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center">
                  Cancelling...
                </div>
              ),
              ERROR: (
                <button
                  onClick={buyProduct}
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  Error! Click to Retry
                </button>
              ),
            }[state]
          }
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-base font-medium text-gray-900 space-x-8">
        <h3><a href={product.href} target={product.target}>{product.content}</a></h3>
        <p>$1.00</p>
      </div>
      <p className="mt-1 text-sm text-gray-500">Category:{product.category}</p>
      <p>
        <button
          onClick={getState}
          className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
          >
          Get Status
        </button>
      </p>
    </div>
  );
}
// This gets called on every request
export async function getServerSideProps() {
  // Fetch data from external API
  const res = await fetch(`https://nextjs-app.leenet.link/api/userLink?search=http&limit=100`)
  const data = await res.json()

  // Pass data to the page via props
  return { props: { data } }
}