# Annotation Keypoints

If you want to continue developing this project here is a small head start.

## Technology

For the webeserver I use [Express.js](https://expressjs.com/) and as a templating engine [EJS](https://ejs.co/).

You will notice that in the frontend there are 2 different styles so to speak. One from H2D2 using swiper and build CSS while I stayed more with plain CSS/JS as that was faster. Luckily most JS you will touch only have the later style. And if you have to do hard work because of compatibility issues odds are there is a better solution (maybe already implemented.)

## Far fetched features might interesting to implement

- A user system with proper login and tracking
- Better help with telling you where a keypoint belongs:
    - Annotate Skeletons for the help section
    - A text for each keypoint
    - Mirror example images if needed
    - Enlarge exampple images on Hover/Keypress/...
    - Allow for hidden points in the example images, perhaps with a toggle
- Interpolate annotations when working with videos
- Visual way to interact with the database
- User can have their own config with keybindings/defaults settings/...
- Improve on the Python API interface:
    - Better error handling (e.g retry when recieving a http error)
    - Improve convenience
    - Write more scripts/notebooks
    - Get uploading images via a .zip to work



## Security

Currently we do some bad practices regarding security which would lead to trouble if:
- This repository becomes available to bad actors
- Users may actively try to cause harm

The "problems" coming to mind are:

- The password for accessing the website is stores as plain text and in the commit history
- User data is not validated
- User interaction is not tracked (e.g. to identify who caused the problem)

A bad actor accessing the website could do the following things:

- Delete/modify all image and annotation data in the database
- Crash the server

He couldnt:

- Modify the backups
- Get access to the machine

He should not be able to inject JS, but I haven't specifically looked to mitigate that. If it were possible, the fix should be easy and no systemic flaw.

## Useful commands


These are commands I regularly use. Maybe you can adapt them to your usecase:

`ssh -p 22 felixp@92.205.29.54`

```ps
for %f in (D:\animalwatch\common\annotationKeypoints\*) do (
    pscp -P 22 -r -pw <password> "%f" felixp@92.205.29.54:/home/felixp/annotationKeypoints/
)
```

`jupyter notebook --no-browser --ip="92.205.29.54"`

```ps
scp -r "D:\animalwatch\common\annotationKeypoints\public" felixp@92.205.29.54:/home/felixp/annotationKeypoints/public
```

F44ow93#9I4$
