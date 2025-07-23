



function ease_fun(wd, sh){
//  ease_new(wd, sh);
}

    /*
    Ich mache das so, da ich die Abnäherspitze, sowie die Schulterpasse genau so lassen will,
    sonst verzieht sich alles. Die einzige Möglichkeit die ich habe ist also, den Bereich zwischen Seitennaht
    und Abnäherspitze zu vergrößern. Damit sich nicht der Winkel zum Abnäher hin verzieht, bleibt mir nur,
    die Punkte der Seitennaht (e, f) zu verschieben. Was das am Ende für Auswirkungen hat, muss ich wohl noch
    ausprobieren
*/

function ease_new(wd, sh) {
        let percentage =
            sh.belly /
            (wd.measurements.belly_front +
                wd.measurements.belly_back);

        let ease = (wd.ease * percentage) / 2; // das hier sollte noch von Aussen gesteuert werden
        console.log(wd.ease)
        // und ggf. fuer beide Punkte einzelnd die Groesse bestimmt werden
        let e = wd.sketch.get_typed_point("e");
        let f = wd.sketch.get_typed_point("f");

        e.move_to(e.add(new Vector(-ease, 0)));
        f.move_to(f.add(new Vector(-ease, 0)));
    }


function widen_armpit(wd){
  wd.sketch.get_typed_line("m_to_n").data.type = "bottom";
  const e = wd.sketch.get_typed_point("e")
  const c = wd.sketch.get_typed_point("c")
  const side = wd.sketch.get_typed_line("side")
  e.move_to(
    side.get_line_vector().normalize().scale(3).add(e),
  );
  wd.measurements.distance_armpit = e.subtract(c).length();
  wd.measurements.armpit_length = wd.sketch.get_typed_line("armpit").get_length();
}

export { ease_fun, widen_armpit}
