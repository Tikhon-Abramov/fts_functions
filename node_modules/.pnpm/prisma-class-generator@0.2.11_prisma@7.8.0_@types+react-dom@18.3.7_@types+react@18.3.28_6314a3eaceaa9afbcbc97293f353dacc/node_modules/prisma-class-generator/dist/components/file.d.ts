import { PrismaClass } from './class';
import { PrismaImport } from './import';
import { Echoable } from '../interfaces/echoable';
export declare class PrismaClassFile implements Echoable {
    private _dir?;
    private _filename?;
    private _imports?;
    private _prismaClass;
    static TEMP_PREFIX: string;
    get dir(): string;
    set dir(value: string);
    get filename(): string;
    set filename(value: string);
    get imports(): PrismaImport[];
    set imports(value: PrismaImport[]);
    get prismaClass(): PrismaClass;
    set prismaClass(value: PrismaClass);
    constructor(prismaClass: PrismaClass);
    echoImports: () => string;
    echo: () => string;
    registerImport(item: string, from: string): void;
    resolveImports(): void;
    write(dryRun: boolean): void;
    getRelativePath(to: string): string;
    getPath(): string;
}
