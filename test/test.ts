declare const workerWrapper: any;
declare const testLib: any;


describe('WorkerWrapper', () => {

    it('create', () => {
        const wrapper = new workerWrapper.WorkerWrapper(() => Promise.resolve(1));
        expect(wrapper).to.be.an(workerWrapper.WorkerWrapper);
        wrapper.terminate();
    });

    it('simple function', (done) => {
        const wrapper = new workerWrapper.WorkerWrapper(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(1);
                }, 500);
            });
        });
        wrapper.process((myFunc) => {
            return myFunc();
        }).then((data) => {
            expect(data).to.be.ok();
            done();
        });
    });

    it('simple function with reject', (done) => {
        const wrapper = new workerWrapper.WorkerWrapper(() => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(1);
                }, 500);
            });
        });
        wrapper.process((myFunc) => {
            return myFunc();
        }).catch((data) => {
            expect(data).to.be.ok();
            done();
        });
    });

    it('simple with lib', (done) => {
        const workFunc = function () {
            return Promise.resolve(testLib);
        };

        const worker = new workerWrapper.WorkerWrapper(workFunc, {
            libs: ['/base/test/lib.js']
        });

        worker.process((myFunc) => {
            return myFunc();
        }).then((text: string) => {
            expect(text).to.be('test');
            done();
        });
    });

    describe('check class api', () => {

        class Test {
            public getTest() {
                return 'test'
            }
        }

        class TestExtended extends Test {
            public getExtendedTest() {
                return 'extendedTest';
            }
        }

        it('simple class', (done) => {
            const worker = new workerWrapper.WorkerWrapper(Test);
            worker.process((test) => {
                return Promise.resolve(test.getTest());
            }).then((text) => {
                expect(text).to.be('test');
                done();
            });
        });

        it('extended class', (done) => {
            const worker = new workerWrapper.WorkerWrapper(TestExtended);
            worker.process((test) => {
                return Promise.resolve(test.getTest() + ' ' + test.getExtendedTest());
            }).then((text) => {
                expect(text).to.be('test extendedTest');
                done();
            });
        });

    });

});
