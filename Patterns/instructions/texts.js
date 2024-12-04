
/*
const texts = {
  'start': "Beginne mit dem ausschneiden der Teile für das Vorderteil und "
    + "das Rückenteil."

  'simple_dart': ""



  'sequence': "Begonnen wird mit den Abnähern, anschließend werden die Seitennähte "
    + ",sowie die Schulternähte geschlossen. Für einfacheres Bewegen des Stoffes "
    + "kann nun der Ausschnitt versäubert werden zusammen mit dem Saum. Dies "
    + "kann jedoch auch zum Schluss getan werden.\n"
    + "Separat wird die Naht am Ärmel geschlossen sowie dessen Saum versäubert."
    + "Zum Schluss werden die Ärmel eingesetzt.",


};
*/


function get_text_beginner(type, overlock = false){
  let text = "";
  if (overlock){

  } else {
    text = text + "Stelle deine Nähmaschiene so ein, dass du eine schmale "
      + "\"zick-zack\" Line nah an einer Linie oder am Stoffrand nähen kannst. "
      + "Ersteres ist bzgl. Verheddern in der Nähmaschiene einfacher, letzteres "
      + "ermöglicht dir einfacher mit dem Stoff umzugehen, da du nicht so viel "
      + "Stoff gleichzeitig auf der Nähmaschiene und in der Hand hast. \n"
      + "Probiere beides vorher an einem Reststück und entscheide dich, was "
      + "für dich einfacher ist. Wichtig ist, dass du bei der Technik neben der "
      + "noch nicht geschnittenen Linie zu nähen die Linie nicht übernähst, da "
      + "du wenn du diese dann schneiden solltest, auch die Arbeit des \"zickeln\""
      + "wieder rückgängig machst.\n"
      + "Diesen Schritt machen wir damit vor allem bei gewebten Stoff nicht "
      + "nach und nach dae Stoff sich wieder in einzelne Fäden auflöst.\n"
      + "Teste ebenfalls deine Nähmaschine wie sie sich bei geraden Nähten "
      + "verhält. Nutze für alle bis auf den Halsausschnitt eine mittlere "
      + "Stichlänge. Bei dem Ausschnitt nutze lieber eine kurze Stichlänge."
      + "Einfaches Nähmaschinengarn in einer passenden Farbe reicht "
      + "vollkommen aus. Zu beachten ist hier, dass manche schnell und gerne "
      + "reißen, da sie aufs Hand nähen ausgelegt sind. Dementsprechend wenn "
      + "das Garn nicht als Nähmaschinengarn ausgeschildert ist, insbesondere "
      + "beim Discounter deiner Wahl - Finger weg! Es erspart dir einiges an "
      + "Verzweiflung.\n"
      + "Bis jetzt haben wir nur normale Web- und Jerseyware im Sortiment." // Das ändern wenn wir mehr Stofftypen haben
      + "Bei Webware normale Nadeln nutzen, bei Jersey ist es besonderes wichtig, "
      + "Nadeln zu nutzen welche für Stretch Stoffe ausgeschildert sind. Diese "
      + "Zerstören die Maschen nicht im Gegensatz zu bei Webware verwendeten "
      + "Nadeln.";

  }
  text = text + get_text_advanced(type);
  return text;
}


function get_text_advanced(type, overlock = false){
  let text = "";

// start
  if (overlock){
    text = "";
  } else {
    text = text + "Schneide und zickel alle Stoffteile.\n"
      + "Anschließend schließe die Seitennähte sowie die Schulternähte." // Hier ggf. noch bezug auf Nummern am Stoff
      + "Bitte achte darauf, dass die angegebenen Punkte A, B und C, sowie die Enden " // hier ggf. Grafik dazu?
      + "und Schnittkanten der Stoffstücke übereinanderliegen.\n"
      + "Da wir die Schnittlinien aufdrucken und nicht die wirkliche Stelle der Nähte, "
      + "halte einen Abstand von deiner gewählten Nahtzugabe vom Schnittrand ein.\n"
      + "Tipp: Markiere dir an deiner Nähmaschine zum Beispiel mit einem Stück Tape "
      + "wie breit von der Nadel aus deine Nahtzugabe ist um einfacher den Abstand einzuhalten.\n\n"
      + get_text_collar(type)
      + get_text_sleeve(type, overlock);

  }


  return text;
};

function get_text_sleeve(type, overlock){
  let text;

  if (overlock){

  } else {
    text = "Falls noch nicht getan, scheide die Ärmel aus und zickel sie. "
      + "Schließe die Seitennaht (A) und (B). Versäubere die Ärmel.\n"
      + versaeubern(type);
  }

  return text;
};


function versaeubern(type){

};

function get_text_collar(type){
  // verschiedene Arten den Ausschnitt zu nähen
  let text = "Schneide das Schrägband aus, pinne es in die richtige Position "
    + "und versäubere damit den Ausschnitt. Eine genauere Erklärung findest "
    + "du auf unserer Website unter LINK oder auf einer Plattform deiner Wahl im "
    + "Internet.\n";

  return text;
}
