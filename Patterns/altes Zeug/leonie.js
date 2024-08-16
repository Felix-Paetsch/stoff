
    import { add_point, line_between_points, interpolate_lines, Point, save } from './StoffLib/main.js';
    import { Vector } from './Geometry/../StoffLib/geometry.js';

    const p1 = add_point(new Point(0, 0));
    const p3 = add_point(new Point(40, 0));
    const p2 = add_point(new Point(0, -50));
    const p4 = add_point(new Point(40, -50));

    const l1 = line_between_points(p1,p2);
    const l2 = line_between_points(p3, p4);

    interpolate_lines(l1, l2, 0, (x) => x+(x-0.5)*(x-0.5)-0.5*0.5, (x) => x, (x) => x)


    save(`out.svg`, 500, 500);
