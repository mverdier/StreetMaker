import { Map } from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { getMetersPerPixelAtZoom } from '../utils/GeoMath';
import { LINE_INFRASTRUCTURE_SPECS } from '../config/infrastructure';

export interface ExtensionHandleManagerOptions {
    map: Map;
    draw: MapboxDraw;
    onExtend: (featureId: string, handleType: 'start' | 'end', startCoord: [number, number]) => void;
}

export class ExtensionHandleManager {
    private map: Map;
    private draw: MapboxDraw;
    private onExtend: (featureId: string, handleType: 'start' | 'end', coord: [number, number]) => void;
    private selectedFeatureId: string | null = null;

    constructor(options: ExtensionHandleManagerOptions) {
        this.map = options.map;
        this.draw = options.draw;
        this.onExtend = options.onExtend;

        this.initInteractions();
    }

    public setSelectedFeatureId(id: string | null): void {
        this.selectedFeatureId = id;
        this.updateHandles();
    }

    public hideHandles(): void {
        const source = this.map.getSource('extension-handles-source') as any;
        if (source) {
            source.setData({ type: 'FeatureCollection', features: [] });
        }
    }

    public updateHandles(): void {
        const source = this.map.getSource('extension-handles-source') as any;
        if (!source) return;

        if (!this.selectedFeatureId) {
            source.setData({ type: 'FeatureCollection', features: [] });
            return;
        }

        const feature = this.draw.get(this.selectedFeatureId);
        if (!feature || feature.geometry.type !== 'LineString') {
            source.setData({ type: 'FeatureCollection', features: [] });
            return;
        }

        const coords = feature.geometry.coordinates;
        if (coords.length < 2) {
            source.setData({ type: 'FeatureCollection', features: [] });
            return;
        }

        const props = feature.properties || {};
        const widthMeters = props.widthMeters || LINE_INFRASTRUCTURE_SPECS.bicycle_path.widthMeters;
        const zoom = this.map.getZoom();

        // Start handle
        const pStart = coords[0] as [number, number];
        const pNext = coords[1] as [number, number];
        const sStart = this.map.project(pStart);
        const sNext = this.map.project(pNext);

        const dxStart = sStart.x - sNext.x;
        const dyStart = sStart.y - sNext.y;
        const lenStart = Math.hypot(dxStart, dyStart);
        const uxStart = lenStart > 0 ? dxStart / lenStart : 1;
        const uyStart = lenStart > 0 ? dyStart / lenStart : 0;

        const metersPerPixelStart = getMetersPerPixelAtZoom(zoom, pStart[1], 512);
        const pxPerMeterStart = metersPerPixelStart > 0 ? 1 / metersPerPixelStart : 10;
        const offsetPixelsStart = 1.5 * widthMeters * pxPerMeterStart;

        const sExtStart: [number, number] = [
            sStart.x + offsetPixelsStart * uxStart,
            sStart.y + offsetPixelsStart * uyStart,
        ];
        const geoExtStart = this.map.unproject(sExtStart);

        // End handle
        const pEnd = coords[coords.length - 1] as [number, number];
        const pPrev = coords[coords.length - 2] as [number, number];
        const sEnd = this.map.project(pEnd);
        const sPrev = this.map.project(pPrev);

        const dxEnd = sEnd.x - sPrev.x;
        const dyEnd = sEnd.y - sPrev.y;
        const lenEnd = Math.hypot(dxEnd, dyEnd);
        const uxEnd = lenEnd > 0 ? dxEnd / lenEnd : 1;
        const uyEnd = lenEnd > 0 ? dyEnd / lenEnd : 0;

        const metersPerPixelEnd = getMetersPerPixelAtZoom(zoom, pEnd[1], 512);
        const pxPerMeterEnd = metersPerPixelEnd > 0 ? 1 / metersPerPixelEnd : 10;
        const offsetPixelsEnd = 1.5 * widthMeters * pxPerMeterEnd;

        const sExtEnd: [number, number] = [
            sEnd.x + offsetPixelsEnd * uxEnd,
            sEnd.y + offsetPixelsEnd * uyEnd,
        ];
        const geoExtEnd = this.map.unproject(sExtEnd);

        source.setData({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: { handleType: 'start' },
                    geometry: { type: 'Point', coordinates: [geoExtStart.lng, geoExtStart.lat] },
                },
                {
                    type: 'Feature',
                    properties: { handleType: 'end' },
                    geometry: { type: 'Point', coordinates: [geoExtEnd.lng, geoExtEnd.lat] },
                },
            ],
        });
    }

    private initInteractions(): void {
        const handleLayers = ['road-extension-handle-circle', 'road-extension-handle-symbol'];

        handleLayers.forEach((layerId) => {
            this.map.on('mouseenter', layerId, () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });
            this.map.on('mouseleave', layerId, () => {
                this.map.getCanvas().style.cursor = '';
            });
        });

        this.map.on('click', 'road-extension-handle-circle', (e) => {
            if (!this.selectedFeatureId || !e.features || e.features.length === 0) return;

            const handleFeature = e.features[0];
            const handleType = handleFeature.properties?.handleType;
            const featureIdToExtend = this.selectedFeatureId;

            const feature = this.draw.get(featureIdToExtend);
            if (!feature || feature.geometry.type !== 'LineString') return;

            const coords = [...feature.geometry.coordinates];
            const targetCoord = handleType === 'start' ? (coords[0] as [number, number]) : (coords[coords.length - 1] as [number, number]);

            this.onExtend(featureIdToExtend, handleType, targetCoord);
        });

        this.map.on('move', () => this.updateHandles());
        this.map.on('zoom', () => this.updateHandles());
    }
}