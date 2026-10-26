import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';

interface RectangleSelectToolOptions {
    map: MapLibreMap;
    draw: MapboxDraw;
    onGeometryChange: () => void;
    onUpdateHandles: () => void;
    onHideHandles: () => void;
}

interface SelectedVertex {
    featureId: string;
    vertexIndex: number;
    coordinate: [number, number];
}

export class RectangleSelectTool {
    private map: MapLibreMap;
    private draw: MapboxDraw;
    private onGeometryChange: () => void;
    private onUpdateHandles: () => void;
    private onHideHandles: () => void;

    private isActive: boolean = false;
    private isDrawingBox: boolean = false;
    private startPoint: { x: number; y: number } | null = null;
    private currentRect: { x1: number; y1: number; x2: number; y2: number } | null = null;

    private selectedVertices: SelectedVertex[] = [];
    private isDraggingVertices: boolean = false;
    private dragStartMouse: { x: number; y: number } | null = null;

    constructor(options: RectangleSelectToolOptions) {
        this.map = options.map;
        this.draw = options.draw;
        this.onGeometryChange = options.onGeometryChange;
        this.onUpdateHandles = options.onUpdateHandles;
        this.onHideHandles = options.onHideHandles;

        this.initGlobalListeners();
    }

    public toggle(): void {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    public activate(): void {
        this.isActive = true;
        this.map.getCanvas().style.cursor = 'crosshair';
        this.draw.changeMode('simple_select');
        this.map.boxZoom.disable();
        this.map.dragPan.disable();
    }

    public deactivate(): void {
        this.isActive = false;
        this.map.getCanvas().style.cursor = '';
        this.map.boxZoom.enable();
        this.map.dragPan.enable();
        this.clearSelection();
    }

    public clearSelection(): void {
        this.selectedVertices = [];
        this.clearSelectionVisuals();
        this.onHideHandles();
    }

    public isToolActive(): boolean {
        return this.isActive;
    }

    private initGlobalListeners(): void {
        this.map.on('mousedown', this.handleMouseDown);
        this.map.on('mousemove', this.handleMouseMove);
        this.map.on('mouseup', this.handleMouseUp);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    private handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            if (this.selectedVertices.length > 0) {
                this.clearSelection();
            } else if (this.isActive) {
                this.deactivate();
            }
        }
    };

    private handleMouseDown = (e: MapMouseEvent): void => {
        const point = e.point;

        if (this.selectedVertices.length > 0 && this.isPointNearSelectedVertices(point)) {
            this.isDraggingVertices = true;
            this.dragStartMouse = { x: point.x, y: point.y };
            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
            this.map.dragPan.disable();
            return;
        }

        if (this.isActive) {
            this.isDrawingBox = true;
            this.startPoint = { x: point.x, y: point.y };
            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
            this.clearSelection();
            return;
        }

        if (this.selectedVertices.length > 0) {
            this.clearSelection();
        }
    };

    private handleMouseMove = (e: MapMouseEvent): void => {
        const point = e.point;

        if (this.isDraggingVertices && this.dragStartMouse) {
            const dx = point.x - this.dragStartMouse.x;
            const dy = point.y - this.dragStartMouse.y;
            this.dragStartMouse = { x: point.x, y: point.y };

            this.translateSelectedVertices(dx, dy);
            return;
        }

        // Drawing selection box
        if (this.isDrawingBox && this.startPoint) {
            this.currentRect = {
                x1: Math.min(this.startPoint.x, point.x),
                y1: Math.min(this.startPoint.y, point.y),
                x2: Math.max(this.startPoint.x, point.x),
                y2: Math.max(this.startPoint.y, point.y),
            };
            this.updateBoxSource();
        }
    };

    private handleMouseUp = (_e: MapMouseEvent): void => {
        if (this.isDraggingVertices) {
            this.isDraggingVertices = false;
            this.dragStartMouse = null;
            this.map.dragPan.enable();
            return;
        }

        if (this.isDrawingBox && this.currentRect) {
            this.isDrawingBox = false;
            this.evaluateRectSelection();
            this.currentRect = null;
            this.clearBoxSource();

            this.isActive = false;
            this.map.getCanvas().style.cursor = '';
            this.map.boxZoom.enable();
            this.map.dragPan.enable();
        }
    };

    private evaluateRectSelection(): void {
        if (!this.currentRect) return;
        const all = this.draw.getAll();
        const found: SelectedVertex[] = [];

        for (const feature of all.features) {
            if (!feature.geometry || feature.geometry.type !== 'LineString') continue;
            const coords = feature.geometry.coordinates as [number, number][];
            const featureId = feature.id!.toString();

            for (let i = 0; i < coords.length; i++) {
                const screenPt = this.map.project(coords[i]);
                if (
                    screenPt.x >= this.currentRect.x1 &&
                    screenPt.x <= this.currentRect.x2 &&
                    screenPt.y >= this.currentRect.y1 &&
                    screenPt.y <= this.currentRect.y2
                ) {
                    found.push({
                        featureId,
                        vertexIndex: i,
                        coordinate: coords[i],
                    });
                }
            }
        }

        this.selectedVertices = found;
        this.updateVertexSelectionVisuals();
    }

    private isPointNearSelectedVertices(point: { x: number; y: number }): boolean {
        return this.selectedVertices.some((v) => {
            const screenPt = this.map.project(v.coordinate);
            return Math.hypot(screenPt.x - point.x, screenPt.y - point.y) <= 15;
        });
    }

    private translateSelectedVertices(dx: number, dy: number): void {
        // Calculate new coordinates for each selected vertex
        this.selectedVertices = this.selectedVertices.map((v) => {
            const currentScreen = this.map.project(v.coordinate);
            const newUnprojected = this.map.unproject([currentScreen.x + dx, currentScreen.y + dy]);
            return {
                ...v,
                coordinate: [newUnprojected.lng, newUnprojected.lat],
            };
        });

        // Update parent features in MapboxDraw so lines stretch smoothly
        const affectedFeatureIds = new Set(this.selectedVertices.map((v) => v.featureId));

        for (const featureId of affectedFeatureIds) {
            const feature = this.draw.get(featureId);
            if (!feature || feature.geometry.type !== 'LineString') continue;

            const coords = [...(feature.geometry.coordinates as [number, number][])];

            const featureVertices = this.selectedVertices.filter((v) => v.featureId === featureId);
            for (const fv of featureVertices) {
                coords[fv.vertexIndex] = fv.coordinate;
            }

            feature.geometry.coordinates = coords;
            this.draw.add(feature);
        }

        this.updateVertexSelectionVisuals();
        this.onGeometryChange();
        this.onUpdateHandles();
    }

    private updateBoxSource(): void {
        if (!this.currentRect) return;
        const p1 = this.map.unproject([this.currentRect.x1, this.currentRect.y1]);
        const p2 = this.map.unproject([this.currentRect.x2, this.currentRect.y1]);
        const p3 = this.map.unproject([this.currentRect.x2, this.currentRect.y2]);
        const p4 = this.map.unproject([this.currentRect.x1, this.currentRect.y2]);

        const source = this.map.getSource('rect-select-box-source') as any;
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[[p1.lng, p1.lat], [p2.lng, p2.lat], [p3.lng, p3.lat], [p4.lng, p4.lat], [p1.lng, p1.lat]]]
                    },
                    properties: {}
                }]
            });
        }
    }

    private clearBoxSource(): void {
        const source = this.map.getSource('rect-select-box-source') as any;
        if (source) {
            source.setData({ type: 'FeatureCollection', features: [] });
        }
    }

    private updateVertexSelectionVisuals(): void {
        const source = this.map.getSource('rect-select-vertices-source') as any;
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: this.selectedVertices.map((v) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: v.coordinate },
                    properties: {}
                }))
            });
        }
    }

    private clearSelectionVisuals(): void {
        this.clearBoxSource();
        const source = this.map.getSource('rect-select-vertices-source') as any;
        if (source) {
            source.setData({ type: 'FeatureCollection', features: [] });
        }
    }
}