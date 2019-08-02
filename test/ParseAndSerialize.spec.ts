import { Serializer } from '../src/Serializer';
import { Parser } from '../src/Parser';


describe('Transfer', () => {

    let parser: Parser;
    let serializer: Serializer;

    beforeEach(() => {
        parser = new Parser();
        serializer = new Serializer();
    });

    const getTime = (cb: Function): number => {
        const start = Date.now();
        cb();
        return Date.now() - start;
    };

    const getBigClass = () => {
        const Cl = function Cl() {
        };
        for (let i = 0; i < 1000; i++) {
            Cl.prototype[`method_${i}`] = function () {
                return `test_${i}`;
            };
            (Cl as any)[`static_method_${i}`] = function () {
                return `static_test_${i}`;
            };
        }
        return Cl;
    };

    it('simple data', () => {

        const data = {
            num: 1,
            str: '2',
            bool: true,
            list: [1, '2', true],
            hash: {
                a: 1,
                b: '2',
                c: false
            }
        };

        const serialized = serializer.serialize(data);
        const parsed = parser.parse(serialized);

        expect(parsed).to.eql(data);
    });

    it('transfer function', () => {
        const target = () => 'test';
        const serialized = serializer.serialize(target);
        const clone = parser.parse(serialized);

        expect(typeof clone).to.be('function');
        expect(clone.toString()).to.be(target.toString());
        expect(clone()).to.be(target());
    });

    class Animal {
        public readonly age: number;
        public live: number = 100;

        constructor(age: number) {
            this.age = age;
        }

        public getLive(): number {
            return this.live;
        }
    }

    class Rabbit extends Animal {

        public readonly color: string;

        constructor(age: number, color: string) {
            super(age);
            this.color = color;
        }

        public getLive(): number {
            return super.getLive() - 1;
        }

        public getColor(): string {
            return this.color;
        }
    }

    it('transfer with class', () => {
        const serialized = serializer.serialize(Animal);
        const ParsedAnimal = parser.parse(serialized);
        const child = new ParsedAnimal(2);

        expect(ParsedAnimal).not.equal(Animal);
        expect(child instanceof Animal).not.equal(true);
        expect(child.getLive()).to.equal(100);
    });

    it('transfer instance', () => {
        const serialized = serializer.serialize(new Animal(2));
        const animal = parser.parse(serialized);
        expect(animal.getLive()).to.equal(100);
    });

    it('transfer class with extends', () => {
        const serialized = serializer.serialize(Rabbit);
        const ParsedRabbit = parser.parse(serialized);
        const child = new ParsedRabbit(2, 'blue');

        expect(ParsedRabbit).not.equal(Rabbit);
        expect(child instanceof Animal).not.equal(true);
        expect(child.getLive()).to.equal(99);
        expect(child.age).to.equal(2);
        expect(child.color).to.equal('blue');
    });

    it('transfer instance with extend', () => {
        const serialized = serializer.serialize(new Rabbit(2, 'blue'));
        const animal = parser.parse(serialized);
        expect(animal.getLive()).to.equal(99);
    });

    it('cache transfer', () => {
        const first = getTime(() => {
            parser.parse(serializer.serialize(getBigClass()));
        });
        const second = getTime(() => {
            parser.parse(serializer.serialize(getBigClass()));
        });
        expect(second < first).to.be(true);
    });

    it('Uint8Array', () => {
        const data = Uint8Array.from([1, 2, 3]);
        const result = parser.parse(serializer.serialize(data));
        expect(result instanceof Uint8Array).to.be(true);
    });

    it('Uint16Array', () => {
        const data = Uint16Array.from([1, 2, 3]);
        const result = parser.parse(serializer.serialize(data));
        expect(result instanceof Uint16Array).to.be(true);
    });

    it('ImageData', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d') as any;
        const data = ctx.getImageData(0, 0, 200, 200);
        const result = parser.parse(serializer.serialize(data));
        expect(result instanceof ImageData).to.be(true);
    });
});
