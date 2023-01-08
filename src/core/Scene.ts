import { Container } from 'pixi.js'

export interface Scene {
    load?(): void | Promise<void>;
}

export abstract class Scene extends Container {
    
    constructor() {
        super();
    }
}

export default Scene;
