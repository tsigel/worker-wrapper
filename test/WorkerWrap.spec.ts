import * as workerWrapper from '../src';

declare const testLib: string;


describe('WorkerWrapper', () => {

    [true, false].forEach((stringifyMode) => {
        describe(`Stringify mode "${stringifyMode}"`, () => {

            before(() => {
                workerWrapper.config({ stringifyMode });
            });

            it('create', () => {
                const wrapper = workerWrapper.create(() => Promise.resolve(1));
                expect(typeof wrapper).to.be('object');
                expect(typeof wrapper.process).to.be('function');
                expect(typeof wrapper.terminate).to.be('function');
            });

            it('without function', (done) => {
                const wrapper = workerWrapper.create();
                const param = 1;
                wrapper.process((param) => Promise.resolve(param), param).then((data) => {
                    expect(data).to.be(param);
                    done();
                });
            });

            it('simple function', (done) => {
                const wrapper = workerWrapper.create(() => {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(1);
                        }, 500);
                    });
                });
                wrapper.process((promise) => {
                    return promise;
                }).then((data) => {
                    expect(data).to.be.ok();
                    done();
                });
            });

            it('simple function without promise', (done) => {
                const wrapper = workerWrapper.create(() => {
                    return 1;
                });
                wrapper.process((data) => {
                    return data;
                }).then((data) => {
                    expect(data).to.be.ok();
                    done();
                });
            });

            it('simple function with function param', (done) => {
                workerWrapper.create().process(({ cb, data }) => {
                    debugger;
                    return cb(data);
                }, { cb: (data: any) => data.test, data: { test: 'test' } })
                    .then((res) => {
                        expect(res).to.be('test');
                        done();
                    })
                    .catch(e => {
                        expect().fail(e.message);
                    });
            });

            it('simple function with reject', (done) => {
                const wrapper = workerWrapper.create(() => {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            reject(1);
                        }, 500);
                    });
                });
                wrapper.process((promise) => {
                    return promise;
                }).catch((data) => {
                    expect(data).to.be.ok();
                    done();
                });
            });

            describe('check class api', () => {

                class Test {
                    public getTest() {
                        return 'test';
                    }
                }

                class TestExtended extends Test {
                    public getExtendedTest() {
                        return 'extendedTest';
                    }
                }

                class TestWithParam extends TestExtended {

                    private params: any;

                    constructor(params: any) {
                        super();
                        this.params = params;
                    }

                    public getParams(): any {
                        return this.params;
                    }

                }

                class TestWithObjectInPrototype {

                    public testData: any;

                    public test() {
                        return this.testData.test();
                    }

                }

                TestWithObjectInPrototype.prototype.testData = {
                    test: function () {
                        return 'test';
                    }
                };

                it('simple class', (done) => {
                    const worker = workerWrapper.create(Test);
                    worker.process((test) => {
                        return Promise.resolve(test.getTest());
                    }).then((text) => {
                        expect(text).to.be('test');
                        done();
                    });
                });

                it('transfer instance', (done) => {
                    const worker = workerWrapper.create();
                    worker.process(() => {

                        class WorkerClassInstance {

                            test() {
                                return 'test';
                            }

                        }

                        return new WorkerClassInstance();

                    }).then((item) => {
                        expect(item.test()).to.be('test');
                        done();
                    });
                });

                it('get empty data from worker', (done) => {
                    const worker = workerWrapper.create();
                    worker.process(() => {
                        return { test: null };
                    }).then((item) => {
                        expect(item.test).to.be(null);
                        done();
                    });
                });

                it('extended class', (done) => {
                    const worker = workerWrapper.create(TestExtended);
                    worker.process((test) => {
                        return Promise.resolve(test.getTest() + ' ' + test.getExtendedTest());
                    }).then((text) => {
                        expect(text).to.be('test extendedTest');
                        done();
                    });
                });

                it('constructor params', (done) => {
                    const params = 1;
                    const worker = workerWrapper.create(TestWithParam, params);
                    worker.process((item) => {
                        return item.getParams();
                    }).then((data) => {
                        expect(data).to.be(params);
                        done();
                    });
                });

            });

        });
    });

});
