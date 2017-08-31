# Worker Wrapper

worker-wrapper - simple library for launch your code without closure in web-worker.

## Getting Started

Library use global Promise.

For install library:
```bash
npm install worker-wrapper --save
```
For launch in browser:
```html
<script src="node_modules/worker-wrapper/dist/worker-wrapper.min.js"></script>
```

### API


* config(data: {libs?: Array\<string\>}): void

  The method takes a list of libraries which will connect to the worker if it was not transferred to another config.
  
* create([code], [params], [config]): IWorkerWrapper
    * code: Function
    
    A class constructor or a function (MAY NOT CONTAIN a CLOSURE) to be executed in the worker.
    If the passed class constructor, then its instance will be created in the worker (in this
    case, he will be given [params] arguments)
    
    * params: any (JSONLike)
    
    The parameters that will be passed when creating an instance of the class passed in parameter [code]
    
    * config: {libs?: Array\<string\>}
    
* interface IWorkerWrapper

    * process(cb, [data]): Promise;
    * terminate(): void;
    
    
Example use worker with class:

```javascript

class Some { // instance of this class created in worker, your can use jQuery here
    constructor(data) {
        this.data = data;
    }
    
    doSomeHardWork(parms) {
        // do some
        return parms + 1;
    }
}

const wrapper = workerWrapper.create(Some, {data: 'some data for instance of Some'}, {
    libs: ['path/to/jquery']
});



wrapper.process((some, params) => {
    // This code in worker. Cannot use closure!
    return some.doSomeHardWork(parms);
}, 1).then((result) => {
    // result = 2
});

```

Example simple use:

```javascript

const wrapper = workerWrapper.create();

wrapper.process((params) => {
    // This code in worker. Cannot use closure!
    // do some hard work
    // your can return JSON like data or Promise with JSON like data
    
    return 100; // or return Promise.resolve(100)
}, params).then((result) => {
    // result = 100;
});

wrapper.terminate() // terminate for kill worker process

```


## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/tsigel/worker-wrapper/tags). 

## Authors

[tsigel](https://github.com/tsigel)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details