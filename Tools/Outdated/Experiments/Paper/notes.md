Fix Point Following issue
Code review and improvement wishes, further separation of concerns? Can we split stuff into two subfolders?

serialization into spline
================================================
steps to do
-> save spline with angle (especially for display)
-> Errors: Anchors to close, only 1 anchor
-> better structure for currently selected points, anchor points
-> highlight line
-> delete line
-> Add Spline Clicked
-> Remove spline on key
-> Toggle modes
-> Svg elements ----> element groups, for each group set a set of possibles styles && exposed functions
|-> <g /> ??? groupd || sub-svg
|-> Dont expose styling to the outside world, only the possible types of styling
|-> do testing with groups, then either use groups or custom stuff

===========================================================================================================

keyboard_shortcuts to loop through points (top to bottom)
linie halbieren?

===========================================================================================================

Shortcuts
---------

A: Add point
RightClick: Move currently selected point
X: Remove currently selected point/Line
L: Add Lines between currently selected points (cycle through all possible lines)
S: Save the current sketch as a new basic spline. The white circled points tell which points the spline is relative to.
R: Set white circle to current selected pt