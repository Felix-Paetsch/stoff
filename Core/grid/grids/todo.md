Lets try a Grid Interface and hide the internal grid class implementation. And also have a type hint/way to create a new thing and a
Grid. namespace
Work out on paper what should be where
Probably _just_ internal type (string) so we can do serialization/deserialization
And dont worry to much about being generic over multiple grid types. Just enforce it.
