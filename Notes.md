Use https://nodejs.org/en

StoffLib exposes:

{
  reset: [Function (anonymous)],
  get_bounding_box: [Function (anonymous)],
  get_points: [Function (anonymous)],
  add_point: [Function (anonymous)],
  get_lines: [Function (anonymous)],
  line_between_points: [Function (anonymous)],
  interpolate_lines: [Function (anonymous)],
  intersect_lines: [Function (anonymous)],
  copy_line: [Function (anonymous)],
  remove_line: [Function (anonymous)],
  save: [Function (anonymous)],
  Point: [class Point extends Vector]
}

Geometry exposes:

{
  Vector: [class Vector],
  affine_transform_from_input_output: [Function: affine_transform_from_input_output],
  orthogonal_transform_from_input_output: [Function: orthogonal_transform_from_input_output],
  vec_angle_clockwise: [Function: vec_angle_clockwise]
}

However, you may look at Geometry/geometry.js to see which functions you need and may need to export as well.
If you want to create utilities for e.g. rotating or copying entire sections at one, make your own folder/files - you know.

If you run the example script you will get a slightly different result from me, bcs I set the sample_point spacing really high (inaccurate).