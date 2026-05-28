import { Echoable } from '../interfaces/echoable';
export declare class PrismaDecorator implements Echoable {
    name: string;
    params: any[];
    importFrom: string;
    constructor(input: {
        name: string;
        params?: any | any[];
        importFrom: string;
    });
    echo(): string;
    add(param: any): void;
}
export declare class Decoratable {
    decorators: PrismaDecorator[];
    constructor(obj?: object);
    addDecorator: (input: {
        name: string;
        param: any;
        importFrom: string;
    }) => void;
    echoDecorators: () => string;
}
