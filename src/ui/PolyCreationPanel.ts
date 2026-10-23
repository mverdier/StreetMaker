import type { PolygonInfrastructureType } from '../config/infrastructure';
import { POLYGON_INFRASTRUCTURE_SPECS, HEX_COLOR_REGEX } from '../config/infrastructure';

export interface PolyCreationPanelCallbacks {
    onConfirm: (config: { infrastructureType: PolygonInfrastructureType; color: string, smooth: boolean }) => void;
}

export class PolyCreationPanel {
    private panelEl: HTMLElement | null;
    private inputType: HTMLSelectElement | null;
    private inputColorPicker: HTMLInputElement | null;
    private inputColorHex: HTMLInputElement | null;
    private inputSmooth: HTMLInputElement | null;

    constructor(callbacks: PolyCreationPanelCallbacks) {
        this.panelEl = document.getElementById('poly-creation-panel');
        this.inputType = document.getElementById('poly-panel-type') as HTMLSelectElement;
        this.inputColorPicker = document.getElementById('poly-panel-color-picker') as HTMLInputElement;
        this.inputColorHex = document.getElementById('poly-panel-color-hex') as HTMLInputElement;
        this.inputSmooth = document.getElementById('poly-panel-smooth') as HTMLInputElement;

        this.isolateEvents();
        this.bindEvents(callbacks);
    }

    private isolateEvents(): void {
        if (!this.panelEl) return;
        ['keydown', 'keyup', 'keypress'].forEach((eventType) => {
            this.panelEl?.addEventListener(eventType, (e) => e.stopPropagation());
        });
    }

    private populateDefaults(type: PolygonInfrastructureType): void {
        const spec = POLYGON_INFRASTRUCTURE_SPECS[type];
        if (this.inputColorHex) this.inputColorHex.value = spec.color;
        if (this.inputColorPicker) this.inputColorPicker.value = spec.color;
        if (this.inputSmooth) this.inputSmooth.checked = spec.smooth;
    }

    private bindEvents(callbacks: PolyCreationPanelCallbacks): void {
        const btnNewPoly = document.getElementById('btn-new-poly');
        const btnCancel = document.getElementById('poly-panel-btn-cancel');
        const btnConfirm = document.getElementById('poly-panel-btn-confirm');

        btnNewPoly?.addEventListener('click', () => {
            if (!this.panelEl) return;

            const isVisible = this.panelEl.style.display === 'block';
            if (isVisible) {
                this.panelEl.style.display = 'none';
            } else {
                if (this.inputType) this.inputType.value = 'sidewalk';
                this.populateDefaults('sidewalk');
                this.panelEl.style.display = 'block';
            }
        });

        this.inputType?.addEventListener('change', () => {
            if (this.inputType) this.populateDefaults(this.inputType.value as PolygonInfrastructureType);
        });

        this.inputColorPicker?.addEventListener('input', () => {
            if (this.inputColorHex && this.inputColorPicker) {
                this.inputColorHex.value = this.inputColorPicker.value;
            }
        });

        this.inputColorHex?.addEventListener('input', () => {
            if (this.inputColorHex && this.inputColorPicker && HEX_COLOR_REGEX.test(this.inputColorHex.value)) {
                this.inputColorPicker.value = this.inputColorHex.value;
            }
        });

        btnCancel?.addEventListener('click', () => {
            if (this.panelEl) this.panelEl.style.display = 'none';
        });

        btnConfirm?.addEventListener('click', () => {
            const type = (this.inputType?.value as PolygonInfrastructureType) || 'sidewalk';
            const color = this.inputColorHex?.value || POLYGON_INFRASTRUCTURE_SPECS[type].color;
            const smooth = this.inputSmooth?.checked || false;

            callbacks.onConfirm({ infrastructureType: type, color, smooth });
            if (this.panelEl) this.panelEl.style.display = 'none';
        });
    }

    public close(): void {
        if (this.panelEl) this.panelEl.style.display = 'none';
    }
}