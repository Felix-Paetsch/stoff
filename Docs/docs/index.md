# StoffLib

StoffLib is a project to create sewing patterns procedually programatically. To learn more visit our [git repository.](#)

You can see a [demo here.](#)

## Project structure

This project is a monorepo and contains diffrent folders for different workflows. Some of which can also be used in a stand-alone way:

* `StoffLib` - This is the main toolbox for developing a sewing pattern. It provides you with a `Sketch()` object which is like a canvas you can construct lines and points on.
* `Patterns` - This is the place to develop your sewing patterns in. Currently an effort to organize it is on the way.
* `Tools` - This directory contains many things which may or may not be useful to you, but don't directly impact sewing pattern construction 

We've build an environment to aid you during developing new patterns in `DevServer.` See [commands](#commands) for more.

## Set up

The only necessary requirement are [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). Once you have installed it, open the root directory of this folder and run `npm install`.

For certain functionalities you also need the following:

* [MkDocs-Material](https://squidfunk.github.io/mkdocs-material/getting-started/) - For rendering the documentation (Python based)
* [FFmpeg](https://www.ffmpeg.org/download.html) - For video and animation creationg

## Commands

From the root directory of this project you can run the following commands to start developing:

* `npm run dev` - Start the [pattern development enviroment](/StoffLib/introduction)
* `npm run measure` - Run the [measurement tool](/Tools/measurements) to collect body measurements of different people
* `npm run docs_build` - Compile the documentation