import type { AddLayerObject } from 'maplibre-gl';

export function getExtensionHandleLayers(): AddLayerObject[] {
    return [
        {
            id: 'road-extension-handle-circle',
            type: 'circle',
            source: 'extension-handles-source',
            paint: {
                'circle-radius': 10,
                'circle-color': '#FCD56A',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#333333',
                'circle-opacity': 0.9,
            },
        },
        {
            id: 'road-extension-handle-symbol',
            type: 'symbol',
            source: 'extension-handles-source',
            layout: {
                'text-field': '+',
                'text-size': 10,
                'text-font': ['Open Sans Semibold'],
                'text-allow-overlap': true,
            },
            paint: {
                'text-color': '#333333',
            },
        },
    ];
}