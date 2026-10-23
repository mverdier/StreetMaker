import { LINE_INFRASTRUCTURE_SPECS } from '../config/infrastructure';

/**
 * Computes exact ground resolution in meters per CSS pixel at a given zoom & latitude.
 */
export function getMetersPerPixelAtZoom(zoom: number, latitude: number, tileSize: number = 512): number {
    const EARTH_CIRCUMFERENCE_METERS = 40075016.685;
    const latRad = (latitude * Math.PI) / 180;
    return (EARTH_CIRCUMFERENCE_METERS * Math.cos(latRad)) / (tileSize * Math.pow(2, zoom));
}

/**
 * Builds a MapLibre zoom-interpolated line width expression scaling real meters on the basemap.
 */
export function getMeterLineWidthExpression(widthMeters: number, latitude: number = 52.37): any {
    const safeWidth = typeof widthMeters === 'number' && !isNaN(widthMeters) && isFinite(widthMeters) && widthMeters > 0
        ? widthMeters
        : LINE_INFRASTRUCTURE_SPECS.bicycle_path.widthMeters;

    const metersPerPxZoom20 = getMetersPerPixelAtZoom(20, latitude, 512);
    const pxPerMeterZoom20 = 1 / metersPerPxZoom20;
    const targetPixelsAtZoom20 = safeWidth * pxPerMeterZoom20;

    return [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        10, Math.max(1, targetPixelsAtZoom20 / Math.pow(2, 10)),
        20, targetPixelsAtZoom20,
    ];
}

/**
 * Calculates the bounding box coordinates [minLng, minLat, maxLng, maxLat] for a GeoJSON FeatureCollection.
 * Returns null if no valid coordinates are found.
 */
export function getGeoJSONBounds(
    geojson: GeoJSON.FeatureCollection
): [[number, number], [number, number]] | null {
    if (!geojson.features || geojson.features.length === 0) return null;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    geojson.features.forEach((feature) => {
        if (feature.geometry && feature.geometry.type === 'LineString') {
            feature.geometry.coordinates.forEach(([lng, lat]) => {
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
            });
        }
    });

    if (minLng === Infinity || minLat === Infinity) return null;

    return [
        [minLng, minLat],
        [maxLng, maxLat],
    ];
}

/**
 * Calculates the great-circle distance between two [lng, lat] points in meters using the Haversine formula.
 */
export function calculateHaversineDistance(
    [lng1, lat1]: [number, number],
    [lng2, lat2]: [number, number]
): number {
    const R = 6371008.8; // Earth radius in meters
    const radLat1 = (lat1 * Math.PI) / 180;
    const radLat2 = (lat2 * Math.PI) / 180;
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Formats meters into human-readable distance (e.g. "45.2 m" or "1.24 km").
 */
export function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(1)} m`;
}

/**
 * Smooths an array of coordinate points using a Catmull-Rom spline algorithm.
 * @param points Array of [lng, lat] control points.
 * @param resolution Number of interpolated points generated between each control point.
 */
export function smoothLineCoordinates(points: number[][], resolution: number = 10): number[][] {
    if (!points || points.length < 3) {
        return points; // Straight line
    }

    const smoothed: number[][] = [];
    const extended = [points[0], ...points, points[points.length - 1]];

    for (let i = 0; i < extended.length - 3; i++) {
        const p0 = extended[i];
        const p1 = extended[i + 1];
        const p2 = extended[i + 2];
        const p3 = extended[i + 3];

        const startIndex = i === 0 ? 0 : 1;

        for (let j = startIndex; j <= resolution; j++) {
            const t = j / resolution;
            const tt = t * t;
            const ttt = tt * t;

            // Catmull-Rom formula (tension = 0.5)
            const x = 0.5 * (
                (2 * p1[0]) +
                (-p0[0] + p2[0]) * t +
                (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * tt +
                (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * ttt
            );

            const y = 0.5 * (
                (2 * p1[1]) +
                (-p0[1] + p2[1]) * t +
                (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * tt +
                (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * ttt
            );

            smoothed.push([x, y]);
        }
    }

    return smoothed;
}

/**
 * Smooths a closed polygon ring using a Catmull-Rom spline algorithm.
 */
export function smoothPolygonCoordinates(ring: number[][], resolution: number = 10): number[][] {
    if (!ring || !Array.isArray(ring) || ring.length < 4) {
        return ring ? [...ring] : [];
    }

    const validPoints = ring.filter(
        (p) => p && Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number'
    );

    if (validPoints.length < 3) {
        return [...ring];
    }

    // Remove the duplicated closing point at the end if present
    const points = [...validPoints];
    if (
        points.length > 1 &&
        points[0][0] === points[points.length - 1][0] &&
        points[0][1] === points[points.length - 1][1]
    ) {
        points.pop();
    }

    if (points.length < 3) return [...ring];

    const n = points.length;
    const smoothed: number[][] = [];

    for (let i = 0; i < n; i++) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];

        for (let j = 0; j <= resolution; j++) {
            if (i > 0 && j === 0) continue;

            const t = j / resolution;
            const tt = t * t;
            const ttt = tt * t;

            const x = 0.5 * (
                (2 * p1[0]) +
                (-p0[0] + p2[0]) * t +
                (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * tt +
                (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * ttt
            );

            const y = 0.5 * (
                (2 * p1[1]) +
                (-p0[1] + p2[1]) * t +
                (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * tt +
                (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * ttt
            );

            smoothed.push([x, y]);
        }
    }

    if (smoothed.length > 0) {
        smoothed.push([...smoothed[0]]);
    }

    return smoothed;
}