from api_wrapper.projects import get_all_projects

def get_project_from_name(project_name):
    res = get_all_projects()
    if res["error"]:
        return res
    
    try:
        return dict(
                error = False,
                project = [
                    p for p in res["projects"] if p["name"] == project_name
                ][0]
        )
    except:
        return dict(
            error = True,
            value = "Project doesn't exist"
        )
