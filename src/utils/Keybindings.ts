export interface KeybindingActions {
    repeatLastConfig: () => void;
    closeEverything: () => void;
    trashDraw: () => void;
    updateExtensionHandles: () => void;
}

export function setupKeybindings(actions: KeybindingActions): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        const target = e.target as HTMLElement | null;
        if (
            target &&
            (target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable)
        ) {
            return;
        }

        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            actions.repeatLastConfig();
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