import type { AddLayerObject } from 'maplibre-gl';

export function getNativePointLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    const scaleExpression = [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        10, ['max', 0.05, ['/', ['/', ['*', ['coalesce', ['get', 'widthMeters'], 1.5], pxPerMeterZoom20], 32], Math.pow(2, 10)]],
        20, ['/', ['*', ['coalesce', ['get', 'widthMeters'], 1.5], pxPerMeterZoom20], 32],
        24, ['/', ['*', ['*', ['coalesce', ['get', 'widthMeters'], 1.5], pxPerMeterZoom20], 16], 32],
    ];

    return {
        id: 'single-points-native-layer',
        type: 'symbol',
        source: 'single-points-source',
        layout: {
            // Icon properties (arrows etc)
            'icon-image': [
                'case',
                ['==', ['get', 'infrastructureType'], 'bus_label'], '',
                ['coalesce', ['get', 'iconName'], '']
            ],
            'icon-size': scaleExpression as any,
            'icon-rotate': ['coalesce', ['get', 'rotation'], 0],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-optional': true,

            // Text properties (for text labels)
            'text-field': [
                'case',
                ['==', ['get', 'infrastructureType'], 'bus_label'], 'BUS',
                ''
            ],
            'text-font': ['Open Sans Semibold'],
            'text-size': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10, ['*', ['coalesce', ['get', 'widthMeters'], 1.5], 2],
                20, ['*', ['coalesce', ['get', 'widthMeters'], 1.5], 8],
                24, ['*', ['coalesce', ['get', 'widthMeters'], 1.5], 16],
            ],
            'text-rotate': ['coalesce', ['get', 'rotation'], 0],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'text-anchor': 'center',
            'text-optional': true,
        },
        paint: {
            // Icon paint
            'icon-color': ['coalesce', ['get', 'color'], '#ffffff'],
            'icon-opacity': 1,

            // Text paint (with a dark halo for high contrast on satellite maps)
            'text-color': ['coalesce', ['get', 'color'], '#ffffff'],
            'text-halo-color': '#000000',
            'text-halo-width': 1.5,
            'text-opacity': 1,
        },
    };
}