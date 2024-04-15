
function split_dart_to_side_new(s, pattern, percent){
  l = s.line_between_points(pattern.dart_inner.p2, pattern.dart_outer.p2);

  len1 = l.get_length() * percent;
  len2 = l.get_length() - len1;
  len3 = pattern.dart_inner.get_length();
  len4 = pattern.side.get_length();

  vec = l.p1.add(l.get_line_vector().normalize().scale(len1));
  p = s.add_point(new Point(vec.x, vec.y));
  vec = p.subtract(pattern.dart_inner.p1).normalize().scale(len3).add(pattern.dart_inner.p1);
  p2 = s.add_point(new Point(vec.x, vec.y));
  s.remove_point(p);
  s.remove_line(l);
  pattern.dart_outer.p2.moveTo(p2.x, p2.y);
  s.remove_point(p2);
  vec = pattern.dart_outer.p2.subtract(pattern.side.p2).normalize().scale(len2).add(pattern.side.p2);
  pattern.side.p2.moveTo(vec.x, vec.y);
  vec = pattern.side.get_line_vector().normalize().scale(len4).add(pattern.side.p1);
  pattern.side.p2.moveTo(vec.x, vec.y);
}
