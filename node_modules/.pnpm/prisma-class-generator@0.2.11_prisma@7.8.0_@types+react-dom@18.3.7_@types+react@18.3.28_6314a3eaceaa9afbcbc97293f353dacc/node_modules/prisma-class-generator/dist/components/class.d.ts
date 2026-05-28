import { Echoable } from '../interfaces/echoable';
import { PrismaClassFile } from './file';
import { Decoratable } from './decorator';
import { PrismaField } from './field';
export declare class PrismaClass extends Decoratable implements Echoable {
    name: string;
    fields?: PrismaField[];
    relationTypes?: string[];
    enumTypes?: string[];
    echo: () => string;
    reExportPrefixed: (prefix: string) => string;
    toFileClass(output: string): PrismaClassFile;
}
