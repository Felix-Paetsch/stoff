import { Out } from "@/Dev";
import { BufferOutlineDST } from "Embroidery/Projects/buffer_outline/index";

type BufferOutlineDSTOptions = {
    file: string;
    buffer: number | number[];
    smooth_buffer?: number;
};

function printUsage(): void {
    console.log(`
Usage:
  just tools::bufferOutline <dstFileName> <bufferList> [options]

Arguments:
  dstFileName              Path to the DST file
                           Escape spaces like so: "'file name.dst'"
  bufferList               Comma-separated number list
                           Example: 3,1,3.2,8

Options:
  --smooth-buffer, -sb     Number
  --help, -h               Show this help

Examples:
  just tools::bufferOutline file.dst 3,1,3.2,8 --smooth-buffer 5
  just tools::bufferOutline "'file test.dst'" 3,1,3.2,8 -sb 2
`);
}

function parseNumber(value: string, flagName: string): number {
    const num = Number(value);
    if (Number.isNaN(num)) {
        throw new Error(`Invalid number for ${flagName}: ${value}`);
    }
    return num;
}

function parseBuffer(value: string): number | number[] {
    if (!value.includes(",")) {
        const num = Number(value);
        if (Number.isNaN(num)) {
            throw new Error(`Invalid buffer value: ${value}`);
        }
        return num;
    }

    const arr = value.split(",").map((part) => {
        const num = Number(part.trim());
        if (Number.isNaN(num)) {
            throw new Error(`Invalid buffer number: ${part}`);
        }
        return num;
    });

    return arr;
}

function parseArgs(argv: string[]): BufferOutlineDSTOptions {
    if (argv.includes("--help") || argv.includes("-h")) {
        printUsage();
        process.exit(0);
    }

    if (argv.length < 2) {
        printUsage();
        throw new Error(
            "Missing required arguments: <dstFileName> <bufferList>",
        );
    }

    const file = argv[0]!;
    const buffer = parseBuffer(argv[1]!);

    const options: BufferOutlineDSTOptions = {
        file,
        buffer,
    };

    let i = 2;
    while (i < argv.length) {
        const arg = argv[i];

        switch (arg) {
            case "--smooth-buffer":
            case "-sb": {
                const value = argv[i + 1];
                if (value == null) {
                    throw new Error(`Missing value for ${arg}`);
                }
                options.smooth_buffer = parseNumber(value, arg);
                i += 2;
                break;
            }

            default:
                throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return options;
}

let options: ReturnType<typeof parseArgs>;

const args = process.argv.slice(2);
options = parseArgs(args);

Out.clear();
BufferOutlineDST.embroidery(options);
console.log("Done!");
