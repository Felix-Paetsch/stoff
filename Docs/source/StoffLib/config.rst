Config
=======================

Configuration for different constants of the programm

**Source File**: ./StoffLib/config.json

.. code-block:: json

   {
       "DEFAULT_PX_PER_UNIT": 1,
       "DEFAULT_SAVE_PX_PADDING": 10,

       "_descr1": "sizes is for printing of several A4 pages",
       "PX_PER_CM": 50,
       "PRINTABLE_WIDTH_CM": 21,
       "PRINTABLE_HEIGHT_CM": 29.7,
       "PRINT_PADDING_CM": 0.8,

       "_descr2": "sample point amt choices",
       "DEFAULT_SAMPLE_POINT_DENSITY": 0.01,
       "INTERPOLATION_NORMALIZATION_DENSITY": 0.001,
       "RENDER_MAX_SAMPLE_POINTS_PER_LINE": 100,

       "_descr3": "validation steps included",
       "ASSERT_NON_SELFINTERSECTING": false,

       "_descr4": "for development",
       "DEV_REFERENCE_IMG_OPACITY": 0.5,

       "execute_internal_custom_assert": true,
       "execute_external_custom_assert": true,
       "fail_on_asserts": true
   }

Configuration Details
---------------------

- **DEFAULT_PX_PER_UNIT**: Defines how many pixels are a unit inside a sketch (number).
- **DEFAULT_SAVE_PX_PADDING**: Defines how many pixels padding to use when making a sketch to an image (integer).

.. rubric:: Printing pattern to A4 pages

- **PX_PER_CM**: Pixels per centimeter (integer).
- **PRINTABLE_WIDTH_CM**: Printable width in centimeters (float).
- **PRINTABLE_HEIGHT_CM**: Printable height in centimeters (float).
- **PRINT_PADDING_CM**: Print padding in centimeters (float).

.. rubric:: Sample point amt choices

- **DEFAULT_SAMPLE_POINT_DENSITY**: Default density for sampling points on a line (1/n with n the number of line segments).
- **INTERPOLATION_NORMALIZATION_DENSITY**: Density to normalize two lines to before interpolating them (float).
- **RENDER_MAX_SAMPLE_POINTS_PER_LINE**: How many sample points to use max when rendering to svg/png/jpg (integer).

.. rubric:: Assert settings

- **ASSERT_NON_SELFINTERSECTING**: Whether to assert non-self-intersecting on lines of a sketch (boolean).

.. rubric:: Asserts

- **execute_internal_custom_assert**: Enable internal (StoffLib) custom assertions (boolean).
- **execute_external_custom_assert**: Enable external (non-StoffLib) custom assertions (boolean).
- **fail_on_asserts**: Fail execution on assertion errors (boolean).

.. rubric:: Other

- **DEV_REFERENCE_IMG_OPACITY**: Opacity level for reference images (float); currently not completely supported.