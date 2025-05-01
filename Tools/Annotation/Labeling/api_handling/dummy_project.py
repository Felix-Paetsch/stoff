from api_wrapper.main import init
from api_wrapper.projects import *
from pprint import pprint
from api_wrapper.img_batches import *
from api_wrapper.example_image import *
from api_wrapper.points_and_joints import *
import random

init("../data/config.json")

project = create_project("Dummy" + ''.join(random.choices('0123456789', k=10)))
p1 = create_point(project["id"], "Mouth")
p2 = create_point(project["id"], "Ears")
p3 = create_point(project["id"], "Shoulder")
p4 = create_point(project["id"], "Withers")
create_joint(p1["point_id"], p2["point_id"])
create_joint(p1["point_id"], p3["point_id"])
create_joint(p3["point_id"], p2["point_id"])
create_joint(p3["point_id"], p4["point_id"])

ex_img = upload_example_image(project["id"],  "./dummy_data/horse_project/ex_img/view1.jpg", "View 1")
set_example_img_title(ex_img["id"], "Dummy ex img")
set_example_img_points(ex_img["id"], [
    {
        "point_id": p1["point_id"],
        "widthPercent": 55,
        "heightPercent": 30
    },
    {
        "point_id": p2["point_id"],
        "widthPercent": 75,
        "heightPercent": 20
    }
])

ex_img = upload_example_image(project["id"],  "./dummy_data/horse_project/ex_img/view2.jpg", "View 2")
set_example_img_title(ex_img["id"], "Dummy ex img")
set_example_img_points(ex_img["id"], [
    {
        "point_id": p1["point_id"],
        "widthPercent": 35,
        "heightPercent": 70
    },
    {
        "point_id": p2["point_id"],
        "widthPercent": 25,
        "heightPercent": 80
    }
])

img_batch_1 = create_batch(project["id"], "Batch 1")
img_batch_2 = create_batch(project["id"], "Batch 2")

upload_image_to_img_batch(img_batch_1["batch_id"], "./dummy_data/horse_project/horse1.jpg")
upload_image_to_img_batch(img_batch_1["batch_id"], "./dummy_data/horse_project/horse2.jpg")
upload_image_to_img_batch(img_batch_1["batch_id"], "./dummy_data/horse_project/horse3.jpg")
upload_image_to_img_batch(img_batch_1["batch_id"], "./dummy_data/horse_project/horse4.jpg")

upload_image_to_img_batch(img_batch_2["batch_id"], "./dummy_data/horse_project/horse1.jpg")
upload_image_to_img_batch(img_batch_2["batch_id"], "./dummy_data/horse_project/horse2.jpg")