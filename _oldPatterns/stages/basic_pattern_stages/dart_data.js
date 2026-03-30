import assert from "../../../Core/assert.js";
import { EPS } from "../../../Core/StoffLib/geometry.js";

export default class DartData {
    constructor(darts) {
        this.darts = darts.map((d) => {
            return {
                line: d[0],
                fraction_along_line: d[1],
                dart_amount: d[2],
            };
        });
        this.#eval_darts();
        this.#validate_darts();
        // das ist mit Absicht nicht im Constructor, damit die Klasse auch bei anderen Fällen genutzt werden kann
        //this.check_sum();
    }

    #eval_darts() {
        this.lines = {};
        this.darts.forEach((dart) => {
            if (!Object.keys(this.lines).includes(dart.line)) {
                this.lines[dart.line] = [
                    [dart.fraction_along_line, dart.dart_amount],
                ];
            } else {
                this.lines[dart.line].push([
                    dart.fraction_along_line,
                    dart.dart_amount,
                ]);
            }
        });
    }

    #validate_darts() {
        this.sum = 0;
        Object.keys(this.lines).forEach((line) => {
            let temp = {};
            this.lines[line].forEach((arr) => {
                if (temp[arr[0]]) {
                    temp[arr[0]] = [arr[0], temp[arr[0]][1] + arr[1]];
                } else {
                    temp[arr[0]] = [arr[0], arr[1]];
                }
            });

            this.lines[line] = [];
            Object.keys(temp).forEach((x) => {
                this.lines[line].push(temp[x]);
                this.sum = this.sum + temp[x][1];
            });
        });
    }

    get_lines() {
        return Object.keys(this.lines);
    }

    get_fractions_along_line(line) {
        return this.lines[line];
    }

    sort_line(line) {
        this.lines[line].sort(function (a, b) {
            return a[0] - b[0];
        });
    }

    check_sum() {
        assert.CALLBACK(
            "Teile vom Abnäher addieren sich nicht zu 100%!",
            () => {
                return Math.abs(this.sum - 1.0) < EPS.TINY;
            },
        );
    }

    get_number_of_darts() {
        let i = 0;
        Object.keys(this.lines).forEach((line_name) => {
            this.lines[line_name].forEach((dart) => {
                i++;
            });
        });
        return i;
    }

    sort_lines() {
        let temp = {};
        if (Object.keys(this.lines).includes("side")) {
            temp.side = this.lines.side;
        }
        if (Object.keys(this.lines).includes("armpit")) {
            temp.armpit = this.lines.armpit;
        }
        if (Object.keys(this.lines).includes("shoulder")) {
            temp.shoulder = this.lines.shoulder;
        }
        if (Object.keys(this.lines).includes("neckline")) {
            temp.neckline = this.lines.neckline;
        }
        if (Object.keys(this.lines).includes("fold")) {
            temp.fold = this.lines.fold;
        }
        this.lines = temp;
    }
}
