import { BufferDST } from "Embroidery/Projects/buffer/index";

type BufferDSTOptions = {
    file: string;
    buffer: number | number[];
    concavity?: number;
    length_threshold?: number;
    smooth_hull?: number;
    smooth_buffer?: number;
};

function printUsage(): void {
    console.log(`
Usage:
  run-buffer <dstFileName> <bufferList> [options]

Arguments:
  dstFileName              Path to the DST file
  bufferList               Comma-separated number list
                           Example: 3,1,3.2,8

Options:
  --concavity, -c          Number
  --length-threshold, -lt  Number
  --smooth-hull, -sh       Number
  --smooth-buffer, -sb     Number
  --help, -h               Show this help

Examples:
  run-buffer file.dst 3,1,3.2,8 --concavity 3.2 --smooth-hull 5
  run-buffer file.dst 3,1,3.2,8 -c 3.2 -lt 10 -sh 5 -sb 2
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

function parseArgs(argv: string[]): BufferDSTOptions {
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

    const options: BufferDSTOptions = {
        file,
        buffer,
    };

    let i = 2;
    while (i < argv.length) {
        const arg = argv[i];

        switch (arg) {
            case "--concavity":
            case "-c": {
                const value = argv[i + 1];
                if (value == null) {
                    throw new Error(`Missing value for ${arg}`);
                }
                options.concavity = parseNumber(value, arg);
                i += 2;
                break;
            }

            case "--length-threshold":
            case "-lt": {
                const value = argv[i + 1];
                if (value == null) {
                    throw new Error(`Missing value for ${arg}`);
                }
                options.length_threshold = parseNumber(value, arg);
                i += 2;
                break;
            }

            case "--smooth-hull":
            case "-sh": {
                const value = argv[i + 1];
                if (value == null) {
                    throw new Error(`Missing value for ${arg}`);
                }
                options.smooth_hull = parseNumber(value, arg);
                i += 2;
                break;
            }

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
try {
    const args = process.argv.slice(2);
    options = parseArgs(args);
} catch {
    process.exit(1);
}

BufferDST.embroidery(options);
console.log("Done!");
