import {
    type LineInfrastructureType,
    type PolygonInfrastructureType,
    type PointInfrastructureType, LINE_INFRASTRUCTURE_SPECS, POLYGON_INFRASTRUCTURE_SPECS, POINT_INFRASTRUCTURE_SPECS,
} from './infrastructure';

export interface LineTypeOverride {
    color?: string;
    widthMeters?: number;
    isDouble?: boolean;
    smooth?: boolean;
}

export interface PolygonTypeOverride {
    color?: string;
    smooth?: boolean;
}

export interface PointTypeOverride {
    color?: string;
    widthMeters?: number;
    rotation?: number;
}

export interface StoredInfraOverrides {
    lines: Partial<Record<LineInfrastructureType, LineTypeOverride>>;
    polygons: Partial<Record<PolygonInfrastructureType, PolygonTypeOverride>>;
    points: Partial<Record<PointInfrastructureType, PointTypeOverride>>;
}

const INFRA_DEFAULTS_STORAGE_KEY = 'streetmaker_infra_defaults_v1';

export function loadInfraOverrides(): StoredInfraOverrides {
    try {
        const raw = localStorage.getItem(INFRA_DEFAULTS_STORAGE_KEY);
        if (!raw) return { lines: {}, polygons: {}, points: {} };

        const parsed = JSON.parse(raw) as Partial<StoredInfraOverrides>;
        return {
            lines: parsed.lines && typeof parsed.lines === 'object' ? parsed.lines : {},
            polygons: parsed.polygons && typeof parsed.polygons === 'object' ? parsed.polygons : {},
            points: parsed.points && typeof parsed.points === 'object' ? parsed.points : {},
        };
    } catch (err) {
        console.error('Failed to load infrastructure defaults from localStorage:', err);
        return { lines: {}, polygons: {}, points: {} };
    }
}

export function saveInfraOverrides(overrides: StoredInfraOverrides): void {
    try {
        localStorage.setItem(INFRA_DEFAULTS_STORAGE_KEY, JSON.stringify(overrides));
    } catch (err) {
        console.error('Failed to save infrastructure defaults to localStorage:', err);
    }
}

export function getLineDefaultsForType(
    overrides: StoredInfraOverrides,
    type: LineInfrastructureType
): Required<LineTypeOverride> {
    const spec = LINE_INFRASTRUCTURE_SPECS[type];
    const saved = overrides.lines[type];

    return {
        color: saved?.color ?? spec.color,
        widthMeters: saved?.widthMeters ?? spec.widthMeters,
        isDouble: saved?.isDouble ?? spec.isDouble,
        smooth: saved?.smooth ?? spec.smooth,
    };
}

export function getPolygonDefaultsForType(
    overrides: StoredInfraOverrides,
    type: PolygonInfrastructureType
): Required<PolygonTypeOverride> {
    const spec = POLYGON_INFRASTRUCTURE_SPECS[type];
    const saved = overrides.polygons[type];

    return {
        color: saved?.color ?? spec.color,
        smooth: saved?.smooth ?? spec.smooth,
    };
}

export function getPointDefaultsForType(
    overrides: StoredInfraOverrides,
    type: PointInfrastructureType
): Required<PointTypeOverride> {
    const spec = POINT_INFRASTRUCTURE_SPECS[type];
    const saved = overrides.points[type];

    return {
        color: saved?.color ?? spec.color,
        widthMeters: saved?.widthMeters ?? spec.widthMeters,
        rotation: saved?.rotation ?? 0,
    };
}