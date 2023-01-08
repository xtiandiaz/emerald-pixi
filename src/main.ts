import { Graphics, Ticker } from 'pixi.js';
import App from './core/App'

const app = new App();

const circle = new Graphics()
    .beginFill(0xFFFFFF)
    .drawCircle(30, 30, 30)
    .endFill()
    
app.stage.addChild(circle);

let elapsed = 0.0

Ticker.shared.add((delta) => {
    elapsed += delta
    circle.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0
})
