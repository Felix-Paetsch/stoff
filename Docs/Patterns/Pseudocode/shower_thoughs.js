const shirt = new ShirtConstructor(measruements);
/*
    Has unsefull functionality for a shirt
*/

// All of these are setters, so no real need for "set" beforehand
shirt.neckline("round");
shirt.neckline_back("square");
shirt.dart_front({
    "line": "waistline",
    "fraction_along_line": 0.3, // Long name as
      // a) descriptive
      // b) we actually dont want to use this to much (?) maybe there are better ways for computation
      // or we can make it preset with a given name
    "type": "styleline"
});
shirt.ease(4);
shirt.ease_hip(4);
shirt.waist_hip_length(10);

// Q: Do the above have return things?
// Easy answer: no..
// Leading to: There is a high-level layer below this (used by leonie for more complex hacking)

shirt.sleeves("puff");

/*
Proxy as much of the build process as possible, to make configs still usable.
Dummy pattern/mode that does everything without constructions

Possibility to callback
Each phase has its own methods associated to it
*/

const sleeve = shirt.get_component("sleeve");
/* the above gets the generic sleeve, in contrast to .get_right_sleeve() */

// We would expect this to be implemented on the sleeve at some point
// But it should also be possible outside! (So a very good test case)
// Given, that we can just replace part of the sleeve, all data associated to the sketch should be in the sketch data
sleeve.set_type("ruffles");
const sleeve_comp = sleeve.named_component("sleeve"); // We are in the realm of components and/or sketches
// We need smth like a "pseudo sketch" (or just a temp sketch) bcs
// We shouldn't need to know if the sleeve is in a sketch of its own or not
// e.g. should be able to yank it or render it on its own. Might even be a collection of things..
// References from the outside world should stay (or from sketch data) 
//      => uUIDs? pt1.identify(expt2)
//      whenever we copy something we get an associated method to use the old id (and then optionally do smth to the other..)

// probably its a new sketch (with the possibility to insert it back easily)
// the sketch can have additional methods on it, like replace the old things with the new things
// Dream: do a construction on a copy and then apply it to the old thing (awesome and cool and hard..)
// For copies allow to find the new holder of the thing; allow to find the latest copy
// Curry copies all the way to the top, making it the OG
const stripes = sleeve_comp.component().cut_stripes(
  sleeve_comp.get_line("line_arm_curve"),
  sleeve_comp.get_line("line_wrist"),
  8
);
// Todo: get the (only) connected component of a sketch if there is some
stripes.spread(sleeve_comp.get_line("line_wrist"), 5);
const trace = stripes.trace_new_pattern();
sleeve_comp.replace_original();


// Im Enddefekt geht das schon; zu faul (voll im Kopf) um auszuformulieren
      pattern.comp2.cut(line_side[0], 0.3, line_side[1], 0.3, straight)
      // schneidet eine gerade Linie von linie1 zu linie2 bei den gegebenen %
      // cut(line1, 0.3, line2, 0.3, curve, function_of_curve)??? Das wird irgendwie spannend, wie ich das mache

      // wissen nachdem sie geschnitten wurden, Linien welche die andere Linie ist, welche
      // zusammen mit ihr entstanden ist? Kann ich also
      // pattern.comp2.split_to_new_component()
      // machen, um die gerade geschnittenen Linien und Komponenten zu zwei Komponenten des
      // Patterns zu machen? Und dass die Komponents bzw. das Pattern (wo auch immer wir
      // das verankern) weiß, dass später diese Linien wieder zusammen genäht werden müssen?

      pattern.comp3.glue(line_side[0], pattern.comp4, line_side[1])
      // oder statt pattern.comp4 lieber nur comp4?? keine Ahnung
      // wie heißt die nun neue Komponente? (im verlauf annahme, dass comp3)

      pattern.comp3.cut(line_waistline, 0.3, line_neckline[0], 0.6, straight)
      pattern.comp3.split_to_new_component()

const res = pattern.construct()
// Geht alle Phasen durch && führt die gespeicherten (curry?) sachen aus, die noch fehlen
    // kürzt? (die Komponenten so, wie der Kunde es möchte)
    // Nahtzugabe
    // Annotieren der Abnäher
    // Annotieren der Linien, fürs Drucken u.ä.
    // Löschen der überflüssigen Linien

/*

  Takeaway:
    Phasen! Curry!
    uUID's


  Todo:
    Plan one level deeper
    Reestablisch Dev env
    Start with uUIDs; Problems with
      - copy
      - serialize
      - ...
*/