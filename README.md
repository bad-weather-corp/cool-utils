# Cool-Utils

Utility library for support of remote private key manipulation.

How it works:
1. In your **HOT** application, use **CoolFactory** to create a **StorageProxy**. StorageProxy **doesn't need the private key** and all private key oprations are delegated to the defined **ClientTransport**, through which result of the operation is received after it is processed by the **ServerTransport**.
2. In your **COLD** application, use **CoolFactory** to create a **Storage**. Storage **does contain the private key** and performs private key operation received from **ServerTransport**. ServerTransport is used to send the result back, so it can be received by **ClientTransport**

Both **StorageProxy** and **Storage** should implement the same **IStorage** interface.

Note: I may have added word **"cool"** inside every interface and/or method, because winter is comming.

# Usage
1. checkout next to your application folder
2. cd cool-utils && npm install && npm run build
3. in your hot/cold application package.json
    * add dependency
        ```
        "dependencies": {
            ...
            "cool-utils": "file:../cool-utils",
            ...
        }
        ```
    * run npm install

## TODO:
* replace with real README.md, setup git repository, setup tests, continue following
* add code example
* keep following https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c
    * may even result in publication over npm one day