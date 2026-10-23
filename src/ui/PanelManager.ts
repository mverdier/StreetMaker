import { LANE_TYPES, MARKING_TYPES, type LineInfrastructureType, type PolygonInfrastructureType, type PointInfrastructureType } from '../config/infrastructure';
import { LineCreationPanel } from './LineCreationPanel';
import { PolyCreationPanel } from './PolyCreationPanel';
import { SettingsPanel } from './SettingsPanel';
import { InspectorPanel } from './InspectorPanel';
import { PointCreationPanel } from './PointCreationPanel';
import { OpacityControl } from './OpacityControl';

export interface PanelManagerOptions {
    onStartDrawingLine: (type: LineInfrastructureType, color: string, widthMeters: number, isDouble: boolean, smooth: boolean) => void;
    onStartDrawingPolygon: (type: PolygonInfrastructureType, color: string, smooth: boolean) => void;
    onStartDrawingPoint: (type: PointInfrastructureType, color: string, widthMeters: number, rotation: number) => void;
    onTogglePolygonSmoothing: (enabled: boolean) => void;
    onUpdateFeatureProperty: (key: string, value: any) => void;
    onDeleteFeature: () => void;
    onCloseInspector: () => void;
    onGlobalOpacityChange: (opacity: number) => void;
    closeEverything: () => void;
    onMoveFeatureOrder: (direction: 'up' | 'down') => void;
    onToggleLabels: (enabled: boolean) => void;
}

export class PanelManager {
    public lineCreationPanel: LineCreationPanel;
    public markingCreationPanel: LineCreationPanel;
    public polyCreationPanel: PolyCreationPanel;
    public settingsPanel: SettingsPanel;
    public inspectorPanel: InspectorPanel;
    public pointCreationPanel: PointCreationPanel;
    public opacityControl: OpacityControl;

    constructor(options: PanelManagerOptions) {
        ['btn-new-line', 'btn-new-markings', 'btn-new-poly', 'btn-new-single-point', 'btn-new-sticker'].forEach((id) => {
            document.getElementById(id)?.addEventListener('click', () => {
                options.closeEverything();
            });
        });

        this.opacityControl = new OpacityControl({
            onChange: (opacity) => options.onGlobalOpacityChange(opacity),
        });

        const btnSettings = document.getElementById('btn-settings');
        btnSettings?.addEventListener('click', () => {
            options.closeEverything();
            this.settingsPanel.toggle();
        });

        this.settingsPanel = new SettingsPanel({
            onClose: () => this.settingsPanel.close(),
            onToggleLabels: (enabled) => options.onToggleLabels(enabled),
        });

        this.lineCreationPanel = new LineCreationPanel({
            title: 'Create Lane',
            allowedTypes: LANE_TYPES,
            triggerButtonId: 'btn-new-line',
            onConfirm: (config) => options.onStartDrawingLine(config.infrastructureType, config.color, config.widthMeters, config.isDouble, config.smooth),
        });

        this.markingCreationPanel = new LineCreationPanel({
            title: 'Create Markings',
            allowedTypes: MARKING_TYPES,
            triggerButtonId: 'btn-new-markings',
            onConfirm: (config) => options.onStartDrawingLine(config.infrastructureType, config.color, config.widthMeters, config.isDouble, config.smooth),
        });

        this.polyCreationPanel = new PolyCreationPanel({
            onConfirm: (config) => options.onStartDrawingPolygon(config.infrastructureType, config.color, config.smooth),
        });

        this.inspectorPanel = new InspectorPanel({
            onUpdateProperty: (key, value) => options.onUpdateFeatureProperty(key, value),
            onDelete: () => options.onDeleteFeature(),
            onClose: () => options.onCloseInspector(),
            onMoveFeatureOrder: (direction) => options.onMoveFeatureOrder(direction),
        });

        this.pointCreationPanel = new PointCreationPanel({
            onConfirm: (config) => options.onStartDrawingPoint(config.infrastructureType, config.color, config.widthMeters, config.rotation),
        });
    }

    public closeAll(): void {
        this.inspectorPanel.close();
        this.polyCreationPanel.close();
        this.lineCreationPanel.close();
        this.markingCreationPanel.close();
        this.settingsPanel.close();
        this.pointCreationPanel.close();
    }
}