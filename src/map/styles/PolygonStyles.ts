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
            'fill-outline-color': ['coalesce', ['get', 'color'], '#A39887'],
        },
    };
}