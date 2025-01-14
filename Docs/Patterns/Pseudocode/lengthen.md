# Lengthen

function lengthen?(){

  - Zusätzliche Seitenlänge ist waist_height,
    zusätzliche Länge von fold aus ist waist_height + 2
  - Das sollte auch ungefair so bleiben wenn aus side eine Kurve wird
  - bottom_width_front oder bottom_width_back / 2 ist für die
    untere Linie die Länge
  - Es muss überprüft werden, ob die breite bei der Hälfte von
    waist_height bzw. waist_height +2 der Breite von belly_front oder belly_back
    entspricht
    (belly_front / belly_back gibt es noch nicht, aktuell wird das mit
    dem verhaeltnis von taille vorne / taille hinten (waist_width_front/_back)
    bestimmt (belly * ratio / 4))
    Kann aber sein, dass ich das noch ein wenig anpassen muss
  - Wenn ein Abnäher nach Unten geht, muss überprüft werden, ob ohne diesen
    die breite stimmt (also den Bereich zwischen den Abnäherlinien raus rechnen)
    (bedeutet also, die andere Seite eines Taillenabnähers muss vor dieser
    überprüfung gezeichnet werden)
  - Die Seiten und Linie unten sollten im Idealfall fast in einem rechten
    Winkel aufeinander treffen (kann in eine spätere Funktion gepackt werden,
    da das vermutlich am besten mit Kurven geht ;P)


  - Stimmt der Abstand am Bauch durch einfache Linien nicht überein
    - bei (pro veränderbarer Seite an der Schnittmusterkomponente)
      weniger oder gleich 1,5cm Differenz, kann das direkt verschoben werden.
      (Ich denke, bzgl. Abnäher mache ich hier erstmal keine Änderungen)
      (veränderbare Seiten an der Komponente sind Seitenkanten, bei normalen
      T-Shirts also nur die eine Seitenkante pro "Hälfte", für jeweils vorne und
      hinten, bei "Mittelteilen" die zum Beispiel bei Styleline entstrehen,
      gibt es zwei Seitenkanten, also kann man hier plus maximal 3 cm rechnen)
    - Wird mehr benötigt, muss mehr mit Abnähern gearbeitet werden,
      also falls vorhanden erst einmal die Taille langsam nach außen nehmen und den
      Abnäher vergrößern - ist am einfachsten eigentlich wenn der Abnäher an der
      Taille sitzt. Ggf. hier den Abnäher der von der Taille nach unten geht
      "nach oben nehmen" also die Abnäherspitze nach oben ziehen, damit man
      nicht einfach nur stoff verlagerung macht - man kann auch einfach zur
      berechnung annehmen er sei an der taille, ist aber an der seite, oder so.
      Etwas komplizierter ...
      - Wenn das nicht genug ist und im Prinzip Brust, Taille und Bauch schon
        eine Linie bilden, muss "ease" hinzugefügt werden, die zusätzliche
        Breite aber unten beim Po wieder raus genommen werden mit zusätzlichen
        Abnähern (wie bei Michael) Über der Brust würde ich die zusätzliche
        Breite erst einmal lassen, die so entsteht und da nicht weiter gegen
        vorgehen mit irgendwelchen Abnähern
    - Wenn es stark zu wenig ist, würde ich trotzdem nur maximal 1.5 pro seite
      abziehen und es erstmal so lassen.
}


function ease(width){
  Ich hatte das auf Papier so gemacht:
  - Neue(r) Punkt(e) Z bei 0.5 der Schulterlinie.
  - Behalte diesen Punkt, sowie den Halsausschnitt und den unteren Fold Punkt an Ort und Stelle
  - Verschiebe alle anderen Punkte auf der X-Achse um width
  - Bei den Punkten Z (die nun auseinander liegen sollten um width Breite) zeichnen
    wir einen Abnäher.
    Um ihn mit den anderen Funktionen nutzen zu können wäre vermutlich gut ihn
    bei der anderen Abnäherspitze mit einzufügen und ihn bis dort hin zu ziehen.
  - fertig

  Das Problem was ich gerade da sehe, ist dass wir plötzlich einen Abnäher mehr
  haben und ggf. mehr Variabeln usw. also muss man auch hier schauen inwieweit wir das
  mit den vielen Abnähern gleichzeitig und deren Funktionen machen.
}

function remove_dart(){
  Im Prinzip eine Funkion die mir Abnäher raus nimmt für mehr Stoff an dieser Stelle
}
