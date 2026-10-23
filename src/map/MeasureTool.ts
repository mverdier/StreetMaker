import { Map, Marker, Popup, MapMouseEvent } from 'maplibre-gl';
import { calculateHaversineDistance, formatDistance } from '../utils/GeoMath';

export class MeasureTool {
    private map: Map;
    private isActive = false;
    private startPoint: [number, number] | null = null;

    private markers: Marker[] = [];
    private distancePopup: Popup | null = null;

    private readonly SOURCE_ID = 'measure-tool-source';
    private readonly LAYER_ID = 'measure-tool-layer';

    constructor(map: Map) {
        this.map = map;
        this.initLayers();
    }

    private initLayers(): void {
        if (!this.map.getSource(this.SOURCE_ID)) {
            this.map.addSource(this.SOURCE_ID, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
            });
        }

        if (!this.map.getLayer(this.LAYER_ID)) {
            this.map.addLayer({
                id: this.LAYER_ID,
                type: 'line',
                source: this.SOURCE_ID,
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: {
                    'line-color': '#FF8C00',
                    'line-width': 3,
                    'line-dasharray': [2, 2],
                },
            });
        }
    }

    public isActiveTool(): boolean {
        return this.isActive;
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

        this.map.on('click', this.handleMapClick);
        this.map.on('mousemove', this.handleMouseMove);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    public deactivate(): void {
        this.isActive = false;
        this.map.getCanvas().style.cursor = '';

        this.map.off('click', this.handleMapClick);
        this.map.off('mousemove', this.handleMouseMove);
        window.removeEventListener('keydown', this.handleKeyDown);

        this.clearGraphics();
    }

    private createDotMarker(coords: [number, number]): Marker {
        const el = document.createElement('div');
        el.className = 'measure-marker-dot';
        el.style.cssText = 'width: 12px; height: 12px; background: #FF8C00; border: 2px solid white; border-radius: 50%; pointer-events: none;';

        const marker = new Marker({ element: el })
            .setLngLat(coords)
            .addTo(this.map);

        this.markers.push(marker);
        return marker;
    }

    private handleMapClick = (e: MapMouseEvent): void => {
        const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];

        if (!this.startPoint) {
            this.clearGraphics();

            this.startPoint = coords;
            this.createDotMarker(coords);

        } else {
            const distance = calculateHaversineDistance(this.startPoint, coords);

            this.updateLine(this.startPoint, coords);
            this.createDotMarker(coords);

            this.showTooltip(coords, formatDistance(distance));

            this.startPoint = null;
        }
    };

    private handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            this.deactivate();
        }
    };

    private handleMouseMove = (e: MapMouseEvent): void => {
        if (!this.startPoint) return;

        const currentCoords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        const distance = calculateHaversineDistance(this.startPoint, currentCoords);

        this.updateLine(this.startPoint, currentCoords);
        this.showTooltip(currentCoords, formatDistance(distance));
    };

    private updateLine(p1: [number, number], p2: [number, number]): void {
        const source = this.map.getSource(this.SOURCE_ID) as any;
        if (source) {
            source.setData({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [p1, p2],
                },
                properties: {},
            });
        }
    }

    private showTooltip(coords: [number, number], text: string): void {
        if (!this.distancePopup) {
            this.distancePopup = new Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 15,
                className: 'measure-tooltip',
            });
        }

        this.distancePopup
            .setLngLat(coords)
            .setHTML(`<strong>${text}</strong>`)
            .addTo(this.map);
    }

    /**
     * Completely removes all created dot markers, popups, and canvas lines from the map.
     */
    public clearGraphics(): void {
        this.startPoint = null;

        this.markers.forEach((marker) => marker.remove());
        this.markers = [];

        if (this.distancePopup) {
            this.distancePopup.remove();
            this.distancePopup = null;
        }

        const source = this.map.getSource(this.SOURCE_ID) as any;
        if (source) {
            source.setData({ type: 'FeatureCollection', features: [] });
        }
    }
}