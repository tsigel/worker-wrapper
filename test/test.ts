///<reference path="../interface.d.ts"/>
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

            it('simple with lib', (done) => {
                const workFunc = function () {
                    return Promise.resolve(testLib);
                };

                const worker = workerWrapper.create(workFunc, {
                    libs: ['/base/test/lib.js']
                });

                worker.process((promise) => {
                    return promise;
                }).then((text: string) => {
                    expect(text).to.be('test');
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

                    constructor(params) {
                        super();
                        this.params = params;
                    }

                    public getParams(): any {
                        return this.params;
                    }

                }

                it('simple class', (done) => {
                    const worker = workerWrapper.create(Test);
                    worker.process((test) => {
                        return Promise.resolve(test.getTest());
                    }).then((text) => {
                        expect(text).to.be('test');
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
