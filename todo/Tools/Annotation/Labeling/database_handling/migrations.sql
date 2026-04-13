CREATE OR REPLACE FUNCTION get_all_animal_projects()
RETURNS TABLE (
    id INT,
    name TEXT,
    annotated INTEGER,
    unannotated INTEGER
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        ap.id, 
        ap.name,
        COALESCE(SUM(ib.labeled_img_count)::INTEGER, 0) AS annotated,
        COALESCE(SUM(ib.img_count - ib.labeled_img_count)::INTEGER, 0) AS unannotated
    FROM 
        animalproject ap
    LEFT JOIN 
        image_batch ib ON ap.id = ib.animal_project_id
    GROUP BY 
        ap.id;
END;
$$ LANGUAGE plpgsql;
