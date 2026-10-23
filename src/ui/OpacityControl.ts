export interface OpacityControlCallbacks {
    onChange: (opacity: number) => void;
}

export class OpacityControl {
    private panelEl: HTMLElement | null;
    private sliderEl: HTMLInputElement | null;

    constructor(callbacks: OpacityControlCallbacks) {
        this.panelEl = document.getElementById('opacity-control-panel');
        this.sliderEl = document.getElementById('opacity-slider') as HTMLInputElement;

        this.isolateEvents();
        this.bindEvents(callbacks);
    }

    private isolateEvents(): void {
        if (!this.panelEl) return;
        ['keydown', 'keyup', 'keypress'].forEach((eventType) => {
            this.panelEl?.addEventListener(eventType, (e) => e.stopPropagation());
        });
    }

    private bindEvents(callbacks: OpacityControlCallbacks): void {
        this.sliderEl?.addEventListener('input', () => {
            const val = parseFloat(this.sliderEl?.value || '1');
            if (!isNaN(val)) {
                callbacks.onChange(val);
            }
        });
    }
}