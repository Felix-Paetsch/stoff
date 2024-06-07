    import { add_point, line_between_points, interpolate_lines, Point, save } from './StoffLib/main.js';
    import { Vector } from './Geometry/geometry.js';
    import { line_with_length, point_at, armhole } from './clothes/basicFun.js';



    const bust = 90;
    const tai = 75;
    const po = 100;
    const height = 45;

    //----
    const p1 = add_point(new Point(0,0));
    const p2 = add_point(new Point(0,height));

    const l1 = line_between_points(p1,p2);

    const p3 = 0 ; // Punkt an der Stelle 55% von oben auf l1
    // const p5, soll bust/4 seitlich von p3 sein

//    const p4 = add_point(new Point(bust/4, height)); // Grundschnittmuster, noch nicht Tailliert

  //  const l2 = line_between_points(p2,p4);

    const p5 = line_with_length(p1, bust/4, -90);

    const bla = point_at(p1, p2, l1, 0.2);
    // const l3 = line_between_points(p3,p5);

    const arm = armhole(p5.point, p2, 0, -90);
    //Ich "brauche" eine Funktion, welcher ich einen Punkt, eine Länge und
    // eine Richtung gebe, die mir diese Linie malt und dort einen Punkt setzt

    // Ich brauche eine Funktion für Ausschnitte -> Welche Art von Parametern
    // muss ich dieser Übergeben?

    // Funktion bauen, welche an einer Stelle (z.B. x %) einer Linie einen
    // neuen Punkt setzt. -> Hilfsgerade + intersect_lines




    save(`out.svg`, 500, 500);
