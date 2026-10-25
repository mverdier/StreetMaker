import type {AddLayerObject} from "maplibre-gl";

export function getNativePointLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    const scaleExpression = [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        10, [
            'max',
            ['case', ['==', ['get', 'infrastructureType'], 'traffic_light'], 0.005, 0.05],
            [
                '/',
                ['/', ['*', ['coalesce', ['get', 'widthMeters'], 1.5], pxPerMeterZoom20], ['case', ['==', ['get', 'infrastructureType'], 'traffic_light'], 330, 32]],
                Math.pow(2, 10)
            ]
        ],
        20, [
            '/',
            ['*', ['coalesce', ['get', 'widthMeters'], 1.5], pxPerMeterZoom20],
            ['case', ['==', ['get', 'infrastructureType'], 'traffic_light'], 330, 32]
        ],
        24, [
            '/',
            ['*', ['*', ['coalesce', ['get', 'widthMeters'], 1.5], pxPerMeterZoom20], 16],
            ['case', ['==', ['get', 'infrastructureType'], 'traffic_light'], 330, 32]
        ],
    ];

    return {
        id: 'single-points-native-layer',
        type: 'symbol',
        source: 'single-points-source',
        layout: {
            // Icon properties
            'icon-image': [
                'case',
                ['==', ['get', 'infrastructureType'], 'bus_label'], '',
                ['==', ['get', 'infrastructureType'], 'traffic_light'], 'traffic-light-icon',
                ['coalesce', ['get', 'iconName'], '']
            ],
            'icon-size': scaleExpression as any,
            'icon-rotate': ['coalesce', ['get', 'rotation'], 0],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-optional': true,

            // Text properties only for things that actually need text (like bus labels)
            'text-field': [
                'case',
                ['==', ['get', 'infrastructureType'], 'bus_label'], 'BUS',
                ''
            ],
            'text-font': ['Open Sans Semibold'],
            'text-size': 12,
            'text-rotate': ['coalesce', ['get', 'rotation'], 0],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'text-anchor': 'center',
            'text-optional': true,
        },
        paint: {
            'icon-color': '#ffffff',
            'icon-opacity': 1,
            'text-color': '#ffffff',
            'text-opacity': 1,
        },
    };
}