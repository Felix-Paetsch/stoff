    import { add_point, line_between_points, interpolate_lines, Point, save } from './StoffLib/main.js';
    import { Vector } from './Geometry/geometry.js';


   const n = 15;
   const points1 = [];
   const points2 = [];
   const lines = [];
   points1[0] = add_point(new Point(0,50));

   p = add_point(new Point(0,10));
   const p2 = p.rotate(3.14/n);
   p.moveTo(p2.x,p2.y);
   points2[0] = p;


   for (let i = 1; i < n; i++){
     const vec = points1[i-1].rotate(6.28/n);
     points1[i] = add_point(new Point(vec.x,vec.y));
     const vec2 = points2[i-1].rotate(6.28/n);
     points2[i] = add_point(new Point(vec2.x,vec2.y));
   }
   for (let i = 0; i < n; i++){
     lines[i] = line_between_points(points1[i],points2[i]);
     lines[i+n] = line_between_points(points1[(i+1)%n],points2[i]);
   }

   for (let i = 0; i < n; i++){
     interpolate_lines(lines[i], lines[i+n], 2, (x) => x, (x) => Math.pow(x, 0.2), (x) => Math.pow(x, 5));
   }


    save(`out.svg`, 500, 500);
