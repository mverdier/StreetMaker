import { type LineInfrastructureType } from '../config/infrastructure';

export interface KeybindingActions {
    startDrawingRoad: (type: LineInfrastructureType) => void;
    closeEverything: () => void;
    trashDraw: () => void;
    updateExtensionHandles: () => void;
}

export function setupKeybindings(actions: KeybindingActions): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'l' || e.key === 'L') {
            actions.startDrawingRoad('bicycle_path');
        }
        if (e.key === 'r' || e.key === 'R') {
            actions.startDrawingRoad('roadway');
        }
        if (e.key === 'Escape') {
            actions.closeEverything();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            actions.trashDraw();
            actions.updateExtensionHandles();
            actions.closeEverything();
        }
    });
}