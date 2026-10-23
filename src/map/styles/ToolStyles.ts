import type { AddLayerObject, GeoJSONSourceSpecification } from 'maplibre-gl';

export const SNAP_INDICATOR_SOURCE_ID = 'snap-indicator-source';
export const RECT_SELECT_BOX_SOURCE_ID = 'rect-select-box-source';
export const RECT_SELECT_VERTICES_SOURCE_ID = 'rect-select-vertices-source';

export function getSnapIndicatorSourceSpec(): GeoJSONSourceSpecification {
    return {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    };
}

export function getSnapIndicatorLayerSpec(): AddLayerObject {
    return {
        id: 'snap-indicator-layer',
        type: 'circle',
        source: SNAP_INDICATOR_SOURCE_ID,
        paint: {
            'circle-radius': 10,
            'circle-color': 'transparent',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#FCD56A',
            'circle-opacity': 0.9,
        },
    };
}

export function getRectSelectBoxSourceSpec(): GeoJSONSourceSpecification {
    return {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    };
}

export function getRectSelectBoxLayerSpec(): AddLayerObject {
    return {
        id: 'rect-select-box-layer',
        type: 'fill',
        source: RECT_SELECT_BOX_SOURCE_ID,
        paint: {
            'fill-color': '#FCD56A',
            'fill-opacity': 0.2,
            'fill-outline-color': '#FCD56A',
        },
    };
}

export function getRectSelectVerticesSourceSpec(): GeoJSONSourceSpecification {
    return {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
    };
}

export function getRectSelectVerticesLayerSpec(): AddLayerObject {
    return {
        id: 'rect-select-vertices-layer',
        type: 'circle',
        source: RECT_SELECT_VERTICES_SOURCE_ID,
        paint: {
            'circle-radius': 7,
            'circle-color': '#FCD56A',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF',
        },
    };
}