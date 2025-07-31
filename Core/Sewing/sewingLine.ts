export class SewingLine {
    constructor(sewing, lines, points) {
        this.sewing = sewing;
        this.lines = lines;
        this.primary_components = lines;
        this.endpoints = points; // Todo
        this.is_closed = false; // Todo
        this.right_handed = true; // Todo
    }

    contains(line) {
        if (line instanceof SewingLine) {
            return !this.lines.some((l) => !line.lines.includes(l));
        }
        return this.lines.some((l) => l === line);
    }

    primitive_sewing_lines() {
        return this.sewing.minimal_sewing_lines.filter((l) =>
            l.lines.some((l) => this.lines.includes(l))
        );
    }

    validate() {}
}
