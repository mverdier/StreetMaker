import type { AddLayerObject } from 'maplibre-gl';

export function getNativeRoadLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    const dynamicWidth = [
        'coalesce',
        ['get', 'widthMeters'],
        [
            'case',
            ['all', ['==', ['get', 'infrastructureType'], 'tram_tracks'], ['==', ['get', 'isDouble'], true]], 6.13,
            ['==', ['get', 'infrastructureType'], 'tram_tracks'], 3.065,
            1.8
        ]
    ];

    return {
        id: 'roads-native-layer',
        type: 'line',
        source: 'roads-source',
        filter: [
            'all',
            ['!=', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'pedestrian_crossing'],
            ['!=', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'square_markings'],
            ['!=', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'continuous_line'],
            ['!=', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'triangle_markings'],
            ['!=', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'dashed_line'],
        ],
        layout: {
            'line-cap': 'round',
            'line-join': 'round',
            'line-sort-key': ['coalesce', ['get', 'zIndex'], 50]
        },
        paint: {
            'line-color': [
                'case',
                ['==', ['get', 'infrastructureType'], 'tram_tracks'], ['coalesce', ['get', 'color'], '#948D79'],
                ['coalesce', ['get', 'color'], '#B85D4D']
            ] as any,
            'line-width': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10, ['max', 1, ['/', ['*', dynamicWidth, pxPerMeterZoom20], Math.pow(2, 10)]],
                20, ['*', dynamicWidth, pxPerMeterZoom20],
                24, ['*', dynamicWidth, pxPerMeterZoom20, 16],
            ] as any,
            'line-opacity': 1,
        },
    };
}

export function getNativeRoadCenterlineLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    const centerPxPerMeter = Math.min(Math.max(pxPerMeterZoom20 * 0.1, 0.1), 0.5);
    return {
        id: 'roads-native-centerline-layer',
        type: 'line',
        source: 'roads-source',
        filter: [
            'all',
            ['==', ['get', 'isDouble'], true],
            ['!=', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'tram_tracks'],
        ],
        layout: {
            'line-cap': 'butt',
            'line-join': 'round',
            'line-sort-key': ['coalesce', ['get', 'zIndex'], 50]
        },
        paint: {
            'line-color': '#ffffff',
            'line-width': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10, ['max', 0.5, ['/', ['*', ['coalesce', ['get', 'widthMeters'], 1.8], centerPxPerMeter], Math.pow(2, 10)]],
                20, ['*', ['coalesce', ['get', 'widthMeters'], 1.8], centerPxPerMeter],
                24, ['*', ['coalesce', ['get', 'widthMeters'], 1.8], centerPxPerMeter, 16],
            ],
            'line-dasharray': [2, 2],
        },
    };
}

export function getNativePedestrianCrossingLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    return {
        id: 'roads-native-crossing-layer',
        type: 'line',
        source: 'roads-source',
        filter: ['==', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'pedestrian_crossing'],
        layout: {
            'line-cap': 'butt',
            'line-join': 'miter',
            'line-sort-key': ['coalesce', ['get', 'zIndex'], 50]
        },
        paint: {
            'line-color': ['coalesce', ['get', 'color'], '#ffffff'],
            'line-width': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10, ['max', 1, ['/', ['*', ['coalesce', ['get', 'widthMeters'], 1.8], pxPerMeterZoom20], Math.pow(2, 10)]],
                20, ['*', ['coalesce', ['get', 'widthMeters'], 1.8], pxPerMeterZoom20],
                24, ['*', ['coalesce', ['get', 'widthMeters'], 0.3], pxPerMeterZoom20, 16],
            ],
            'line-dasharray': [0.1667, 0.1667],
            'line-opacity': 1,
        },
    };
}

export function getNativeSquareMarkingsLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    return {
        id: 'roads-native-square-markings-layer',
        type: 'line',
        source: 'roads-source',
        filter: ['==', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'square_markings'],
        layout: {
            'line-cap': 'butt',
            'line-join': 'miter',
            'line-sort-key': ['coalesce', ['get', 'zIndex'], 50]
        },
        paint: {
            'line-color': ['coalesce', ['get', 'color'], '#ffffff'],
            'line-width': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10, ['max', 1, ['/', ['*', ['coalesce', ['get', 'widthMeters'], 0.3], pxPerMeterZoom20], Math.pow(2, 10)]],
                20, ['*', ['coalesce', ['get', 'widthMeters'], 0.3], pxPerMeterZoom20],
                24, ['*', ['coalesce', ['get', 'widthMeters'], 0.3], pxPerMeterZoom20, 16],
            ],
            'line-dasharray': [1, 1],
            'line-opacity': 1,
        },
    };
}

export function getNativeContinuousLineLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    return {
        id: 'roads-native-continuous-line-layer',
        type: 'line',
        source: 'roads-source',
        filter: ['==', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'continuous_line'],
        layout: {
            'line-cap': 'butt',
            'line-join': 'miter',
            'line-sort-key': ['coalesce', ['get', 'zIndex'], 50]
        },
        paint: {
            'line-color': ['coalesce', ['get', 'color'], '#ffffff'],
            'line-width': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10, ['max', 1, ['/', ['*', ['coalesce', ['get', 'widthMeters'], 0.4], pxPerMeterZoom20], Math.pow(2, 10)]],
                20, ['*', ['coalesce', ['get', 'widthMeters'], 0.4], pxPerMeterZoom20],
                24, ['*', ['coalesce', ['get', 'widthMeters'], 0.3], pxPerMeterZoom20, 16],
            ],
            'line-opacity': 1,
        },
    };
}

export function getNativeTriangleMarkingsLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    return {
        id: 'roads-native-markings-triangle-layer',
        type: 'line',
        source: 'roads-source',
        filter: ['==', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'triangle_markings'],
        layout: {
            'line-cap': 'butt',
            'line-join': 'miter',
            'line-sort-key': ['coalesce', ['get', 'zIndex'], 50]
        },
        paint: {
            'line-width': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10, ['max', 2, ['/', ['*', ['coalesce', ['get', 'widthMeters'], 0.4], pxPerMeterZoom20], Math.pow(2, 10)]],
                20, ['*', ['coalesce', ['get', 'widthMeters'], 0.4], pxPerMeterZoom20],
                24, ['*', ['coalesce', ['get', 'widthMeters'], 0.3], pxPerMeterZoom20, 16],
            ],
            'line-pattern': 'triangle-markings-pattern',
            'line-opacity': 1,
        },
    };
}

export function getNativeDashedLineLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    return {
        id: 'roads-native-dashed-line-layer',
        type: 'line',
        source: 'roads-source',
        filter: ['==', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'dashed_line'],
        layout: {
            'line-cap': 'butt',
            'line-join': 'miter',
            'line-sort-key': ['coalesce', ['get', 'zIndex'], 50]
        },
        paint: {
            'line-color': ['coalesce', ['get', 'color'], '#ffffff'],
            'line-width': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10, ['max', 1, ['/', ['*', ['coalesce', ['get', 'widthMeters'], 0.4], pxPerMeterZoom20], Math.pow(2, 10)]],
                20, ['*', ['coalesce', ['get', 'widthMeters'], 0.4], pxPerMeterZoom20],
                24, ['*', ['coalesce', ['get', 'widthMeters'], 0.3], pxPerMeterZoom20, 16],
            ],
            'line-dasharray': [2, 2],
            'line-opacity': 1,
        },
    };
}

// Tram rail overlays

export function getNativeSingleTramRailLeftLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    return {
        id: 'roads-native-single-tram-rail-left-layer',
        type: 'line',
        source: 'roads-source',
        filter: ['all', ['==', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'tram_tracks'], ['!=', ['get', 'isDouble'], true]],
        layout: { 'line-cap': 'butt', 'line-join': 'round', 'line-sort-key': ['coalesce', ['get', 'zIndex'], 50] },
        paint: {
            'line-color': '#595959',
            'line-width': ['interpolate', ['exponential', 2], ['zoom'], 10, 0.5, 20, 0.12 * pxPerMeterZoom20, 24, 0.12 * pxPerMeterZoom20 * 16],
            'line-offset': getMeterOffsetExpression(-0.7175, pxPerMeterZoom20),
            'line-opacity': 1,
        },
    };
}

export function getNativeSingleTramRailRightLayerSpec(pxPerMeterZoom20: number): AddLayerObject {
    return {
        id: 'roads-native-single-tram-rail-right-layer',
        type: 'line',
        source: 'roads-source',
        filter: ['all', ['==', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'tram_tracks'], ['!=', ['get', 'isDouble'], true]],
        layout: { 'line-cap': 'butt', 'line-join': 'round', 'line-sort-key': ['coalesce', ['get', 'zIndex'], 50] },
        paint: {
            'line-color': '#595959',
            'line-width': ['interpolate', ['exponential', 2], ['zoom'], 10, 0.5, 20, 0.12 * pxPerMeterZoom20, 24, 0.12 * pxPerMeterZoom20 * 16],
            'line-offset': getMeterOffsetExpression(0.7175, pxPerMeterZoom20),
            'line-opacity': 1,
        },
    };
}

export function getNativeDoubleTramRailsLayerSpec(pxPerMeterZoom20: number): AddLayerObject[] {
    const railOffsets = [-2.25, -0.815, 0.815, 2.25];
    return railOffsets.map((offset, index) => ({
        id: `roads-native-double-tram-rail-${index}`,
        type: 'line' as const,
        source: 'roads-source',
        filter: ['all', ['==', ['coalesce', ['get', 'infrastructureType'], 'bicycle_path'], 'tram_tracks'], ['==', ['get', 'isDouble'], true]],
        layout: { 'line-cap': 'butt' as const, 'line-join': 'round' as const, 'line-sort-key': ['coalesce', ['get', 'zIndex'], 50] },
        paint: {
            'line-color': '#595959',
            'line-width': ['interpolate', ['exponential', 2], ['zoom'], 10, 0.5, 20, 0.12 * pxPerMeterZoom20, 24, 0.12 * pxPerMeterZoom20 * 16],
            'line-offset': getMeterOffsetExpression(offset, pxPerMeterZoom20),
            'line-opacity': 1,
        },
    }));
}

function getMeterOffsetExpression(offsetMeters: number, pxPerMeterZoom20: number) {
    return [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        10, ['/', ['*', offsetMeters * pxPerMeterZoom20, 1], Math.pow(2, 10)],
        20, offsetMeters * pxPerMeterZoom20,
        24, offsetMeters * pxPerMeterZoom20 * 16,
    ] as any;
}