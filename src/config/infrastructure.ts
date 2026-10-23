// LINE INFRASTRUCTURE
export type LineInfrastructureType =
    | 'bicycle_path'
    | 'roadway'
    | 'tram_tracks'
    | 'pedestrian_crossing'
    | 'square_markings'
    | 'continuous_line'
    | 'triangle_markings'
    | 'dashed_line';

export const LANE_TYPES: LineInfrastructureType[] = [
    'bicycle_path',
    'roadway',
    'tram_tracks',
];

export const MARKING_TYPES: LineInfrastructureType[] = [
    'pedestrian_crossing',
    'square_markings',
    'continuous_line',
    'triangle_markings',
    'dashed_line',
];

export interface LineInfrastructureConfig {
    color: string;
    widthMeters: number;
    isDouble: boolean;
    smooth: boolean;
}

export const LINE_INFRASTRUCTURE_SPECS: Record<LineInfrastructureType, LineInfrastructureConfig> = {
    bicycle_path: {
        color: '#B85D4D',
        widthMeters: 2.3,
        isDouble: false,
        smooth: true,
    },
    roadway: {
        color: '#615D5C',
        widthMeters: 3.0,
        isDouble: false,
        smooth: true,
    },
    tram_tracks: {
        color: '#948D79',
        widthMeters: 2.9, // 1.435m standard gauge + spacing (approx)
        isDouble: false,
        smooth: true,
    },
    pedestrian_crossing: {
        color: '#ffffff',
        widthMeters: 6,
        isDouble: false,
        smooth: false,
    },
    square_markings: {
        color: '#ffffff',
        widthMeters: 0.5,
        isDouble: false,
        smooth: true,
    },
    continuous_line: {
        color: '#ffffff',
        widthMeters: 0.2,
        isDouble: false,
        smooth: true,
    },
    triangle_markings: {
        color: '#ffffff',
        widthMeters: 0.6,
        isDouble: false,
        smooth: true,
    },
    dashed_line: {
        color: '#ffffff',
        widthMeters: 0.3,
        isDouble: false,
        smooth: true,
    },
};

// POLYGON INFRASTRUCTURE
export type PolygonInfrastructureType = 'sidewalk';

export interface PolygonInfrastructureConfig {
    color: string;
    fillOpacity: number;
    smooth: boolean;
}

export const POLYGON_INFRASTRUCTURE_SPECS: Record<PolygonInfrastructureType, PolygonInfrastructureConfig> = {
    sidewalk: {
        color: '#A39887',
        fillOpacity: 1,
        smooth: false
    },
};

// SINGLE POINT INFRASTRUCTURE
export type PointInfrastructureType = 'arrow_left' | 'arrow_forward' | 'arrow_right' | 'bus_label';

export interface PointInfrastructureConfig {
    color: string;
    widthMeters: number;
    rotation: number;
}

export const POINT_INFRASTRUCTURE_SPECS: Record<PointInfrastructureType, PointInfrastructureConfig> = {
    arrow_left: { color: '#ffffff', widthMeters: 3.0, rotation: 0 },
    arrow_forward: { color: '#ffffff', widthMeters: 3.0, rotation: 0 },
    arrow_right: { color: '#ffffff', widthMeters: 3.0, rotation: 0 },
    bus_label: { color: '#ffffff', widthMeters: 2.5, rotation: 0 },
};

export const SINGLE_POINT_TYPES: PointInfrastructureType[] = [
    'arrow_left',
    'arrow_forward',
    'arrow_right',
    'bus_label',
];

export const HEX_COLOR_REGEX = /^#([0-9a-f]{6})$/i;