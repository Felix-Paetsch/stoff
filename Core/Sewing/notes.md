Todo:

Make JS, TS interoperable

Do next:

- Make sure the relative/absolute numbers check out correctly
- Merge Face Carousels

- asserts for faces and face caroussels for testing
- first using the stand-alone debug environment
- then using the old and new debug servers; the old one mostly only with ?debug=...
- add a ?debug=... to the new server
- change the return types from setOrientation/swapOrientation, etc (should be the new boolean)
- also for sewing check return types. Maybe introduce "with" keyword to return a modified thing
- update (replace) some methods working with cycles (PatternLib::Boundary)
- get connected components optionally as lines... or: very good proxy behaviour
- improved cut and glue methods using faces
- in general more methods for faces
    - merge
    -

Continue SewingLine/SewingPoint & co discussion

=====================

# Cut

Input:
Linie(n) zu schneiden

# Fold

Input:
Fold line
left, right boundary
orientation of fold (in theory this is inferable from the boundary; but maybe nice to have anyway)
(Ja; (leider) funktioniert das auch super, wenn alles zerstueckelt ist und wir erst Teile der Flaeche die wir Falten zusammen naehen muessen; fuer mich wird das zwei grauenhaft die Flaechen dann abzuleiten... aber fuer dich kein Problem)

# Buegeln (du siehtst, ich habe vergessen, wie man Umlaute schreibt)

Input:
Linie
Schichten links, schichten rechts
orientierung (von "oben" oder "unten" Buegeln) falls ueberhaupt relevant

# Zusammenlegen

Input
Linien
Orientierung der Linien
Flaechen, die aufeinadner liegen sollen (orientierung der Flaechen ist dann inferierbar)
Reihenfolge der Flaechen

# SewLine

Input:
Linien zum zusammen naehen + welche Oben ist (wobei generell in Reihenfolder in der du sie angibst)
Linien die (in eine Richtung) rein genaeht werden sollen
(Weil wir vorher Falten und/oder Dinge zusammen legen muessen wir hier nicht mehr angeben)

========================

Konzept von distingushed lines

- durch ausschneiden
- durch falten
- durch buegeln
