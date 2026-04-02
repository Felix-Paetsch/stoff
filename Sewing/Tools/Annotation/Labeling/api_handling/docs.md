# Python API interface

The webserver exposes many routes through which one can interact with it and with the database. This folder provides a wrapper for accessing these routes.

To work with it, you always have to first initialize the environment:

```py
from api_wrapper.main import init
init("../data/config.json")
```

This is done so we know where to send the requests and what the authentication data is. For reference, the json-file looks something like this:

```json
{
    "json_limit": "50mb",
    "port": 3005,

    // We need these 3 keys
    "website_path": "http://localhost:3005",
    "auth_pw": "BrombeereNotFound",
    "auth": "Auth",

    "catch_errors": false,
    "error_logging": false,

    "single_person_editing_timeout_min": 30,
    "enable_edit_guard": false
}
```

Most functions exposed by the files in the module return a dict which has information about whether
the request failed and extra data. It looks like:

```py
    {
        "error": False,
        # extra data, funtion specific
    },{
        "error": True,
        # "value": "Short error description",
        # "stack": "Stack trace of the error"
    }
```

In the second case, `"value"` and `"stack"` are only present if they can be deduced from the function. This mostly fails only when the error arises at the website-end.
In the following I only give the success responses.

## projects.py

```py
    def get_all_projects()
        # No side effects

        return {
            'error': False,
            'projects': [{
                'id': 1,
                'name': 'Text Project 2522336551',
                'created_at': '2024-07-29T07:22:50.750Z',
                'batches': [{'id': 1,
                    'name': 'Batch 1',
                    'img_count': 0,
                    'labeled_img_count': 0,
                    'created_at': '2024-07-29T07:22:50.949Z',
                    'animal_project_id': 1},
                    # ... more batches
                ],
                'example_images': [{
                    'id': 1,
                    'animal_project_id': 1,
                    'points': '[{"point_id":"82","widthPercent":91.72535211267606,"heightPercent":4.6255506607929515},...]',
                    'title': 'Side View',
                    'last_modified': '2024-07-29T07:25:37.135Z',
                    'path': '/reroute_files/data/animalProjects/project_4/ex_img_project_4__imgID_1.jpg'},
                    # ... more example images
                ],
                'points': [{'id': '1',
                    'animal_project_id': 1,
                    'color': 'white',
                    'name': 'right ear',
                    'animal_project_point_index': 0},
                    # ... more points
                ],
                'joints': [{'id': '30',
                    'point_id': 37,
                    'animal_project_id': 1,
                    'connected_point_id': 28},
                    # ... more joings
                ]
            },
            # ... more projects
        ]}

    def get_project(pid):
        # No side effects; similar result to get_all_projects()
        return {
            "error": False,
            'id': pid,
            'name': 'Text Project 2522336551',
            'created_at': '2024-07-29T07:22:50.750Z',
            'batches': [{'id': 1,
                'name': 'Batch 1',
                'img_count': 0,
                'labeled_img_count': 0,
                'created_at': '2024-07-29T07:22:50.949Z',
                'animal_project_id': pid},
                # ... more batches
            ],
            'example_images': [{
                'id': 1,
                'animal_project_id': pid,
                'points': '[{"point_id":"82","widthPercent":91.72535211267606,"heightPercent":4.6255506607929515},...]',
                'title': 'Side View',
                'last_modified': '2024-07-29T07:25:37.135Z',
                'path': '/reroute_files/data/animalProjects/project_4/ex_img_project_4__imgID_1.jpg'},
                # ... more example images
            ],
            'points': [{'id': '1',
                'animal_project_id': pid,
                'color': 'white',
                'name': 'right ear',
                'animal_project_point_index': 0},
                # ... more points
            ],
            'joints': [{'id': '30',
                'point_id': 37,
                'animal_project_id': pid,
                'connected_point_id': 28},
                # ... more joings
            ]
        }

    def create_project(project_name):
        # Creates a project with the given name (if no such project already exists)

        return {
            'error': False,
            'id': 5,
            'name': project_name,
            'created_at': '2024-07-29T08:27:07.062Z'
        }

    def delete_project(project_id):
        # Deletes project with a given id

        return {
            "error": False
        }

    def rename_project(project_id, new_name):
        # Renames the project with the given id

        return {
            'error': False,
            'id': project_id,
            'name': new_name,
            'created_at': '2024-07-29T08:28:17.460Z'
        }
```

## img_batches.py

We call an image batch a collection of images which belong together (e.g. frames from a video).
Images of batches are the things which get annotated.

```py
def create_batch(project_id, batch_name):
    # Creates a batch with the given name for the project

    return {
        'error': False,
        'batch_id': 5,
        'batch_name': batch_name,
        'img_count': 0,
        'labled_img_count': 0,
        'images': []
    }

def rename_batch(batch_id, new_name):
    # Renames a given batch

    return {
        'error': False,
        'batch_id': batch_id,
        'batch_name': new_name,
        'img_count': 0,
        'labled_img_count': 0,
        'images': []
    }

def delete_batch(batch_id):
    # Deletes a given batch

    return {
        'error': False
    }

def get_batch(batch_id):
    # Gets the data for a batch with a given id

    return {
        'error': False,
        'id': batch_id,
        'name': 'Batch Name',
        'img_count': 0,
        'labeled_img_count': 0,
        'created_at': '2024-07-29T09:00:18.946Z',
        'animal_project_id': 6,
        'images': []
    }

def get_batches(project_id):
    # Gets all batches for a project
    return {
        'error': False,
        'batches': [{
            'id': 6,
            'name': 'Batch Name',
            'img_count': 0,
            'labeled_img_count': 0,
            'created_at': '2024-07-29T09:00:18.946Z',
            'animal_project_id': project_id
        },
        # ... more batches
    ]}

def upload_image_to_img_batch(batch_id, file_path):
    # Upload an image to a batch (for annotation)

    return {
        'error': False,
        'id': '111',
        'batch_id': batch_id,
        'path': '/reroute_files/data/animalProjects/project_7/img_batch_7/1722243791707_Pferd-unklare-Lahmheit-QB8HvhO3Bko_0_00-00-00-00-00-20_0001.jpg', # Path on website
        'index_in_batch': 1,
        'is_annotated': False,
        'should_be_used': True,
        'created_at': '2024-07-29T09:03:11.779Z',
        'points': '[]',
        'last_modified': '2024-07-29T09:03:11.779Z'
    }

def delete_img(img_id):
    # Deletes the image with the id from its batch

    return {
        'error': False
    }

def get_project_id_from_batch_id(bid):
    return {
        'error': False,
        'id': 6
    }
```

## example_image.py

```py

annotations = [
    {
        'point_id': '136',
        'widthPercent': 91.72535211267606,  # Percent of image width the point is placed at
        'heightPercent': 4.6255506607929515 # Percent of image height the point it placed at
    }, {
        'point_id': '137', 
        'widthPercent': 91.54929577464789, 
        'heightPercent': 16.519823788546255
    },
    # ... more points; only those actually visible
]

def set_example_img_title(example_img_id, example_img_title):
    return {
        'error': False,
        'id': example_img_id,
        'animal_project_id': 11,
        'points': json.dumps(annotations) # See above for 'annotations'
        'title': example_img_title,
        'last_modified': '2024-07-29T09:15:17.498Z',
        'path': '/reroute_files/data/animalProjects/project_8/ex_img_project_8__imgID_4.jpg'
        # Website path where to find the image
    }

def get_example_images_for_project(project_id):
    return {
        'error': False,
        'images': [{
            'id': 4,
            'animal_project_id': project_id,
            'points': json.dumps(annotations) # See above for 'annotations'
            'title': 'Front View',
            'last_modified': '2024-07-29T09:15:17.498Z',
            'path': '/reroute_files/data/animalProjects/project_8/ex_img_project_8__imgID_4.jpg'
            # Website path where to find the image
        },
        # ... more images
    ]}

def delete_example_image(example_img_id):
    # Deletes example image from it's project 

    return {
        'error': False
    }

def set_example_img_points(example_img_id, annotations):
    # Set points for example image. For the format of `annotations` see above.

    return {
        'error': False,
        'id': 3,
        'animal_project_id': example_img_id,
        'points': json.dumps(annotations),
        'title': 'Side View',
        'last_modified': '2024-07-29T09:15:17.456Z'
    }

def upload_example_image(project_id, file_path, title):
    # Uplade an example_image from `file_path` with a given title

    return {
        'error': False,
        'id': 3,
        'animal_project_id': project_id,
        'points': '[]',
        'title': title,
        'last_modified': '2024-07-29T09:15:17.456Z'
    }

def get_project_id_from_ex_img_id(iid):
    return {
        'error': False, 
        'id': 8
    }
```

## points_and_joints.py

```py
def get_points_for_project(project_id):
    # Returns the annotatable points for the project

    return {
        'error': False,
        'points': [{
            'id': '1',
            'animal_project_id': project_id,
            'color': 'white',
            'name': 'right ear',
            'animal_project_point_index': 0
        },
        # ... more points
    ]}

def get_joints_for_project(project_id):
    # Returns the joints between annotatable points for the project

    return {
        'error': False,
        'joints': [
            {'id': '2', 'point_id': 1, 'animal_project_id': 1, 'connected_point_id': 2},
            # ... more joints
        ]}

def create_point(project_id, name, color = "white"):
    # Creates a points with a certain color and name for the project
    # Currently, for design purposes, we mostly want white points

    return {
        'error': False,
        'point_id': '163',
        'point_name': name,
        'point_color': color
    }
 
def rename_point(point_id, new_name):
    # Renames a certain point

    return {
        'error': False, 
        'name': new_name,
        'id': point_id
    }

def delete_point(point_id):
    # Deletes point from its project

    return {
        'error': False
    }

def change_point_color(point_id, new_color):
    return {
        'error': False, 
        'color': new_color,
        'id': point_id
    }

def set_point_position(point_id, positon):
    # Sets the index of the point in the array of project points. Has to be a non-negative integer

    return {
        "error": False,
        "animal_project_point_index": position, 
        "id": point_id
    }

def create_joint(point1_id, point2_id):
    # Creates a joint between 2 points

    return {
        'error': False,
        'joint_id': '175'
    }

def change_joint(joint_id, point1_id, point2_id):
    # Changes the endpoints of a joint

    return {
        'error': False,
        'joint_id': joint_id,
        'point1_id': point1_id,
        'point2_id': point2_id
    }

def delete_joint(joint_id):
    return {
        'error': False
    }
```