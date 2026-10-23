import {
    LANE_TYPES,
    type LineInfrastructureType, MARKING_TYPES, POINT_INFRASTRUCTURE_SPECS, type PointInfrastructureType,
    type PolygonInfrastructureType,
} from '../config/infrastructure';
import { LINE_INFRASTRUCTURE_SPECS, POLYGON_INFRASTRUCTURE_SPECS, HEX_COLOR_REGEX } from '../config/infrastructure';

export interface InspectorPanelCallbacks {
    onUpdateProperty: (key: string, value: any) => void;
    onDelete: () => void;
    onClose: () => void;
    onMoveFeatureOrder: (direction: 'up' | 'down') => void;
}

export class InspectorPanel {
    private panelEl: HTMLElement | null;
    private labelId: HTMLElement | null;
    private inputType: HTMLSelectElement | null;
    private inputWidth: HTMLInputElement | null;
    private inputColorPicker: HTMLInputElement | null;
    private inputColorHex: HTMLInputElement | null;
    private inputDouble: HTMLInputElement | null;
    private currentGeometryType: string = 'LineString';
    private widthContainer: HTMLElement | null;
    private doubleContainer: HTMLElement | null;
    private inputSmooth: HTMLInputElement | null;
    private inputRotation: HTMLInputElement | null;
    private rotationValueEl: HTMLElement | null;
    private rotationContainer: HTMLElement | null;

    constructor(callbacks: InspectorPanelCallbacks) {
        this.panelEl = document.getElementById('inspector-panel');
        this.labelId = document.getElementById('inspector-feature-id');
        this.inputType = document.getElementById('inspector-type') as HTMLSelectElement;
        this.inputWidth = document.getElementById('inspector-width') as HTMLInputElement;
        this.inputColorPicker = document.getElementById('inspector-color-picker') as HTMLInputElement;
        this.inputColorHex = document.getElementById('inspector-color-hex') as HTMLInputElement;
        this.inputDouble = document.getElementById('inspector-double') as HTMLInputElement;
        this.inputSmooth = document.getElementById('inspector-smooth') as HTMLInputElement;
        this.inputRotation = document.getElementById('inspector-rotation') as HTMLInputElement;
        this.rotationValueEl = document.getElementById('inspector-rotation-val');

        this.widthContainer = this.inputWidth?.closest('.inspector-row, div') || this.inputWidth?.parentElement || null;
        this.doubleContainer = this.inputDouble?.closest('.inspector-row, div') || this.inputDouble?.parentElement || null;
        this.rotationContainer = this.inputRotation?.closest('.inspector-row, div') || this.inputRotation?.parentElement || null;

        this.isolateEvents();
        this.bindEvents(callbacks);
    }

    private isolateEvents(): void {
        if (!this.panelEl) return;
        ['keydown', 'keyup', 'keypress'].forEach((eventType) => {
            this.panelEl?.addEventListener(eventType, (e) => e.stopPropagation());
        });
    }

    private updateFieldVisibility(currentGeometryType: string, lineType?: string): void {
        if (currentGeometryType === 'Polygon') {
            if (this.widthContainer) this.widthContainer.style.display = 'none';
            if (this.doubleContainer) this.doubleContainer.style.display = 'none';
            if (this.rotationContainer) this.rotationContainer.style.display = 'none';
        } else if (currentGeometryType === 'LineString') {
            if (this.widthContainer) this.widthContainer.style.display = '';
            if (this.rotationContainer) this.rotationContainer.style.display = 'none';
            if (this.doubleContainer) {
                this.doubleContainer.style.display = MARKING_TYPES.includes(lineType as LineInfrastructureType) ? 'none' : '';
            }
        } else if (currentGeometryType === 'Point') {
            if (this.rotationContainer) this.rotationContainer.style.display = '';
            if (this.doubleContainer) this.doubleContainer.style.display = 'none';
        }
    }

    public open(feature: GeoJSON.Feature): void {
        const props = feature.properties || {};
        const id = feature.id ? feature.id.toString() : '';
        this.currentGeometryType = feature.geometry.type;
        const isPolygon = this.currentGeometryType === 'Polygon';
        const isLine = this.currentGeometryType === 'LineString';

        if (this.labelId) this.labelId.textContent = `#${id.slice(0, 8)}`;

        const type = props.infrastructureType || (isPolygon ? 'sidewalk' : 'bicycle_path');
        const isMarking = MARKING_TYPES.includes(type as LineInfrastructureType);

        if (this.inputType) {
            this.inputType.innerHTML = '';
            if (isPolygon) {
                Object.keys(POLYGON_INFRASTRUCTURE_SPECS).forEach((key) => {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
                    this.inputType?.appendChild(opt);
                });
            } else if (isLine) {
                const allowedLineTypes = isMarking ? MARKING_TYPES : LANE_TYPES;
                allowedLineTypes.forEach((key) => {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    this.inputType?.appendChild(opt);
                });
            } else { //Point
                Object.keys(POINT_INFRASTRUCTURE_SPECS).forEach((key) => {
                    const opt = document.createElement('option');
                    opt.value = key;
                    opt.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
                    this.inputType?.appendChild(opt);
                });
            }
        }

        const isSmooth = props.smooth || false;
        if (this.inputSmooth) this.inputSmooth.checked = isSmooth;

        if (this.inputType) this.inputType.value = type;

        const color = props.color || (isPolygon ? POLYGON_INFRASTRUCTURE_SPECS.sidewalk.color : LINE_INFRASTRUCTURE_SPECS[type as LineInfrastructureType]?.color || LINE_INFRASTRUCTURE_SPECS.bicycle_path.color);
        if (this.inputColorPicker) this.inputColorPicker.value = color;
        if (this.inputColorHex) this.inputColorHex.value = color;

        const rotation = props.rotation ?? 0;
        if (this.inputRotation) this.inputRotation.value = rotation.toString();

        this.updateFieldVisibility(this.currentGeometryType, type);

        const isPoint = this.currentGeometryType === 'Point';
        if (this.rotationContainer) {
            this.rotationContainer.style.display = isPoint ? '' : 'none';
        }

        if (isPoint) {
            const rotation = props.rotation ?? 0;
            if (this.inputRotation) this.inputRotation.value = rotation.toString();
            if (this.rotationValueEl) this.rotationValueEl.textContent = rotation.toString();
            const width = props.widthMeters || 1.5;
            if (this.inputWidth) this.inputWidth.value = width.toString();
        }

        if (isLine) {
            const width = props.widthMeters || LINE_INFRASTRUCTURE_SPECS[type as LineInfrastructureType]?.widthMeters || LINE_INFRASTRUCTURE_SPECS.bicycle_path.widthMeters;
            const isDouble = props.isDouble || false;
            if (this.inputWidth) this.inputWidth.value = width.toString();
            if (this.inputDouble) this.inputDouble.checked = isDouble;
        }

        if (this.panelEl) this.panelEl.style.display = 'block';
    }

    public close(): void {
        if (this.panelEl) this.panelEl.style.display = 'none';
    }

    private bindEvents(callbacks: InspectorPanelCallbacks): void {
        const btnDelete = document.getElementById('inspector-btn-delete');
        const btnClose = document.getElementById('inspector-btn-close');
        const btnMoveUp = document.getElementById('btn-move-up');
        const btnMoveDown = document.getElementById('btn-move-down');

        btnMoveUp?.addEventListener('click', () => {
            console.log('[InspectorPanel] Move Up clicked');
            callbacks.onMoveFeatureOrder('up');
        });

        btnMoveDown?.addEventListener('click', () => {
            console.log('[InspectorPanel] Move Down clicked');
            callbacks.onMoveFeatureOrder('down');
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.panelEl && this.panelEl.style.display !== 'none') {
                callbacks.onClose();
            }
        });

        this.inputRotation?.addEventListener('input', () => {
            if (!this.inputRotation || this.currentGeometryType !== 'Point') return;
            const rotation = parseFloat(this.inputRotation.value) || 0;

            if (this.rotationValueEl) {
                this.rotationValueEl.textContent = rotation.toString();
            }

            callbacks.onUpdateProperty('rotation', rotation);
        });

        this.inputSmooth?.addEventListener('change', () => {
            if (!this.inputSmooth) return;
            callbacks.onUpdateProperty('smooth', this.inputSmooth.checked);
        });

        this.inputType?.addEventListener('change', () => {
            if (!this.inputType) return;
            const newType = this.inputType.value;

            const isPolygon = this.currentGeometryType === 'Polygon';
            const isLine = this.currentGeometryType === 'LineString';
            this.updateFieldVisibility(this.currentGeometryType, newType);

            this.inputSmooth?.addEventListener('change', () => {
                if (!this.inputSmooth) return;
                callbacks.onUpdateProperty('smooth', this.inputSmooth.checked);
            });

            if (isPolygon) {
                const spec = POLYGON_INFRASTRUCTURE_SPECS[newType as PolygonInfrastructureType];
                if (spec) {
                    if (this.inputColorHex) this.inputColorHex.value = spec.color;
                    if (this.inputColorPicker) this.inputColorPicker.value = spec.color;

                    callbacks.onUpdateProperty('infrastructureType', newType);
                    callbacks.onUpdateProperty('color', spec.color);
                }
            } else if (isLine) {
                const spec = LINE_INFRASTRUCTURE_SPECS[newType as LineInfrastructureType];
                if (spec) {
                    if (this.inputWidth) this.inputWidth.value = spec.widthMeters.toString();
                    if (this.inputColorHex) this.inputColorHex.value = spec.color;
                    if (this.inputColorPicker) this.inputColorPicker.value = spec.color;
                    if (this.inputDouble) this.inputDouble.checked = spec.isDouble;

                    callbacks.onUpdateProperty('infrastructureType', newType);
                    callbacks.onUpdateProperty('widthMeters', spec.widthMeters);
                    callbacks.onUpdateProperty('color', spec.color);
                    callbacks.onUpdateProperty('isDouble', spec.isDouble);
                }
            } else { //Point
                const spec = POINT_INFRASTRUCTURE_SPECS[newType as PointInfrastructureType];
                if (spec) {
                    if (this.inputColorHex) this.inputColorHex.value = spec.color;
                    if (this.inputColorPicker) this.inputColorPicker.value = spec.color;

                    callbacks.onUpdateProperty('infrastructureType', newType);
                    callbacks.onUpdateProperty('color', spec.color);
                }
            }
        });

        this.inputWidth?.addEventListener('input', () => {
            if (!this.inputWidth || this.currentGeometryType === 'Polygon') return;
            const rawValue = this.inputWidth.value.replace(',', '.').trim();
            if (rawValue === '' || rawValue.endsWith('.')) return;

            const width = parseFloat(rawValue);
            if (!isNaN(width) && isFinite(width) && width > 0) {
                callbacks.onUpdateProperty('widthMeters', width);
            }
        });

        this.inputColorPicker?.addEventListener('input', () => {
            if (!this.inputColorPicker || !this.inputColorHex) return;
            this.inputColorHex.value = this.inputColorPicker.value;
            if (HEX_COLOR_REGEX.test(this.inputColorPicker.value)) {
                callbacks.onUpdateProperty('color', this.inputColorPicker.value);
            }
        });

        this.inputColorHex?.addEventListener('input', () => {
            if (!this.inputColorHex || !this.inputColorPicker) return;
            let hex = this.inputColorHex.value.trim();
            if (!hex.startsWith('#')) hex = '#' + hex;

            if (HEX_COLOR_REGEX.test(hex)) {
                this.inputColorPicker.value = hex;
                callbacks.onUpdateProperty('color', hex);
            }
        });

        this.inputDouble?.addEventListener('input', () => {
            if (this.currentGeometryType === 'Polygon') return;
            if (this.inputWidth && this.inputDouble) {
                const width = parseFloat(this.inputWidth.value);
                if (!isNaN(width)) {
                    if (this.inputDouble.checked) {
                        this.inputWidth.value = (width * 2).toString();
                    } else {
                        this.inputWidth.value = (width / 2).toString();
                    }
                    callbacks.onUpdateProperty('widthMeters', parseFloat(this.inputWidth.value));
                }
            }

            if (!this.inputDouble) return;
            callbacks.onUpdateProperty('isDouble', this.inputDouble.checked);
        });

        btnDelete?.addEventListener('click', () => callbacks.onDelete());
        btnClose?.addEventListener('click', () => callbacks.onClose());
    }
}