import {Map, NavigationControl, setWorkerUrl, type IControl, GeoJSONSource} from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

import {
    type LineInfrastructureType, type PointInfrastructureType,
    POLYGON_INFRASTRUCTURE_SPECS, type PolygonInfrastructureType
} from './config/infrastructure';
import { LINE_INFRASTRUCTURE_SPECS, HEX_COLOR_REGEX } from './config/infrastructure';

import {
    getMetersPerPixelAtZoom, getMeterLineWidthExpression, getGeoJSONBounds,
} from './utils/GeoMath';
import {
    getNativeRoadLayerSpec,
    getNativeRoadCenterlineLayerSpec,
    getRoadStyles,
    getExtensionHandleLayers,
    getNativePolygonLayerSpec,
    getNativePedestrianCrossingLayerSpec,
    getNativeSquareMarkingsLayerSpec,
    getNativeContinuousLineLayerSpec,
    getNativeTriangleMarkingsLayerSpec,
    getNativePointLayerSpec,
    getNativeDashedLineLayerSpec,
    getNativeSingleTramRailLeftLayerSpec,
    getNativeSingleTramRailRightLayerSpec,
    getNativeDoubleTramRailsLayerSpec
} from './map/RoadStyles';
import { ExtensionHandleManager } from './map/ExtensionHandleManager';
import { MeasureTool } from './map/MeasureTool';
import { SplitTool } from './map/SplitTool';
import {
    DEFAULT_MAP_CENTER,
    DEFAULT_MAP_ZOOM,
    GOOGLE_BASE_LAYERS,
    GOOGLE_BASE_SOURCES,
    GOOGLE_SATELLITE_STYLE
} from "./map/styles/MapStyle";
import {registerMapIcons} from "./utils/IconGenerator";
import {setupFileImportExport} from "./utils/FileExportManager";
import {setupKeybindings} from "./utils/Keybindings";
import {PanelManager} from "./ui/PanelManager";
import {processGeometryFeatures} from "./utils/GeometryProcessor";
import { RectangleSelectTool } from './map/RectangleSelectTool';
import {
    getRectSelectBoxLayerSpec, getRectSelectBoxSourceSpec,
    getRectSelectVerticesLayerSpec,
    getRectSelectVerticesSourceSpec, getSnapIndicatorLayerSpec, getSnapIndicatorSourceSpec, RECT_SELECT_BOX_SOURCE_ID,
    RECT_SELECT_VERTICES_SOURCE_ID, SNAP_INDICATOR_SOURCE_ID
} from "./map/styles/ToolStyles";
import {WelcomeModal} from "./ui/WelcomeModal";

export type { LineInfrastructureType };
export { LINE_INFRASTRUCTURE_SPECS };

const ALL_ROAD_LINE_LAYERS = [
    'roads-native-layer',
    'roads-native-centerline-layer',
    'roads-native-crossing-layer',
    'roads-native-square-markings-layer',
    'roads-native-continuous-line-layer',
    'roads-native-markings-triangle-layer',
    'roads-native-dashed-line-layer',
    'roads-native-single-tram-rail-left-layer',
    'roads-native-single-tram-rail-right-layer',
    'roads-native-double-tram-rail-0',
    'roads-native-double-tram-rail-1',
    'roads-native-double-tram-rail-2',
    'roads-native-double-tram-rail-3',
] as const;

setWorkerUrl(maplibreWorkerUrl);

class RoadEditor {
    private map: Map;
    private draw: MapboxDraw;
    private extensionHandleManager!: ExtensionHandleManager;
    private polygonSmoothingEnabled: boolean = true;
    private measureTool!: MeasureTool;
    private splitTool!: SplitTool;
    private rectSelectTool!: RectangleSelectTool;
    private panelManager!: PanelManager;

    private selectedFeatureId: string | null = null;
    private activeLineinfrastructureType: LineInfrastructureType = 'bicycle_path';

    private activeConfig: {
        infrastructureType: LineInfrastructureType;
        color: string;
        widthMeters: number;
        isDouble: boolean;
        smooth: boolean;
        zIndex: number;
    } = {
        infrastructureType: 'bicycle_path',
        color: LINE_INFRASTRUCTURE_SPECS.bicycle_path.color,
        widthMeters: LINE_INFRASTRUCTURE_SPECS.bicycle_path.widthMeters,
        isDouble: false,
        smooth: true,
        zIndex: 50,
    };

    private activePolygonConfig: {
        infrastructureType: PolygonInfrastructureType;
        color: string;
        smooth: boolean;
        zIndex: number;
    } = {
        infrastructureType: 'sidewalk',
        color: POLYGON_INFRASTRUCTURE_SPECS.sidewalk.color,
        smooth: true,
        zIndex: 50,
    };

    private activeSinglePointConfig = {
        infrastructureType: 'arrow_forward' as PointInfrastructureType,
        color: '#ffffff',
        widthMeters: 1.0,
        rotation: 0,
        iconName: 'arrow-forward-icon',
    };

    constructor(containerId: string) {
        this.map = new Map({
            container: containerId,
            style: GOOGLE_SATELLITE_STYLE,
            center: DEFAULT_MAP_CENTER,
            zoom: DEFAULT_MAP_ZOOM,
            dragRotate: false,
            doubleClickZoom: false,
        });

        const currentLat = DEFAULT_MAP_CENTER[1];
        const pxPerMeterZoom20 = 1 / getMetersPerPixelAtZoom(20, currentLat, 512);

        this.draw = new MapboxDraw({
            displayControlsDefault: false,
            defaultMode: 'simple_select',
            styles: getRoadStyles(this.activeLineinfrastructureType, pxPerMeterZoom20),
        });

        this.init();
    }

    private setupMapSourcesAndLayers(pxPerMeterZoom20: number): void {
        this.setupSources();
        this.setupBaseMapLayers();
        this.setupDrawIntegration();
        this.setupCoreLayers(pxPerMeterZoom20);
        this.setupOverlayLayers(pxPerMeterZoom20);
        this.setupToolOverlays();
    }

    private setupSources(): void {
        for (const [id, sourceSpec] of Object.entries(GOOGLE_BASE_SOURCES)) {
            this.map.addSource(id, sourceSpec);
        }

        this.map.addSource('polygons-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        this.map.addSource('roads-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        this.map.addSource('extension-handles-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        this.map.addSource('single-points-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    }

    private setupBaseMapLayers(): void {
        GOOGLE_BASE_LAYERS.forEach(layer => {
            this.map.addLayer(layer);
        });
    }

    public setBaseMapType(type: 'satellite' | 'hybrid'): void {
        if (!this.map.getLayer('google-satellite-layer') || !this.map.getLayer('google-hybrid-layer')) return;

        if (type === 'satellite') {
            this.map.setLayoutProperty('google-satellite-layer', 'visibility', 'visible');
            this.map.setLayoutProperty('google-hybrid-layer', 'visibility', 'none');
        } else {
            this.map.setLayoutProperty('google-satellite-layer', 'visibility', 'none');
            this.map.setLayoutProperty('google-hybrid-layer', 'visibility', 'visible');
        }
    }

    private setupDrawIntegration(): void {
        getExtensionHandleLayers().forEach(layer => this.map.addLayer(layer));

        const currentStyle = this.map.getStyle();
        if (currentStyle && currentStyle.layers) {
            currentStyle.layers.forEach((layer) => {
                if (layer.id.startsWith('gl-draw-')) {
                    if (this.map.getLayer(layer.id)) {
                        this.map.removeLayer(layer.id);
                    }
                }
            });

            registerMapIcons(this.map);

            this.map.addControl(new NavigationControl());
            this.map.addControl(this.draw as unknown as IControl, 'top-left');
        }
    }

    private setupCoreLayers(pxPerMeterZoom20: number): void {
        this.map.addLayer(getNativePolygonLayerSpec());

        this.map.addLayer(getNativeRoadLayerSpec(pxPerMeterZoom20));
        this.map.addLayer(getNativeRoadCenterlineLayerSpec(pxPerMeterZoom20));
        this.map.addLayer(getNativePointLayerSpec(pxPerMeterZoom20));
    }

    private setupOverlayLayers(pxPerMeterZoom20: number): void {
        if (!this.map.getLayer('roads-native-crossing-layer')) {
            this.map.addLayer(getNativePedestrianCrossingLayerSpec(pxPerMeterZoom20));
        }
        if (!this.map.getLayer('roads-native-square-markings-layer')) {
            this.map.addLayer(getNativeSquareMarkingsLayerSpec(pxPerMeterZoom20));
        }
        if (!this.map.getLayer('roads-native-continuous-line-layer')) {
            this.map.addLayer(getNativeContinuousLineLayerSpec(pxPerMeterZoom20));
        }
        if (!this.map.getLayer('roads-native-markings-triangle-layer')) {
            this.map.addLayer(getNativeTriangleMarkingsLayerSpec(pxPerMeterZoom20));
        }
        if (!this.map.getLayer('roads-native-dashed-line-layer')) {
            this.map.addLayer(getNativeDashedLineLayerSpec(pxPerMeterZoom20));
        }

        if (!this.map.getLayer('roads-native-single-tram-rail-left-layer')) {
            this.map.addLayer(getNativeSingleTramRailLeftLayerSpec(pxPerMeterZoom20));
            this.map.addLayer(getNativeSingleTramRailRightLayerSpec(pxPerMeterZoom20));
        }

        if (!this.map.getLayer('roads-native-double-tram-rail-0')) {
            getNativeDoubleTramRailsLayerSpec(pxPerMeterZoom20).forEach(railLayer => {
                this.map.addLayer(railLayer);
            });
        }
    }

    private setupToolOverlays(): void {
        if (!this.map.getSource(SNAP_INDICATOR_SOURCE_ID)) {
            this.map.addSource(SNAP_INDICATOR_SOURCE_ID, getSnapIndicatorSourceSpec());
            this.map.addLayer(getSnapIndicatorLayerSpec());
        }

        if (!this.map.getSource(RECT_SELECT_BOX_SOURCE_ID)) {
            this.map.addSource(RECT_SELECT_BOX_SOURCE_ID, getRectSelectBoxSourceSpec());
            this.map.addLayer(getRectSelectBoxLayerSpec());
        }

        if (!this.map.getSource(RECT_SELECT_VERTICES_SOURCE_ID)) {
            this.map.addSource(RECT_SELECT_VERTICES_SOURCE_ID, getRectSelectVerticesSourceSpec());
            this.map.addLayer(getRectSelectVerticesLayerSpec());
        }
    }

    private setupDrawEventHandlers(): void {
        this.map.on('click', () => {
            if (this.panelManager && this.panelManager.confirmOpenPanel()) {
                return;
            }
        });
        this.map.on('draw.create' as any, (e: any) => {
            this.handleCreate(e);
            this.extensionHandleManager.updateHandles();
        });
        this.map.on('draw.update' as any, (_e: any) => {
            this.handleGeometryChange();
            this.extensionHandleManager.updateHandles();
        });
        this.map.on('draw.delete' as any, (_e: any) => {
            this.handleGeometryChange();
            this.extensionHandleManager.updateHandles();
        });
        this.map.on('draw.render' as any, () => {
            this.handleGeometryChange();
        });
        this.map.on('draw.modechange' as any, (e: { mode: string }) => {
            this.measureTool.deactivate();
            this.splitTool.deactivate();
            this.rectSelectTool.deactivate();
            this.handleModeChange(e);
        });

        this.map.on('draw.selectionchange' as any, (e: { features: GeoJSON.Feature[] }) => {
            if (e.features && e.features.length > 0) {
                const selected = e.features[0];
                const props = selected.properties || {};
                const color = props.color || LINE_INFRASTRUCTURE_SPECS.bicycle_path.color;
                const widthMeters = props.widthMeters || LINE_INFRASTRUCTURE_SPECS.bicycle_path.widthMeters;

                this.updateActiveLayerPaint(color, widthMeters);

                if (selected.id) {
                    this.selectedFeatureId = selected.id.toString();
                    this.panelManager.inspectorPanel.open(selected);
                }
            } else {
                const spec = LINE_INFRASTRUCTURE_SPECS[this.activeLineinfrastructureType];
                this.updateActiveLayerPaint(spec.color, spec.widthMeters);
                this.selectedFeatureId = null;
                this.panelManager.inspectorPanel.close();
            }
            this.extensionHandleManager.setSelectedFeatureId(this.selectedFeatureId);
        });

        const canvas = this.map.getCanvas();

        canvas.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button === 2) {
                const currentMode = this.draw.getMode();
                if (currentMode && currentMode.startsWith('draw_')) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.stopDrawing();
                }
            }
        }, { capture: true });

        canvas.addEventListener('contextmenu', (e: MouseEvent) => {
            const currentMode = this.draw.getMode();
            if (currentMode && currentMode.startsWith('draw_')) {
                e.stopPropagation();
                e.preventDefault();
            }
        }, { capture: true });
    }

    private init(): void {
        const currentLat = DEFAULT_MAP_CENTER[1];
        const pxPerMeterZoom20 = 1 / getMetersPerPixelAtZoom(20, currentLat, 512);

        this.map.on('load', () => {
            this.setupMapSourcesAndLayers(pxPerMeterZoom20);

            this.initExtensionHandleManager();

            this.setupPanels();
            this.setupFileImportExport();

            this.measureTool = new MeasureTool(this.map);
            this.splitTool = new SplitTool({
                map: this.map,
                draw: this.draw,
                onGeometryChange: () => this.handleGeometryChange(),
                onUpdateHandles: () => this.extensionHandleManager.updateHandles(),
                showSnapIndicator: (coord) => this.showSnapIndicator(coord),
                clearSnapIndicator: () => this.clearSnapIndicator(),
            });
            const welcomeModal = new WelcomeModal();
            welcomeModal.open();

            this.bindSplitButton();
            this.bindMeasureButton();

            this.setupDrawEventHandlers();
            this.setupKeybindings();

            this.rectSelectTool = new RectangleSelectTool({
                map: this.map,
                draw: this.draw,
                onGeometryChange: () => this.handleGeometryChange(),
                onUpdateHandles: () => this.extensionHandleManager.updateHandles(),
                onHideHandles: () => this.extensionHandleManager.hideHandles(),
            });
            this.bindRectSelectButton();
        });
    }

    private initExtensionHandleManager(): void {
        this.extensionHandleManager = new ExtensionHandleManager({
            map: this.map,
            draw: this.draw,
            onExtend: (featureIdToExtend, handleType, _targetCoord) => {
                this.handleLineExtension(featureIdToExtend, handleType);
            }
        });
    }

    private applyPropertiesToActiveFeatures(properties: Record<string, any>): void {
        const allFeatures = this.draw.getAll();
        allFeatures.features.forEach((feature: any) => {
            if (feature.properties && feature.properties.active === 'true' && feature.id) {
                for (const [key, val] of Object.entries(properties)) {
                    this.draw.setFeatureProperty(feature.id, key, val);
                }
            }
        });
    }

    private bindSplitButton(): void {
        const btnSplit = document.getElementById('btn-split');
        btnSplit?.addEventListener('click', () => {
            this.closeEverything();
            this.splitTool.toggle();
        });
    }

    private bindMeasureButton(): void {
        const btnMeasure = document.getElementById('btn-measure');
        btnMeasure?.addEventListener('click', () => {
            this.closeEverything();
            this.measureTool.toggle();
        });
    }

    private bindRectSelectButton(): void {
        const btnRect = document.getElementById('btn-rect-select');
        btnRect?.addEventListener('click', () => {
            this.closeEverything();
            this.rectSelectTool.toggle();
        });
    }

    private setupFileImportExport(): void {
        setupFileImportExport({
            deactivateMeasureTool: () => this.measureTool.deactivate(),
            getDrawData: () => this.draw.getAll() as GeoJSON.FeatureCollection,
            setDrawData: (geojson) => this.draw.set(geojson),
            handleGeometryChange: () => this.handleGeometryChange(),
            fitMapToGeoJSON: (geojson) => this.fitMapToGeoJSON(geojson),
        });
    }

    private setupPanels(): void {
        this.panelManager = new PanelManager({
            onStartDrawingLine: (type, color, widthMeters, isDouble, smooth) =>
                this.startDrawingWithConfig(type, color, widthMeters, isDouble, smooth),
            onStartDrawingPolygon: (type, color, smooth) =>
                this.startDrawingPolygonWithConfig(type, color, smooth),
            onStartDrawingPoint: (type, color, widthMeters, rotation) =>
                this.startDrawingSinglePointWithConfig(type, color, widthMeters, rotation),
            onTogglePolygonSmoothing: (enabled) => {
                this.polygonSmoothingEnabled = enabled;
                this.handleGeometryChange();
            },
            onToggleLabels: (enabled) => {
                this.setBaseMapType(enabled ? 'hybrid' : 'satellite');
            },
            onUpdateFeatureProperty: (key, value) => this.updateSelectedFeatureProperty(key, value),
            onMoveFeatureOrder: (direction) => this.moveSelectedFeatureZOrder(direction),
            onDeleteFeature: () => {
                if (this.selectedFeatureId) {
                    this.draw.delete(this.selectedFeatureId);
                    this.selectedFeatureId = null;
                    this.panelManager.inspectorPanel.close();
                    this.extensionHandleManager.updateHandles();
                    this.handleGeometryChange();
                }
            },
            onCloseInspector: () => {
                this.draw.changeMode('simple_select');
                this.selectedFeatureId = null;
                this.panelManager.inspectorPanel.close();
            },
            onGlobalOpacityChange: (opacity) => this.setGlobalOverlayOpacity(opacity),
            closeEverything: () => this.closeEverything(),
        });
    }

    private setDrawingCursorActive(active: boolean): void {
        const container = this.map.getContainer();
        if (active) {
            container.classList.add('drawing-mode');
        } else {
            container.classList.remove('drawing-mode');
        }
    }

    private updateSelectedFeatureProperty(key: string, value: any): void {
        if (!this.selectedFeatureId || value === null || value === undefined || value === '') return;

        const existingFeature = this.draw.get(this.selectedFeatureId);
        if (!existingFeature) return;

        this.draw.setFeatureProperty(this.selectedFeatureId, key, value);

        const currentId = this.selectedFeatureId;
        this.draw.changeMode('simple_select', { featureIds: [currentId] });

        const updatedFeature = this.draw.get(currentId);
        if (updatedFeature) {
            this.draw.add(updatedFeature);
            const props = updatedFeature.properties || {};
            this.updateActiveLayerPaint(props.color, props.widthMeters);
        }

        this.handleGeometryChange();
    }

    private updateActiveLayerPaint(color: string, widthMeters: number): void {
        const widthExpr = getMeterLineWidthExpression(widthMeters);
        const cappedCenterwidth = Math.min(Math.max(widthMeters * 0.1, 0.1), 0.5);
        const centerlineWidthExpr = getMeterLineWidthExpression(cappedCenterwidth);

        ['gl-draw-line-active.hot', 'gl-draw-line-active.cold'].forEach((layerId) => {
            if (this.map.getLayer(layerId)) {
                if (typeof color === 'string' && color.trim().length > 0 && HEX_COLOR_REGEX.test(color)) {
                    this.map.setPaintProperty(layerId, 'line-color', color);
                }
                this.map.setPaintProperty(layerId, 'line-width', widthExpr as any);
            }
        });

        ['gl-draw-line-active-centerline.hot', 'gl-draw-line-active-centerline.cold'].forEach((layerId) => {
            if (this.map.getLayer(layerId)) {
                this.map.setPaintProperty(layerId, 'line-width', centerlineWidthExpr as any);
            }
        });
    }

    public startDrawingSinglePointWithConfig(
        type: PointInfrastructureType,
        color: string,
        widthMeters: number,
        rotation: number
    ): void {
        this.setDrawingCursorActive(true);

        let iconName = '';
        if (type === 'arrow_left') {
            iconName = 'arrow-left-icon';
        } else if (type === 'arrow_right') {
            iconName = 'arrow-right-icon';
        } else if (type === 'arrow_forward') {
            iconName = 'arrow-forward-icon';
        }

        this.activeSinglePointConfig = {
            infrastructureType: type,
            color,
            widthMeters,
            rotation,
            iconName
        };

        this.draw.changeMode('draw_point');

        this.applyPropertiesToActiveFeatures({
            infrastructureType: type,
            color,
            widthMeters,
            iconName,
            rotation,
            zIndex: 50,
        });
    }

    public startDrawingWithConfig(type: LineInfrastructureType, color: string, widthMeters: number, isDouble: boolean, smooth: boolean): void {
        this.setDrawingCursorActive(true);

        this.activeConfig = { infrastructureType: type, color, widthMeters, isDouble, smooth, zIndex: 50 };
        this.updateActiveLayerPaint(color, widthMeters);
        this.draw.changeMode('draw_line_string');

        this.applyPropertiesToActiveFeatures({
            infrastructureType: type,
            color,
            widthMeters,
            isDouble,
            smooth,
            zIndex: 50,
        });
    }

    public startDrawingRoad(type: LineInfrastructureType = 'bicycle_path'): void {
        this.setDrawingCursorActive(true);

        this.activeLineinfrastructureType = type;
        this.draw.changeMode('draw_line_string');
        const spec = LINE_INFRASTRUCTURE_SPECS[type];
        this.updateActiveLayerPaint(spec.color, spec.widthMeters);

        this.activeConfig = {
            infrastructureType: type,
            color: spec.color,
            widthMeters: spec.widthMeters,
            isDouble: false,
            smooth: spec.smooth,
            zIndex: 50,
        };

        this.applyPropertiesToActiveFeatures({
            infrastructureType: type,
            color: spec.color,
            widthMeters: spec.widthMeters,
            isDouble: spec.isDouble,
            smooth: spec.smooth,
            zIndex: 50,
        });
    }

    public startDrawingPolygonWithConfig(type: PolygonInfrastructureType, color: string, smooth: boolean): void {
        this.setDrawingCursorActive(true);

        this.activePolygonConfig = { infrastructureType: type, color, smooth, zIndex: 50 };
        this.draw.changeMode('draw_polygon');

        this.applyPropertiesToActiveFeatures({
            infrastructureType: type,
            color,
            smooth,
            fillOpacity: 1,
            zIndex: 50,
        });
    }

    public stopDrawing(): void {
        this.draw.changeMode('simple_select');
        this.setDrawingCursorActive(false);
    }

    private handleModeChange(e: { mode: string }): void {
        console.log('Active Draw Mode:', e.mode);

        if (e.mode === 'draw_line_string') {
            this.applyPropertiesToActiveFeatures({
                infrastructureType: this.activeConfig.infrastructureType,
                color: this.activeConfig.color,
                widthMeters: this.activeConfig.widthMeters,
                isDouble: this.activeConfig.isDouble,
                smooth: this.activeConfig.smooth,
            });
        }

        if (e.mode === 'draw_polygon') {
            this.applyPropertiesToActiveFeatures({
                infrastructureType: this.activePolygonConfig.infrastructureType,
                color: this.activePolygonConfig.color,
                smooth: this.activePolygonConfig.smooth,
                fillOpacity: 1,
            });
        }

        if (e.mode === 'simple_select') {
            const allFeatures = this.draw.getAll();
            let needsUpdate = false;

            allFeatures.features.forEach((feature) => {
                if (feature.id && feature.properties?.extendingEnd) {
                    const extendingEnd = feature.properties.extendingEnd;

                    if (extendingEnd === 'start' && feature.geometry.type === 'LineString') {
                        feature.geometry.coordinates.reverse();
                    }

                    delete feature.properties.extendingEnd;
                    this.draw.add(feature);
                    needsUpdate = true;
                }
            });

            if (needsUpdate) {
                this.handleGeometryChange();
            }
        }
    }

    private handleCreate(e: { features: GeoJSON.Feature[] }): void {
        if (!e.features || e.features.length === 0) return;

        let createdId: string | null = null;

        e.features.forEach((feature) => {
            if (feature.id && feature.geometry) {
                const id = feature.id.toString();
                createdId = id;

                this.initializeFeatureProperties(id, feature.geometry.type);
            }
        });

        this.handleGeometryChange();

        if (createdId) {
            const targetId = createdId;
            setTimeout(() => {
                this.draw.changeMode('simple_select', { featureIds: [targetId] });

                this.selectedFeatureId = targetId;
                const fullFeature = this.draw.get(targetId);

                if (fullFeature) {
                    const props = fullFeature.properties || {};
                    this.updateActiveLayerPaint(props.color, props.widthMeters);

                    this.panelManager.inspectorPanel.open(fullFeature);
                    this.extensionHandleManager.setSelectedFeatureId(this.selectedFeatureId);
                    this.extensionHandleManager.updateHandles();
                }
            }, 0);
        }
    }

    private initializeFeatureProperties(id: string, geometryType: string): void {
        if (geometryType === 'Polygon') {
            this.draw.setFeatureProperty(id, 'infrastructureType', this.activePolygonConfig.infrastructureType);
            this.draw.setFeatureProperty(id, 'color', this.activePolygonConfig.color);
            this.draw.setFeatureProperty(id, 'fillOpacity', 1);
            this.draw.setFeatureProperty(id, 'smooth', this.activePolygonConfig.smooth);
            this.draw.setFeatureProperty(id, 'zIndex', this.activePolygonConfig.zIndex);
        } else if (geometryType === 'Point') {
            this.draw.setFeatureProperty(id, 'infrastructureType', this.activeSinglePointConfig.infrastructureType);
            this.draw.setFeatureProperty(id, 'color', this.activeSinglePointConfig.color);
            this.draw.setFeatureProperty(id, 'widthMeters', this.activeSinglePointConfig.widthMeters);
            this.draw.setFeatureProperty(id, 'rotation', this.activeSinglePointConfig.rotation);
            this.draw.setFeatureProperty(id, 'iconName', this.activeSinglePointConfig.iconName || '');
        } else { // LineString / Roads
            this.draw.setFeatureProperty(id, 'infrastructureType', this.activeConfig.infrastructureType);
            this.draw.setFeatureProperty(id, 'color', this.activeConfig.color);
            this.draw.setFeatureProperty(id, 'widthMeters', this.activeConfig.widthMeters);
            this.draw.setFeatureProperty(id, 'isDouble', this.activeConfig.isDouble);
            this.draw.setFeatureProperty(id, 'smooth', this.activeConfig.smooth);
            this.draw.setFeatureProperty(id, 'zIndex', this.activeConfig.zIndex);
        }

        this.draw.setFeatureProperty(id, 'createdAt', new Date().toISOString());
    }

    private handleGeometryChange(): void {
        const geojson = this.draw.getAll() as GeoJSON.FeatureCollection;

        const { lineFeatures, polygonFeatures, pointFeatures } = processGeometryFeatures(geojson, {
            activeConfig: this.activeConfig,
            activePolygonConfig: this.activePolygonConfig,
            activeSinglePointConfig: this.activeSinglePointConfig,
            polygonSmoothingEnabled: this.polygonSmoothingEnabled,
        });

        const roadsSource = this.map.getSource('roads-source') as any;
        if (roadsSource) {
            roadsSource.setData({ type: 'FeatureCollection', features: lineFeatures });
        }

        const polygonsSource = this.map.getSource('polygons-source') as any;
        if (polygonsSource) {
            polygonsSource.setData({ type: 'FeatureCollection', features: polygonFeatures });
        }

        const singlePointsSource = this.map.getSource('single-points-source') as any;
        if (singlePointsSource) {
            singlePointsSource.setData({ type: 'FeatureCollection', features: pointFeatures });
        }
    }

    public loadExistingRoads(geojson: GeoJSON.FeatureCollection): void {
        if (this.map.isStyleLoaded()) {
            this.draw.set(geojson);
        } else {
            this.map.once('load', () => this.draw.set(geojson));
        }
    }

    private setupKeybindings(): void {
        setupKeybindings({
            startDrawingRoad: (type) => this.startDrawingRoad(type),
            closeEverything: () => this.closeEverything(),
            trashDraw: () => this.draw.trash(),
            updateExtensionHandles: () => this.extensionHandleManager.updateHandles(),
        });
    }
    private setGlobalOverlayOpacity(opacity: number): void {
        ALL_ROAD_LINE_LAYERS.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.setPaintProperty(layerId, 'line-opacity', opacity);
            }
        });

        // Polygon layers (fill and outline)
        if (this.map.getLayer('polygons-native-layer')) {
            this.map.setPaintProperty(
                'polygons-native-layer',
                'fill-opacity',
                ['*', ['coalesce', ['get', 'fillOpacity'], 0.6], opacity] as any
            );
        }
        if (this.map.getLayer('polygons-native-outline-layer')) {
            this.map.setPaintProperty(
                'polygons-native-outline-layer',
                'line-opacity',
                ['*', 0.9, opacity] as any
            );
        }

        // Point layers
        if (this.map.getLayer('single-points-native-layer')) {
            this.map.setPaintProperty(
                'single-points-native-layer',
                'icon-opacity',
                ['*', ['coalesce', ['get', 'opacity'], 1], opacity] as any
            );
            this.map.setPaintProperty(
                'single-points-native-layer',
                'text-opacity',
                ['*', ['coalesce', ['get', 'opacity'], 1], opacity] as any
            );
        }
    }

    private fitMapToGeoJSON(geojson: GeoJSON.FeatureCollection): void {
        const bounds = getGeoJSONBounds(geojson);
        if (bounds) {
            this.map.fitBounds(bounds, { padding: 50, maxZoom: 19 });
        }
    }

    private closeEverything(): void {
        this.panelManager.closeAll();
        this.stopDrawing();
        this.selectedFeatureId = null;
        this.extensionHandleManager.hideHandles();
        this.measureTool.deactivate();
        this.splitTool.deactivate();
        this.rectSelectTool.deactivate();
        this.setDrawingCursorActive(false);
    }

    private handleLineExtension(featureIdToExtend: string, handleType: 'start' | 'end'): void {
        const feature = this.draw.get(featureIdToExtend);
        if (!feature || feature.geometry.type !== 'LineString') return;

        const props = feature.properties || {};

        this.activeConfig = {
            infrastructureType: props.infrastructureType || this.activeLineinfrastructureType,
            color: props.color || LINE_INFRASTRUCTURE_SPECS.bicycle_path.color,
            widthMeters: props.widthMeters || LINE_INFRASTRUCTURE_SPECS.bicycle_path.widthMeters,
            isDouble: !!props.isDouble,
            smooth: props.smooth ?? LINE_INFRASTRUCTURE_SPECS.bicycle_path.smooth,
            zIndex: props.zIndex ?? 50,
        };

        this.updateActiveLayerPaint(this.activeConfig.color, this.activeConfig.widthMeters);

        this.panelManager.inspectorPanel.close();
        this.selectedFeatureId = null;
        this.extensionHandleManager.hideHandles();

        const coords = [...feature.geometry.coordinates];

        if (handleType === 'start') {
            this.draw.setFeatureProperty(featureIdToExtend, 'extendingEnd', 'start');
            const startCoord = coords[0] as [number, number];
            coords.reverse();

            feature.geometry.coordinates = coords;
            feature.properties = { ...props, ...this.activeConfig };
            this.draw.add(feature);

            (this.draw.changeMode as any)('draw_line_string', {
                featureId: featureIdToExtend,
                from: startCoord,
            });
        } else {
            this.draw.setFeatureProperty(featureIdToExtend, 'extendingEnd', 'end');
            const endCoord = coords[coords.length - 1] as [number, number];

            feature.properties = { ...props, ...this.activeConfig };
            this.draw.add(feature);

            (this.draw.changeMode as any)('draw_line_string', {
                featureId: featureIdToExtend,
                from: endCoord,
            });
        }

        const allFeatures = (this.draw as any).getAll();
        allFeatures.features.forEach((f: any) => {
            if (f.id === featureIdToExtend || f.properties?.active === 'true') {
                this.draw.setFeatureProperty(f.id, 'color', this.activeConfig.color);
                this.draw.setFeatureProperty(f.id, 'widthMeters', this.activeConfig.widthMeters);
                this.draw.setFeatureProperty(f.id, 'isDouble', this.activeConfig.isDouble);
                this.draw.setFeatureProperty(f.id, 'infrastructureType', this.activeConfig.infrastructureType);
                this.draw.setFeatureProperty(f.id, 'smooth', this.activeConfig.smooth);
            }
        });
    }

    private showSnapIndicator(coord: [number, number]): void {
        const source = this.map.getSource('snap-indicator-source') as GeoJSONSource;
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Point',
                        coordinates: coord
                    }
                }]
            });
        }
    }

    private clearSnapIndicator(): void {
        const source = this.map.getSource('snap-indicator-source') as GeoJSONSource;
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: []
            });
        }
    }

    public moveSelectedFeatureZOrder(direction: 'up' | 'down'): void {
        if (!this.selectedFeatureId) return;

        const allFeatures = this.draw.getAll() as GeoJSON.FeatureCollection;
        const features = allFeatures.features;

        const currentFeature = features.find((f) => f.id?.toString() === this.selectedFeatureId);
        if (!currentFeature) return;

        // Initialize zIndex on all features if missing
        features.forEach((f) => {
            if (f.properties && f.properties.zIndex === undefined) {
                const defaultZ = 50;
                f.properties.zIndex = defaultZ;
                if (f.id) {
                    this.draw.setFeatureProperty(f.id.toString(), 'zIndex', defaultZ);
                }
            }
        });

        const currentZ = currentFeature.properties?.zIndex ?? 50;
        const newZ = direction === 'up' ? currentZ + 1 : currentZ - 1;

        this.draw.setFeatureProperty(this.selectedFeatureId, 'zIndex', newZ);

        this.draw.changeMode('simple_select', { featureIds: [this.selectedFeatureId] });
        this.handleGeometryChange();
        this.extensionHandleManager.updateHandles();
    }
}

export default RoadEditor;