# Geometry

`StoffLib/geometry.js` is a self contained file with many useful functionalities concerning Vectors and 2D-computations.

## Objects

You can export the following classes from the file:
### Vector

A vector represents a point or direction with magnitude in 2D-space.

```javascript
class Vector {
    constructor(x: number = 0, y: number = 0, column: boolean = true) { ... }
    set(x: number, y: number): this { ... }
    dot(vec: Vector): number { ... }
    distance(vec: Vector): number { ... }
    scale(a: number): Vector { ... }
    mult(el: number | Vector | Matrix): Vector | number | Vector { ... }
    add(vec: Vector): Vector { ... }
    subtract(vec: Vector): Vector { ... }
    rotate(angle: number): Vector { ... }
    transpose(): Vector { ... }
    normalize(): Vector { ... }
    get_orthogonal(): Vector { ... }
    get_orthonormal(): Vector { ... }
    to_len(a: number): Vector { ... }
    length(): number { ... }
    length_squared(): number { ... }
    to_array(): [number, number] { ... }
    toString(): string { ... }
    print(): this { ... }
    x: number
    y: number
    is_row: boolean
    is_column: boolean
}
```

##### Constructor

```javascript
import { Vector } from './StoffLib/geometry.js'
new Vector(x: number = 0, y: number = 0, column: boolean = true)
```

- `x`: The x-coordinate of the vector. Defaults to 0.
- `y`: The y-coordinate of the vector. Defaults to 0.
- `column`: Boolean indicating if the vector is a column or row vector. Defaults to true.

##### Methods

- `.set(x : number, y : number) : this`: Sets the vector coordinates.
```javascript
const v = new Vector();
v.set(5, 6);
console.log(v.to_array()); // [5, 6]
```

- `.dot(vec : Vector) : number`: Computes the dot product with another vector.
```javascript
const v1 = new Vector(1, 2);
const v2 = new Vector(3, 4);
console.log(v1.dot(v2)); // 11
```

- `.distance(vec : Vector) : number`: Computes the distance between this vector and another.
```javascript
const v1 = new Vector(1, 2);
const v2 = new Vector(4, 6);
console.log(v1.distance(v2)); // 5
```

- `.scale(a : number) : Vector`: Scales the vector by a scalar `a`.
```javascript
const v = new Vector(2, 3);
console.log(v.scale(2)); // Vector {x: 4, y: 6}
```

- `.mult(el : number | Vector | Matrix) : Vector | (number | Matrix) | Vector`: Multiplies the vector by a scalar, vector, or matrix.
```javascript
const v = new Vector(2, 3);
console.log(v.mult(2)); // Vector {x: 4, y: 6}
```
    Depending on the type of `el`, we either 
    - scale (`el: number`)
    - compute the dot product (`el: Vector`) and `el, v1` are both column or row vectors
    - compute the outer product (`el: Vector`) and one of `el, v1` is a row, the other a column vector
    - multiply on the right by the matrix, viewing `v` as a row vector. (`el: Matrix`)

- `.add(vec : Vector) : Vector`: Adds another vector.
```javascript
const v1 = new Vector(1, 2);
const v2 = new Vector(3, 4);
console.log(v1.add(v2)); // Vector {x: 4, y: 6}
```

- `.subtract(vec : Vector) : Vector`: Subtracts another vector.
```javascript
const v1 = new Vector(5, 6);
const v2 = new Vector(2, 3);
console.log(v1.subtract(v2)); // Vector {x: 3, y: 3}
```

- `.rotate(angle : number) : Vector`: Rotates the vector clockwise by a given angle. The angle is given in radiants.
```javascript
const v = new Vector(1, 0);
console.log(v.rotate(Math.PI / 2)); // Rotated Vector {x: 0, y: 1}
```

- `.transpose() : Vector`: Returns the transposed vector.
```javascript
const v = new Vector(1, 2);
console.log(v.transpose()); // Transposed Vector
```

!!! note
    For many computations this is irrelevant. Against some expectations this is true even when multiplying by a matrix. However there is an important distinction when multiplying two vectors.

- `.normalize() : Vector`: Normalizes the vector to unit length.
```javascript
const v = new Vector(3, 4);
console.log(v.normalize()); // Normalized Vector
```

- `.get_orthogonal() : Vector`: Returns an orthogonal vector with same magnitude.
```javascript
const v = new Vector(3, 4);
console.log(v.get_orthogonal()); // Vector {x: 4, y: -3}
```

- `.get_orthonormal() : Vector`: Returns an orthonormal vector.
```javascript
const v = new Vector(3, 4);
console.log(v.get_orthonormal()); // Normalized orthogonal vector
```

- `.to_len(a : number) : Vector`: Scales the vector to have length `a`
```javascript
const v = new Vector(0,1);
console.log(v.to_len(5)); // Vector {x: 0, y: 5}
```

- `.length() : number`: Returns the magnitude of the vector.
```javascript
const v = new Vector(3, 4);
console.log(v.length()); // 5
```

- `.length_squared() : number`: Returns the squared magnitude of the vector.
```javascript
const v = new Vector(3, 4);
console.log(v.length_squared()); // 25
```

- `.to_array() : number[2]`: Returns the vector as an array `[x, y]`.
```javascript
const v = new Vector(3, 4);
console.log(v.to_array()); // [3, 4]
```

- `.toString() : string`: Returns a string representation of the vector.
```javascript
const v = new Vector(3, 4);
console.log(v.toString()); // "[3.0, 4.0]"
```

- `.print() : void`: Prints the vector in a formatted way. Note this is different from the result of `.toString()`
```js
const v = new Vector(3, 4);
v.print(); // Prints formatted vector
```

Note that no method except `.set` mutates the original vector.

### Matrix

The Matrix class represents a 2x2 matrix and supports various matrix operations like transposition, multiplication, and inversion.

```js
import { Matrix } from './StoffLib/geometry.js'

class Matrix {
    constructor(vec1: Vector, vec2: Vector, column_wise: boolean = true) { ... }
    transpose(): Matrix { ... }
    add(m: Matrix): Matrix { ... }
    scale(a: number): Matrix { ... }
    mult(el: number | Vector | Matrix): Vector | Matrix { ... }
    det(): number { ... }
    invert(): Matrix { ... }
    toString(): string { ... }
    print() : this { ... }
    toJSON(): [number[2], number[2]] { ... }
}
```

##### Constructor

```javascript
new Matrix(vec1: Vector, vec2: Vector, column_wise: boolean = true)
```

- `vec1`: First (column) vector
- `vec2`: Second (column) vector
- `column_wise`: Boolean indicating whether the vectors are column-wise. Defaults to `true`

##### Methods

- `.add(m : Matrix) : Matrix`: Adds another matrix to this matrix.
```javascript
const m1 = new Matrix(new Vector(1, 2), new Vector(3, 4));
const m2 = new Matrix(new Vector(2, 1), new Vector(4, 3));
console.log(m1.add(m2)); // Resulting Matrix after addition
```

- `.mult(el : number | Vector | Matrix) : Vector | Matrix`: Multiplies the matrix by a scalar, vector, or matrix.
```javascript
const m = new Matrix(new Vector(1, 2), new Vector(3, 4));
console.log(m.mult(2)); // Matrix scaled by 2
```

- `.scale(a : number) : Matrix`: Scales the matrix by a scalar `a`.
```javascript
const m = new Matrix(new Vector(1, 2), new Vector(3, 4));
console.log(m.scale(2)); // Scaled Matrix
```

- `.det() : number`: Returns the determinant of the matrix.
```javascript
const m = new Matrix(new Vector(1, 2), new Vector(3, 4));
console.log(m.det()); // Determinant of the matrix
```

- `.invert() : Matrix`: Returns the inverse of the matrix.
```javascript
const m = new Matrix(new Vector(1, 2), new Vector(3, 4));
m.invert().mult(m).toString(); // "[[1,0], [0,1]]"
```

- `.transpose() : Matrix`: Returns the transposed matrix.
```javascript
const m = new Matrix(new Vector(1, 2), new Vector(3, 4));
console.log(m.transpose()); // Transposed Matrix
```

- `.toString() : string`: Returns a string representation of the matrix.
```javascript
const m = new Matrix(new Vector(1, 2), new Vector(3, 4));
console.log(m.toString()); // "[[1, 3], [2, 4]]"
```.print(); // Prints formatted matrix
```

- `.to_array() : number[2][2]`: Returns the matrix as an array.
```javascript
const m = new Matrix(new Vector(1, 2), new Vector(3, 4));
console.log(m.toJSON()); // [[1, 2], [3, 4]]
```


- `.print() : this`: Prints the matrix in a formatted way.

Note that no function modifies a matrix.

## Functions

The following functions are also exported from `StoffLib/geometry.js` and provide utility operations for geometric computations.

### Distance from line

`distance_from_line(line_points : [Vector, Vector], vec : Vector) : number`

Calculates the shortest distance from a point `vec` to a line defined by two points.

```javascript
import { distance_from_line, Vector } from './StoffLib/geometry.js'

const vec1 = new Vector(0, 0);
const vec2 = new Vector(3, 3);
const point = new Vector(1, 2);
console.log(distance_from_line([vec1, vec2], point)); // Distance from point to the line
```

### Distance from line segment
`distance_from_line_segment(endpoints : [Vector, Vector], vec : Vector) : number`

Calculates the distance from a point to the closest point on a line segment.

```javascript
import { distance_from_line_segment, Vector } from './StoffLib/geometry.js'

const vec1 = new Vector(0, 0);
const vec2 = new Vector(3, 3);
const point = new Vector(1, 2);
console.log(distance_from_line_segment([vec1, vec2], point)); // Distance from point to the closest point on the segment
```

### Closest vector on line segment 
`closest_vec_on_line_segment(endpoints : [Vector, Vector], vec : Vector) : Vector`

Returns the closest point on a line segment to the provided vector `vec`.

```javascript
import { closest_vec_on_line_segment, Vector } from './StoffLib/geometry.js'

const vec1 = new Vector(0, 0);
const vec2 = new Vector(3, 3);
const point = new Vector(1, 2);
console.log(closest_vec_on_line_segment([vec1, vec2], point)); // Closest point on the line segment
```

### Matrix from input, output
`matrix_from_input_output(f_in : [Vector, Vector], f_out : [Vector, Vector]) : Matrix`

Calculates a transformation matrix from the input and output vectors.

!!! warning
    If the input vectors are colinear, this function throws an error.

```javascript
import { matrix_from_input_output, Vector } from './StoffLib/geometry.js'

const vec1_in = new Vector(0, 0);
const vec2_in = new Vector(1, 1);
const vec1_out = new Vector(2, 2);
const vec2_out = new Vector(4, 4);
const m = matrix_from_input_output([vec1_in, vec2_in], [vec1_out, vec2_out])); // Transformation matrix

assert(m.mult(vec1_in) == vec1_out);
assert(m.mult(vec2_in) == vec2_out);
```

### Affine tranformation from input output
`affine_transform_from_input_output(f_in : [Vector, Vector], f_out : [Vector, Vector]) : (Vector) : Vector`

Creates an affine transformation from two sets of input/output points. It returns a function that transforms a vector according to the computed transformation. 
This transformation is angle preserving.

!!! warning
If either `vec1_in`, `vec2_in` or `vec1_out`, `vec2_out` are colinear, we get an error.

```javascript
import { affine_transform_from_input_output, Vector } from './StoffLib/geometry.js'

const vec1_in = new Vector(0, 0);
const vec2_in = new Vector(1, 1);
const vec1_out = new Vector(2, 2);
const vec2_out = new Vector(4, 4);
const transform = affine_transform_from_input_output([vec1_in, vec2_in], [vec1_out, vec2_out]);
console.log(transform(new Vector(1, 1))); // Transformed vector
```

### Orthogonal transform from input output
`orthogonal_transform_from_input_output(v1 : Vector, v2 : Vector) : (Vector) : Vector`

Creates an orthogonal linear transformation function that rotates and stretches `v1` to `v2`.

```javascript
import { orthogonal_transform_from_input_output, Vector } from './StoffLib/geometry.js'

const v1 = new Vector(1, 0);
const v2 = new Vector(0, 1);
const transform = orthogonal_transform_from_input_output(v1, v2);
console.log(transform(new Vector(1, 0))); // Rotated and stretched vector
```

### Rotation function
`rotation_fun(rotation_vec : Vector, angle : number) : (Vector) : Vector`

Returns a function that takes in a vector and rotates it by `angle` radians around the `rotation_vec`.

```javascript
import { rotation_fun, Vector } from './StoffLib/geometry.js'

const rot_center = new Vector(1, 1);
const angle = Math.PI / 4;
const rotate = rotation_fun(rot_center, angle);
console.log(rotate(new Vector(2, 2))); // Rotated vector
```

### Vector angle
`vec_angle(vec1 : Vector, vec2 : Vector) : number`

Calculates the angle between two vectors in radians. It returns the smaller of the two angles.

```javascript
import { vec_angle, Vector } from './StoffLib/geometry.js'

const v1 = new Vector(1, 0);
const v2 = new Vector(0, 1);
console.log(vec_angle(v1, v2)); // Angle in radians
```

!!! note
    If one vector is trivial, then the result is `Math.PI`

### Vector angle clockwise
`vec_angle_clockwise(vec1 : Vector, vec2 : Vector) : number`

Calculates the clockwise angle between two vectors in radians.

```javascript
import { vec_angle_clockwise, Vector } from './StoffLib/geometry.js'

const v1 = new Vector(1, 0);
const v2 = new Vector(0, 1);
console.log(vec_angle_clockwise(v1, v2)); // math.PI/2 (may need double checking)
```

!!! note
    If one vector is trivial, then the result is `Math.PI`

### Degree to radians
`deg_to_rad(d : number) : number`

Converts degrees to radians.

```javascript
import { deg_to_rad } from './StoffLib/geometry.js'

console.log(deg_to_rad(180)); // math.PI
```

### Radians to degree
`rad_to_deg(r : number) : number`

Converts radians to degrees.

```javascript
import { rad_to_deg } from './StoffLib/geometry.js'

console.log(rad_to_deg(Math.PI)); // 180
```
