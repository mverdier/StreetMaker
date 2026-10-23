import type { Map, MapMouseEvent } from 'maplibre-gl';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';

interface SplitToolOptions {
    map: Map;
    draw: MapboxDraw;
    onGeometryChange: () => void;
    onUpdateHandles: () => void;
    showSnapIndicator: (coord: [number, number]) => void;
    clearSnapIndicator: () => void;
}

export class SplitTool {
    private map: Map;
    private draw: MapboxDraw;
    private onGeometryChange: () => void;
    private onUpdateHandles: () => void;
    private showSnapIndicator: (coord: [number, number]) => void;
    private clearSnapIndicator: () => void;

    private isActive: boolean = false;
    private targetCandidate: { featureId: string; segmentIndex: number; splitCoord: [number, number] } | null = null;

    constructor(options: SplitToolOptions) {
        this.map = options.map;
        this.draw = options.draw;
        this.onGeometryChange = options.onGeometryChange;
        this.onUpdateHandles = options.onUpdateHandles;
        this.showSnapIndicator = options.showSnapIndicator;
        this.clearSnapIndicator = options.clearSnapIndicator;
    }

    public toggle(): void {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    public activate(): void {
        if (this.isActive) return;

        this.isActive = true;
        this.map.getCanvas().style.cursor = 'crosshair';
        this.draw.changeMode('simple_select');

        this.map.on('mousemove', this.handleMouseMove);
        this.map.on('click', this.handleClick);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    public deactivate(): void {
        if (!this.isActive) return;

        this.isActive = false;
        this.map.getCanvas().style.cursor = '';

        this.map.off('mousemove', this.handleMouseMove);
        this.map.off('click', this.handleClick);
        window.removeEventListener('keydown', this.handleKeyDown);

        this.targetCandidate = null;
        this.clearSnapIndicator();
    }

    private handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            this.deactivate();
        }
    };

    private handleMouseMove = (e: MapMouseEvent): void => {
        const all = this.draw.getAll();
        let closestCandidate: { featureId: string; segmentIndex: number; splitCoord: [number, number] } | null = null;
        let minDistancePx = 15; // 15px hover threshold to snap to segment

        for (const feature of all.features) {
            if (!feature.geometry || feature.geometry.type !== 'LineString') continue;
            const coords = feature.geometry.coordinates as [number, number][];

            for (let i = 0; i < coords.length - 1; i++) {
                const segProj = this.getClosestPointOnSegmentPixels(e.point, [coords[i], coords[i + 1]]);
                if (segProj.distancePx < minDistancePx) {
                    minDistancePx = segProj.distancePx;
                    closestCandidate = {
                        featureId: feature.id!.toString(),
                        segmentIndex: i,
                        splitCoord: segProj.coordinate,
                    };
                }
            }
        }

        this.targetCandidate = closestCandidate;
        if (closestCandidate) {
            this.showSnapIndicator(closestCandidate.splitCoord);
        } else {
            this.clearSnapIndicator();
        }
    };

    private handleClick = (_e: MapMouseEvent): void => {
        if (!this.targetCandidate) return;

        const { featureId, segmentIndex, splitCoord } = this.targetCandidate;
        const feature = this.draw.get(featureId);

        if (!feature || feature.geometry.type !== 'LineString') return;

        const coords = [...(feature.geometry.coordinates as [number, number][])];
        const properties = { ...feature.properties };

        const coords1 = coords.slice(0, segmentIndex + 1);
        coords1.push(splitCoord);

        const coords2 = [splitCoord, ...coords.slice(segmentIndex + 1)];

        if (coords1.length < 2 || coords2.length < 2) return;

        const feature1: GeoJSON.Feature = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords1 },
            properties: { ...properties, createdAt: new Date().toISOString() },
        };

        const feature2: GeoJSON.Feature = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords2 },
            properties: { ...properties, createdAt: new Date().toISOString() },
        };

        this.draw.delete(featureId);
        this.draw.add(feature1);
        this.draw.add(feature2);

        this.deactivate();
        this.onGeometryChange();
        this.onUpdateHandles();
    };

    /**
     * Projects a 2D line segment to screen pixel space and calculates nearest distance to cursor.
     */
    private getClosestPointOnSegmentPixels(
        mouse: { x: number; y: number },
        segment: [[number, number], [number, number]]
    ): { coordinate: [number, number]; distancePx: number } {
        const p1 = this.map.project(segment[0]);
        const p2 = this.map.project(segment[1]);

        const A = mouse.x - p1.x;
        const B = mouse.y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;

        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) {
            param = (A * C + B * D) / lenSq;
        }

        let xx: number, yy: number;
        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }

        const distancePx = Math.hypot(mouse.x - xx, mouse.y - yy);
        const unprojected = this.map.unproject([xx, yy]);

        return {
            coordinate: [unprojected.lng, unprojected.lat],
            distancePx,
        };
    }
}