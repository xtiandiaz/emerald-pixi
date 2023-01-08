import Keyboard from "./Keyboard"

class Input {
    
    public static shared = new Input()
    
    public bind(key: Keyboard.Key, action: Input.Action) {
        
    }
    
    // Private

    private constructor() {
        
    }
}

namespace Input {
    
    export enum Action {
        Move,
        Jump,
        Fire
    }
    
    // Private
}

export default Input
