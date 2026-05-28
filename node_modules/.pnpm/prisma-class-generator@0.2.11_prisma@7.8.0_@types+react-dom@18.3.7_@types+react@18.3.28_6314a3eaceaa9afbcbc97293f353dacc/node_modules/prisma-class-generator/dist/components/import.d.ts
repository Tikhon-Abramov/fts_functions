import { Echoable } from '../interfaces/echoable';
export declare class PrismaImport implements Echoable {
    from: string;
    items: string[];
    constructor(from: string, items: string | string[]);
    echo: (alias?: string) => string;
    add(item: any): void;
    getReplacePath(classToPath: Record<string, string>): string;
}
