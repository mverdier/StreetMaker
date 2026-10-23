import type { AddLayerObject } from 'maplibre-gl';

export function getNativePolygonLayerSpec(): AddLayerObject {
    return {
        id: 'polygons-native-layer',
        type: 'fill',
        source: 'polygons-source',
        layout: {
            'fill-sort-key': ['coalesce', ['get', 'zIndex'], 50],
        },
        paint: {
            'fill-color': ['coalesce', ['get', 'color'], '#A39887'],
            'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 1],
        },
    };
}

export function getNativePolygonOutlineLayerSpec(): AddLayerObject {
    return {
        id: 'polygons-native-outline-layer',
        type: 'line',
        source: 'polygons-source',
        layout: {
            'line-cap': 'round',
            'line-join': 'round',
            'line-sort-key': ['coalesce', ['get', 'zIndex'], 50],
        },
        paint: {
            'line-color': ['coalesce', ['get', 'color'], '#A39887'],
            'line-width': 2,
            'line-opacity': 1,
        },
    };
}