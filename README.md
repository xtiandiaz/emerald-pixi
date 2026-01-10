# Emerald

A simple game engine rendered with [PixiJS](https://github.com/pixijs/pixijs/) and abiding by the basic concepts of an ECS (Entity Component System) architecture.

## To-dos

### General

- Add randomness utils (from Tungsten)
- Add probability utils

### Physics

- Calculate mass and inertia for polygons of any number of vertices
- Enable tagless collider sensor and use to detect gone bodies to remove

### Input

- Create an action-control map interface
- Add Input Signal
- Emit signals on corresponding input
- Add onInput optional method in Systems for them to handle

### Camera

- Add interface to zoom and pan on world by means of a 'camera' object
- Add system to focus camera on targets
