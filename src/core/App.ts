import { Application } from 'pixi.js'

export default class App extends Application {
    
    constructor() {
        super({
            view: document.querySelector<HTMLCanvasElement>("#app"),
            resizeTo: window,
            antialias: true,
            powerPreference: "high-performance",
            autoDensity: true,
            resolution: window.devicePixelRatio
        })
    }
}
