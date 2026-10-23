import { SINGLE_POINT_TYPES, type PointInfrastructureType } from '../config/infrastructure';
import { POINT_INFRASTRUCTURE_SPECS, HEX_COLOR_REGEX } from '../config/infrastructure';

export interface PointCreationPanelCallbacks {
    onConfirm: (config: { infrastructureType: PointInfrastructureType; color: string; widthMeters: number, rotation: number}) => void;
}

export class PointCreationPanel {
    private panelEl: HTMLElement | null;
    private inputType: HTMLSelectElement | null;
    private inputColorPicker: HTMLInputElement | null;
    private inputColorHex: HTMLInputElement | null;
    private inputWidth: HTMLInputElement | null;

    private lastConfig = {
        infrastructureType: 'arrow_forward' as PointInfrastructureType,
        color: POINT_INFRASTRUCTURE_SPECS.arrow_forward.color,
        widthMeters: POINT_INFRASTRUCTURE_SPECS.arrow_forward.widthMeters,
        rotation: 0,
    };

    constructor(callbacks: PointCreationPanelCallbacks) {
        this.panelEl = document.getElementById('single-point-creation-panel');
        this.inputType = document.getElementById('single-point-panel-type') as HTMLSelectElement;
        this.inputColorPicker = document.getElementById('single-point-panel-color-picker') as HTMLInputElement;
        this.inputColorHex = document.getElementById('single-point-panel-color-hex') as HTMLInputElement;
        this.inputWidth = document.getElementById('single-point-panel-width') as HTMLInputElement;


        this.populateSelectOptions();
        this.isolateEvents();
        this.bindEvents(callbacks);
    }

    private isolateEvents(): void {
        if (!this.panelEl) return;
        ['keydown', 'keyup', 'keypress'].forEach((eventType) => {
            this.panelEl?.addEventListener(eventType, (e) => e.stopPropagation());
        });
    }

    private populateSelectOptions(): void {
        if (!this.inputType) return;
        this.inputType.innerHTML = '';
        SINGLE_POINT_TYPES.forEach((type) => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            this.inputType?.appendChild(opt);
        });
    }

    private populateDefaults(type: PointInfrastructureType): void {
        const spec = POINT_INFRASTRUCTURE_SPECS[type];
        if (this.inputColorHex) this.inputColorHex.value = spec.color;
        if (this.inputColorPicker) this.inputColorPicker.value = spec.color;
        if (this.inputWidth) this.inputWidth.value = spec.widthMeters.toString();
    }

    private populateLastConfig(): void {
        if (this.inputType) this.inputType.value = this.lastConfig.infrastructureType;
        if (this.inputColorHex) this.inputColorHex.value = this.lastConfig.color;
        if (this.inputColorPicker) this.inputColorPicker.value = this.lastConfig.color;
        if (this.inputWidth) this.inputWidth.value = this.lastConfig.widthMeters.toString();
    }

    private bindEvents(callbacks: PointCreationPanelCallbacks): void {
        const btnNewPoint = document.getElementById('btn-new-single-point');
        const btnCancel = document.getElementById('single-point-panel-btn-cancel');
        const btnConfirm = document.getElementById('single-point-panel-btn-confirm');

        btnNewPoint?.addEventListener('click', () => {
            if (!this.panelEl) return;
            const isVisible = this.panelEl.style.display === 'block';
            if (isVisible) {
                this.panelEl.style.display = 'none';
            } else {
                this.populateLastConfig();
                this.panelEl.style.display = 'block';
            }
        });

        this.inputType?.addEventListener('change', () => {
            if (this.inputType) {
                this.populateDefaults(this.inputType.value as PointInfrastructureType);
            }
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
            const type = (this.inputType?.value as PointInfrastructureType) || 'arrow_forward';
            const color = this.inputColorHex?.value || POINT_INFRASTRUCTURE_SPECS[type].color;
            const widthMeters = parseFloat(this.inputWidth?.value || '1.5') || 1.5;

            this.lastConfig = { infrastructureType: type, color, widthMeters, rotation: 0 };
            callbacks.onConfirm({ infrastructureType: type, color, widthMeters, rotation: 0 });
            if (this.panelEl) this.panelEl.style.display = 'none';
        });
    }

    public close(): void {
        if (this.panelEl) this.panelEl.style.display = 'none';
    }
}