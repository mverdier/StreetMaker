import type { LineInfrastructureType } from '../../config/infrastructure';
import { LINE_INFRASTRUCTURE_SPECS } from '../../config/infrastructure';

export function getRoadStyles(activeType: LineInfrastructureType, pxPerMeterZoom20: number = 3.2): object[] {
    const activeSpec = LINE_INFRASTRUCTURE_SPECS[activeType];
    const centerPxPerMeter = Math.min(Math.max(pxPerMeterZoom20 * 0.1, 0.1), 0.5);

    return [
        // Inactive lines
        {
            id: 'gl-draw-line-inactive',
            type: 'line',
            filter: ['all', ['==', '$type', 'LineString'], ['!=', 'active', 'true'], ['!=', 'mode', 'static']],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': '#000000',
                'line-width': 1,
                'line-opacity': 0,
            },
        },

        // Active lines (Hidden so MapLibre's native layer handles live rendering)
        {
            id: 'gl-draw-line-active',
            type: 'line',
            filter: ['all', ['==', '$type', 'LineString'], ['==', 'active', 'true']],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': '#000000',
                'line-width': 1,
                'line-opacity': 0,
            },
        },

        // Active centreline
        {
            id: 'gl-draw-line-active-centerline',
            type: 'line',
            filter: [
                'all',
                ['==', ['geometry-type'], 'LineString'],
                ['==', ['get', 'active'], 'true'],
                ['==', ['get', 'isDouble'], true],
            ],
            layout: { 'line-cap': 'butt', 'line-join': 'round' },
            paint: {
                'line-color': '#ffffff',
                'line-width': [
                    'interpolate',
                    ['exponential', 2],
                    ['zoom'],
                    10, ['max', 0.5, ['/', ['*', ['coalesce', ['get', 'widthMeters'], activeSpec.widthMeters], centerPxPerMeter], Math.pow(2, 10)]],
                    20, ['*', ['coalesce', ['get', 'widthMeters'], activeSpec.widthMeters], centerPxPerMeter],
                    24, ['*', ['coalesce', ['get', 'widthMeters'], 0.3], pxPerMeterZoom20, 16],
                ],
                'line-dasharray': [2, 2],
            },
        },

        // Vertex control handles
        {
            id: 'gl-draw-polygon-and-line-vertex-active',
            type: 'circle',
            filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
            paint: {
                'circle-radius': 6,
                'circle-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#000000',
            },
        },

        // Mapbox draw polygon hiding
        {
            id: 'gl-draw-polygon-fill-inactive',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'active', 'true'], ['!=', 'mode', 'static']],
            paint: { 'fill-opacity': 0 },
        },
        {
            id: 'gl-draw-polygon-fill-active',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'true']],
            paint: { 'fill-opacity': 0 },
        },
        {
            id: 'gl-draw-polygon-stroke-inactive',
            type: 'line',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'active', 'true'], ['!=', 'mode', 'static']],
            paint: { 'line-opacity': 0 },
        },
        {
            id: 'gl-draw-polygon-stroke-active',
            type: 'line',
            filter: ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'true']],
            paint: { 'line-opacity': 0 },
        },

        {
            id: 'gl-draw-point-inactive',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['!=', 'active', 'true'], ['!=', 'mode', 'static']],
            paint: {
                'circle-radius': 18,
                'circle-color': '#000000',
                'circle-opacity': 0,
                'circle-stroke-width': 0,
            },
        },
        {
            id: 'gl-draw-point-active',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'active', 'true']],
            paint: {
                'circle-radius': 18,
                'circle-color': '#FCD56A',
                'circle-opacity': 0.6,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#333333',
            },
        },
    ];
}