namespace Keyboard {
    
    export enum Key {
        Up, 
        Right, 
        Down,
        Left,
        W,
        D,
        S,
        A,
        Shift,
        Space
    }
    
    interface DirectionalKeySet {
        up: Key
        right: Key
        down: Key
        left: Key
    }
}

export default Keyboard
