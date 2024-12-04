# Lijuan

The goal of this project is to create a starting enviroment for any Server Based software project I might want to write. 
It's aim is to have many modular components like a website, database and discord bot wich can interact with each other via an event manager.

Each module is expected to have a `hook.js` file which exports a function

```js
export default (event_manager) => {
    console.log("Hi");
}
```

## Moduels
The different modules ...

descr, dependency

## Modules todo
- JSON database
- error logging for each different part

## Todo:
Make .json files visible/give a nice template for others
.gitkeep files in the correct dirs

Make features like scss support optional
Make flow to initialize project