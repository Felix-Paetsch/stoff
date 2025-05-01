CREATE OR REPLACE FUNCTION log_request_error(error TEXT, method TEXT, url TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO logging (is_error, is_frontend, msg)
  VALUES (true, false, 'METHOD: ' || method || ' | URL: ' || url || ' | ERROR: ' || error);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_project(_project_id INTEGER)
RETURNS VOID
AS $$
BEGIN
    -- delete all images in batches belonging to the animal project
    DELETE FROM example_img
    WHERE animal_project_id = _project_id;

    -- delete all images in batches belonging to the animal project
    DELETE FROM image
    WHERE batch_id IN (
        SELECT id FROM image_batch WHERE animal_project_id = _project_id
    );
    
    -- delete all image batches belonging to the animal project
    DELETE FROM image_batch
    WHERE animal_project_id = _project_id;
    
    -- delete all joints belonging to the animal project
    DELETE FROM joint
    WHERE animal_project_id = _project_id;
    
    -- delete all points belonging to the animal project
    DELETE FROM point
    WHERE animal_project_id = _project_id;
    
    -- delete the animal project itself
    DELETE FROM animalproject
    WHERE id = _project_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_img_batch(_img_batch_id INTEGER)
RETURNS VOID
AS $$
BEGIN
    -- delete all images in the specified image batch
    DELETE FROM image
    WHERE batch_id = _img_batch_id;

    -- delete the image batch itself
    DELETE FROM image_batch
    WHERE id = _img_batch_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION batch_update_image_annotation_status(img_data jsonb[])
RETURNS VOID AS $$
DECLARE
  image_obj jsonb;
  img_id integer;
  _is_annotated boolean;
BEGIN
  FOREACH image_obj IN ARRAY img_data LOOP
    img_id := (image_obj ->> 'id')::integer;
    _is_annotated := (image_obj ->> 'is_annotated')::boolean;

    UPDATE image SET is_annotated = _is_annotated WHERE id = img_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION batch_update_images(img_data jsonb[])
RETURNS VOID AS $$
DECLARE
  image_obj jsonb;
  img_id integer;
  _path text;
  _is_annotated boolean;
  _should_be_used boolean;
  _point_data text;
  _last_modified timestamp;
BEGIN
  FOREACH image_obj IN ARRAY img_data LOOP
    img_id := (image_obj ->> 'id')::integer;
    _path := COALESCE((image_obj ->> 'path')::text, NULL); -- Check if 'path' exists
    _is_annotated := (image_obj ->> 'is_annotated')::boolean;
    _should_be_used := (image_obj ->> 'should_be_used')::boolean;
    _point_data := (image_obj ->> 'point_data')::text;
    _last_modified := (image_obj ->> 'last_modified')::timestamp;

    UPDATE image
    SET 
        path = COALESCE(_path, path), -- Update only if _path is not null
        is_annotated = _is_annotated,
        points = _point_data,
        last_modified = _last_modified,
        should_be_used = _should_be_used
    WHERE id = img_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

