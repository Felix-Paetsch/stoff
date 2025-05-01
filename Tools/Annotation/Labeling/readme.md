# Annotation Keypoints

Annotation Keypoints is a tool for annotating keypoints in image-series.

## Set Up

1. Install [Node JS](https://nodejs.org/en) on your machine.
2. Ensure that [Python3](https://www.anaconda.com/download) runs in your console.
3. Install [PostgreSQL](https://www.postgresql.org/)
4. Run `npm install` in the directory of this project
5. Make sure to (create and) empty the following folders:
    - data/animalProjects
    - data/temp
6. Modify (or create) the config files, see [here](#config)

Assuming you want to set up the project without any preexisting data:

7. Initialize the database by running `npm run __init_db` from the project directory

If you want to start from a [backup](#backups) instead just:

7. Run `npm run restore`


8. Activate the server:
    - `npm run start`: Starts the server
    - `npm run dev`: Starts the server in dev-mode (using [nodemon](https://www.npmjs.com/package/nodemon))
    - `npm run background`: Starts the server in the background; used for deployment, Linux specific
9. Tests its live by visiting the specified port.
10. Create new projects [see here](#python-interface)

## Commands
You can run the following commands from your console from the root directory:

- `npm run start`: Starts the server
- `npm run dev`: Starts the development server
- `npm run background`: Starts the server in the background; used for deployment

- `npm run backup`: Creates a backup of the currrent Database State, see [here](#backups)
- `npm run restore`: Restores the database state to the latest backup. Overwrites current state!
- `npm run use_backup`: Uploads all project from the latest backup. Errors if a project with the same name as one in the backup already existed.

- `npm run dummy_project`: Creates a new dummy project.
- `__init_db`: Resets the database. Make a backup beforehand!

## Config
You find the config files at `data/config.json` and `database_handling/db_config.json`.

### `data/config.json`

The file looks something like this:

```js
{
    "json_limit": "50mb",
    "port": 3005,
    "website_path": "http://localhost:3005",
    "auth_pw": "BrombeereNotFound",
    "auth": "Auth",

    "catch_errors": false,
    "error_logging": false,

    "single_person_editing_timeout_min": 30,
    "enable_edit_guard": false
}
```

The keys do the following:

- `json_limit`: When making requests to the server there is a data limit. Since with each request we send, we send all annotations for the current folder they get quite large. Make this bigger if you run into truncation issues with the send data.
- `port`: The port the server should run on
- `website_path`: Where to reach the website. Make sure that it doesn't include a slash at the end.
- `auth`: The username for authentication
- `auth_pw`: The password for authentication

- `catch_errors`: There are several places with catch blocks or asserts. This should be most likely turned on for debugging and of when live.
- `error_logging`: Whether to log errors (assuming we don't crash.) Errors will be logged to the `logging` table.

- `single_person_editing_timeout_min`: Only one person at a time can edit images in a batch (folder.) After some time being inactive they automatically get thrown out.
- `enable_edit_guard`: Usually users have to give a name when editing a batch and noone else can edit that same batch. With this flag that can be circumvented. Usefull for development.

### `database_handling/db_config.json`

The file looks something like this:

```js
{
    "catch_errors": false,
    "pg_user": "postgres",
    "pg_port": 5432,
    "pg_host": "localhost",
    "pg_password": "pw",
    "pg_database": "annotation_db",
    "pg_ssl": false,
    "pg_main_database": "postgres"
}
```

Most keys are self explanatory. The others do the following:

- `pg_ssl`: Whether to connect over SSL. Depending on your platform sometimes that is required
- `pg_database`: The database name for the annotation data.
- `pg_main_database`: The database from which to create/remove the annotation database.

### Tools

For dealing with these configs, especially since they are server-specific, i've written a tool to automate the config change.

To use this, for each set of configs you need create an entry in `scripts/toggle_mode_config.json`:

```js
{
    "predator": [{
        "file": "../data/config.json",
        "data": {
            "json_limit": "50mb",
            "port": 3005,
            "website_path": "http://localhost:3005",
            "auth_pw": "BrombeereNotFound",
            "auth": "Auth",

            "catch_errors": false,
            "error_logging": false,

            "single_person_editing_timeout_min": 30,
            "enable_edit_guard": false
        }
    },{
        "file": "../database_handling/db_config.json",
        "data": {
            "catch_errors": false,
            "pg_user": "postgres",
            "pg_port": 5432,
            "pg_host": "localhost",
            "pg_password": "pw",
            "pg_database": "annotation_db",
            "pg_ssl": false,
            "pg_main_database": "postgres"
        }
    }, {
        "file": "../public/css/h2d2/main.css", 
        "replacement": "../public/css/h2d2/h2d2_main.css"
    }]
}
```

To activate a specifc config, run from the root directory: `cd scripts && python to_dev.py <key>` as in `cd scripts && python to_dev.py predator`

Note that here we additionally replace a css file as anotherone was more convenient during development. (`../public/css/h2d2/h2d2_main_modified_wo_screen_size_error.css`)

## Database
You can see all tables and methods of the database at `database_handling` inside the SQL files. Specifically:

- `tables.sql`
- `functions.sql`
- `static_get_functions.sql`

There are the following scripts associated to directly dealing with the database. Unless otherwise stated you need to execute them from the root folder aswell. Maybe before trying these things create a [backup](#backups).

### `init_db.js`
Sets up the database by deleting the exisiting one (if there was one), creating a new one and then executing the `.sql` files.

### `migration.js`
Execute the SQL code inside `migration.sql`.

### `test.js`
This is used to run queries against the database to see their results immediately. Split `test.sql` up into several distinct queries using `-- sep --` like so:

```sql
SELECT 3;

-- sep --

SELECT 4;

-- real comment --
```

Then run `npm run test.js`. It will consecutively execute all queries and log the results to the console.

## Backups
The database has a [python interface](#python-interface) to interact with it. One abstraction from this implemented is that of a backup. Before doing anything with the database via that interface you most likely want to do a backup using the following methods. Note that backups cannot deleted by my code so you only need to worry about manually deleting them e.g with `rm -r`.


### How a backup looks likes
Backups are placed into `data/backups` when made. Their folder name looks like `backup_yyyy-mm-dd hhh-mmm-sss <timestamp>`. A backup directory has the following file structure:

```
> project_<project_id>
    > batch_<batch_id>
        <img_uplodad_timestamp>_<img_original_name>
        batch_data.json
    > example_images
        ex_img_project_<project_id>__imgID_<img_id>.<jpg || png>
    project_meta_data.json
```

Of course there are usually more projects, batches and images in the corresponding places. The json files look as follows:

```js
// project_meta_data.json

{
    "id": 1,
    "name": "Aras",
    "created_at": "2024-10-28T13:35:00.194Z",
    "batches": [
        {
            "id": 6,
            "name": "Aras_annotation_Einzelbilder-dir2",
            "img_count": 35,
            "labeled_img_count": 0,
            "created_at": "2024-10-28T13:44:42.512Z",
            "animal_project_id": 1
        }, ...
    ],
    "example_images": [
        {
            "id": 1,
            "animal_project_id": 1,
            "points": "[{\"point_id\":\"8\",\"widthPercent\":60.83333333333333,\"heightPercent\":67.77777777777779},{\"point_id\":\"10\",\"widthPercent\":51.66666666666667,\"heightPercent\":86.66666666666667}",
            "title": "Image 1",
            "last_modified": "2024-10-28T13:36:12.319Z",
            "path": "/reroute_files/data/animalProjects/project_1/ex_img_project_1__imgID_1.png"
        }, ...
    ],
    "points": [
        {
            "id": "8",
            "animal_project_id": 1,
            "color": "white",
            "name": "bottom keel",
            "animal_project_point_index": 0
        },
        {
            "id": "10",
            "animal_project_id": 1,
            "color": "white",
            "name": "tail end",
            "animal_project_point_index": 0
        }, ...
    ],
    "joints": [
        {
            "id": "11",
            "point_id": 8,
            "animal_project_id": 1,
            "connected_point_id": 1
        }, ...
    ]
}
```

Note that the points for the example images are escaped json objects. That is because they are stored as text in the db and could be - via bad user input - not be valid json.

```js
// batch_data.json

{
    "id": 1,
    "name": "00Aras_Spielwiese_Einzelbilder",
    "img_count": 35,
    "labeled_img_count": 0,
    "created_at": "2024-10-28T13:40:48.000Z",
    "animal_project_id": 1,
    "images": [
        {
            "id": "1",
            "batch_id": 1,
            "path": "/reroute_files/data/animalProjects/project_1/img_batch_1/1730122848038_000033.jpg",
            "index_in_batch": 1,
            "is_annotated": false,
            "should_be_used": true,
            "created_at": "2024-10-28T13:40:48.057Z",
            "points": "[{\"point_id\":\"59\",\"state\":\"visible\",\"widthPercent\":35.65022421524663,\"heightPercent\":38.21548821548821}",
            "last_modified": "2024-10-28T13:40:48.057Z"
        }, ...
    ]
}
```

```js
// example_image_data.json

[
    {
        "id": 1,
        "animal_project_id": 1,
        "points": "[{\"point_id\":\"1\",\"widthPercent\":50.83333333333333,\"heightPercent\":23.333333333333332},{\"point_id\":\"2\",\"widthPercent\":50.55555555555556,\"heightPercent\":13.61111111111111},{\"point_id\":\"3\",\"widthPercent\":60.83333333333333,\"heightPercent\":13.055555555555557},{\"point_id\":\"5\",\"widthPercent\":72.77777777777777,\"heightPercent\":34.72222222222222},{\"point_id\":\"6\",\"widthPercent\":48.05555555555556,\"heightPercent\":36.388888888888886},{\"point_id\":\"7\",\"widthPercent\":63.888888888888886,\"heightPercent\":41.66666666666667},{\"point_id\":\"8\",\"widthPercent\":60.83333333333333,\"heightPercent\":67.77777777777779},{\"point_id\":\"10\",\"widthPercent\":51.66666666666667,\"heightPercent\":86.66666666666667}]",
        "title": "Image 1",
        "last_modified": "2024-10-28T13:36:12.319Z",
        "path": "/reroute_files/data/animalProjects/project_1/ex_img_project_1__imgID_1.png"
    }, ...
]
```

Note that if you want to deduce the filename in the backup from this data, just split `"path"` at `"/"`. Note that all points for example images currently have to be visible (compare next)

In general (valid) annotation data for an image looks like:

```js
[
    {
        "point_id":"59",
        "state": "visible",
        "widthPercent":35.65022421524663,
        "heightPercent":38.215488215488215
    }, ...
]
```

where `point_id` is unique to a keypoint across projects. `widthPercent` and `heightPercent` go between `0` and `100` and tell you how many percent from the left and top of the image size the point is located.
These are the possible states a point can have:

- `visible`: It can be seen in the image
- `hidden`: It is annotated but hidden behin something in the image
- `skipped`: The point is annotated as not in the image. Any position data found with this state is meaningless (but present for convenience of the annotator.) 
- `unannotated`: The point is not annotated. If a point is not present in the annotation data for an image (which can happen) it also means the point is not annotated.

### Making and restoring backups

In the following I assume you have python available in your terminal under the name `python`. If it has another name, then look into `package.json` and modify the scripts accordingly. 

To make a backup, run `npm run backup` from the root directory. It will place the backup into `/data/backups`, see [the last section.](#backups)

To restore the latest backup, run `npm run restore`. Note that this overwrites any currently existing data in the database! Restoring from a backup like this can be used to initialize the project when moving servers or alike. The server has to be running for this to work (but shouldn't be accessed via the browser for that duration). Note that currently only the latest backup can be restored like this. If that bothers you, you can modify `api_handling/backup_management/upload_everything.py` quite easily.

Both making and restoring backups can in theory fail. Maybe something is wrong with the file system of the backup was corrupted. You see whether it worked by the console output.


# Python interface
See `api handling/docs.md`. If you just want to upload a new project/image batch it might suffices for you to look at `api_handling/Create Project.ipynb`. In both cases, although possible to interact remotely as everything works over http, you are highly encuraged to run the scripts from the server the website is running on.

You can access jupyter notebook remotely by running this command:

`jupyter notebook --no-browser --ip="92.205.29.54"`

# Hints for further development
See `further development.md`. It tells you a bit what technology I use and what future tasks might be. Also it includes some console comands I always copy around.