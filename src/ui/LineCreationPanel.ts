import {type LineInfrastructureType, MARKING_TYPES, LINE_INFRASTRUCTURE_SPECS, HEX_COLOR_REGEX } from '../config/infrastructure';

export interface LineCreationPanelOptions {
    title?: string;
    allowedTypes: LineInfrastructureType[];
    triggerButtonId: string;
    onConfirm: (config: { infrastructureType: LineInfrastructureType; color: string; widthMeters: number; isDouble: boolean, smooth: boolean }) => void;
    onClear?: () => void;
}

export class LineCreationPanel {
    private panelEl: HTMLElement | null;
    private inputType: HTMLSelectElement | null;
    private inputWidth: HTMLInputElement | null;
    private inputColorPicker: HTMLInputElement | null;
    private inputColorHex: HTMLInputElement | null;
    private inputDoubleTrack: HTMLInputElement | null;
    private doubleContainer: HTMLElement | null;
    private inputSmooth: HTMLInputElement | null;

    private allowedTypes: LineInfrastructureType[];
    private triggerButtonId: string;
    private callbacks: {
        onConfirm: (config: { infrastructureType: LineInfrastructureType; color: string; widthMeters: number; isDouble: boolean; smooth: boolean }) => void;
        onClear?: () => void;
    };

    // Track the last used configuration independently for each panel instance
    private lastConfig: {
        infrastructureType: LineInfrastructureType;
        widthMeters: number;
        color: string;
        isDouble: boolean;
        smooth: boolean;
    };

    constructor(options: LineCreationPanelOptions) {
        this.allowedTypes = options.allowedTypes;
        this.triggerButtonId = options.triggerButtonId;
        this.callbacks = { onConfirm: options.onConfirm, onClear: options.onClear };

        const defaultType = this.allowedTypes[0] || 'bicycle_path';
        const defaultSpec = LINE_INFRASTRUCTURE_SPECS[defaultType];

        this.lastConfig = {
            infrastructureType: defaultType,
            widthMeters: defaultSpec.widthMeters,
            color: defaultSpec.color,
            isDouble: defaultSpec.isDouble,
            smooth: defaultSpec.smooth,
        };

        this.panelEl = document.getElementById('line-creation-panel');
        this.inputType = document.getElementById('panel-type') as HTMLSelectElement;
        this.inputWidth = document.getElementById('panel-width') as HTMLInputElement;
        this.inputColorPicker = document.getElementById('panel-color-picker') as HTMLInputElement;
        this.inputColorHex = document.getElementById('panel-color-hex') as HTMLInputElement;
        this.inputDoubleTrack = document.getElementById('panel-double') as HTMLInputElement;
        this.inputSmooth = document.getElementById('panel-smooth') as HTMLInputElement;

        this.doubleContainer = this.inputDoubleTrack?.closest('.panel-row, div') || this.inputDoubleTrack?.parentElement || null;

        this.isolateEvents();
        this.bindEvents();
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
        this.allowedTypes.forEach((type) => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            this.inputType?.appendChild(option);
        });
    }

    private updateDoubleVisibility(type: LineInfrastructureType): void {
        if (this.doubleContainer) {
            this.doubleContainer.style.display = MARKING_TYPES.includes(type) ? 'none' : '';
        }
    }

    private populateDefaults(type: LineInfrastructureType): void {
        const spec = LINE_INFRASTRUCTURE_SPECS[type];
        if (this.inputWidth) this.inputWidth.value = spec.widthMeters.toString();
        if (this.inputColorHex) this.inputColorHex.value = spec.color;
        if (this.inputColorPicker) this.inputColorPicker.value = spec.color;
        if (this.inputDoubleTrack) this.inputDoubleTrack.checked = spec.isDouble;
        if (this.inputSmooth) this.inputSmooth.checked = spec.smooth;
        this.updateDoubleVisibility(type);
    }

    private populateLastConfig(): void {
        this.populateSelectOptions();
        if (this.inputType) this.inputType.value = this.lastConfig.infrastructureType;
        if (this.inputWidth) this.inputWidth.value = this.lastConfig.widthMeters.toString();
        if (this.inputColorHex) this.inputColorHex.value = this.lastConfig.color;
        if (this.inputColorPicker) this.inputColorPicker.value = this.lastConfig.color;
        if (this.inputDoubleTrack) this.inputDoubleTrack.checked = this.lastConfig.isDouble;
        if (this.inputSmooth) this.inputSmooth.checked = this.lastConfig.smooth;
        this.updateDoubleVisibility(this.lastConfig.infrastructureType);
    }

    private bindEvents(): void {
        const triggerBtn = document.getElementById(this.triggerButtonId);
        const btnCancel = document.getElementById('panel-btn-cancel');
        const btnConfirm = document.getElementById('panel-btn-confirm');

        triggerBtn?.addEventListener('click', () => {
            if (!this.panelEl) return;

            const isVisible = this.panelEl.style.display === 'block';
            if (isVisible && this.panelEl.dataset.activeTrigger === this.triggerButtonId) {
                this.panelEl.style.display = 'none';
                delete this.panelEl.dataset.activeTrigger;
            } else {
                this.populateLastConfig();
                this.panelEl.style.display = 'block';
                this.panelEl.dataset.activeTrigger = this.triggerButtonId;
            }
        });

        this.inputType?.addEventListener('change', () => {
            if (this.panelEl?.dataset.activeTrigger === this.triggerButtonId && this.inputType) {
                const type = this.inputType.value as LineInfrastructureType;
                this.populateDefaults(type);
            }
        });

        this.inputDoubleTrack?.addEventListener('change', () => {
            if (this.panelEl?.dataset.activeTrigger === this.triggerButtonId) {
                if (this.inputWidth && this.inputDoubleTrack) {
                    const width = parseFloat(this.inputWidth?.value);
                    if (!isNaN(width)) {
                        if (this.inputDoubleTrack?.checked) {
                            this.inputWidth.value = (width * 2).toString();
                        } else {
                            this.inputWidth.value = (width / 2).toString();
                        }
                    }
                }
            }
        });

        this.inputColorPicker?.addEventListener('input', () => {
            if (this.panelEl?.dataset.activeTrigger === this.triggerButtonId) {
                if (this.inputColorHex && this.inputColorPicker) {
                    this.inputColorHex.value = this.inputColorPicker.value;
                }
            }
        });

        this.inputColorHex?.addEventListener('input', () => {
            if (this.panelEl?.dataset.activeTrigger === this.triggerButtonId) {
                if (this.inputColorHex && this.inputColorPicker && HEX_COLOR_REGEX.test(this.inputColorHex.value)) {
                    this.inputColorPicker.value = this.inputColorHex.value;
                }
            }
        });

        btnCancel?.addEventListener('click', () => {
            if (this.panelEl && this.panelEl.dataset.activeTrigger === this.triggerButtonId) {
                this.panelEl.style.display = 'none';
                delete this.panelEl.dataset.activeTrigger;
            }
        });

        btnConfirm?.addEventListener('click', () => {
            if (this.panelEl?.dataset.activeTrigger === this.triggerButtonId) {
                const type = (this.inputType?.value as LineInfrastructureType) || this.allowedTypes[0];
                const width = parseFloat(this.inputWidth?.value || '') || LINE_INFRASTRUCTURE_SPECS[type].widthMeters;
                const color = this.inputColorHex?.value || LINE_INFRASTRUCTURE_SPECS[type].color;
                const isDouble = MARKING_TYPES.includes(type) ? false : (this.inputDoubleTrack ? this.inputDoubleTrack.checked : false);
                const smooth = this.inputSmooth ? this.inputSmooth.checked : LINE_INFRASTRUCTURE_SPECS[type].smooth;

                this.lastConfig = {
                    infrastructureType: type,
                    widthMeters: width,
                    color,
                    isDouble,
                    smooth,
                };

                this.callbacks.onConfirm({ infrastructureType: type, color, widthMeters: width, isDouble, smooth });
                this.panelEl.style.display = 'none';
                delete this.panelEl.dataset.activeTrigger;
            }
        });
    }

    public close(): void {
        if (this.panelEl && this.panelEl.dataset.activeTrigger === this.triggerButtonId) {
            this.panelEl.style.display = 'none';
            delete this.panelEl.dataset.activeTrigger;
        }
    }
}