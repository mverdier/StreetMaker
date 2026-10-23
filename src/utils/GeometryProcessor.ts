import { smoothLineCoordinates, smoothPolygonCoordinates } from './GeoMath';
import type {
    LineInfrastructureType,
    PolygonInfrastructureType,
    PointInfrastructureType
} from '../config/infrastructure';

export interface GeometryProcessorConfigs {
    activeConfig: {
        infrastructureType: LineInfrastructureType;
        color: string;
        widthMeters: number;
        isDouble: boolean;
        smooth: boolean;
    };
    activePolygonConfig: {
        infrastructureType: PolygonInfrastructureType;
        color: string;
        smooth: boolean;
    };
    activeSinglePointConfig: {
        infrastructureType: PointInfrastructureType;
        color: string;
        widthMeters: number;
        rotation: number;
        iconName: string;
    };
    polygonSmoothingEnabled: boolean;
}

export function processGeometryFeatures(geojson: GeoJSON.FeatureCollection, configs: GeometryProcessorConfigs) {
    const lineFeatures: GeoJSON.Feature[] = [];
    const polygonFeatures: GeoJSON.Feature[] = [];
    const pointFeatures: GeoJSON.Feature[] = [];

    geojson.features.forEach((feature) => {
        if (!feature.geometry) return;
        const props = feature.properties || {};
        const baseZIndex = props.zIndex ?? 50;

        if (feature.geometry.type === 'LineString') {
            const isActivelyDrawing = !props.createdAt || props.extendingEnd;
            const effectiveProps: Record<string, any> = isActivelyDrawing ? {
                ...props,
                infrastructureType: configs.activeConfig.infrastructureType,
                color: configs.activeConfig.color,
                widthMeters: configs.activeConfig.widthMeters,
                isDouble: configs.activeConfig.isDouble,
                smooth: configs.activeConfig.smooth,
                zIndex: baseZIndex,
            } : {
                ...props,
                zIndex: baseZIndex,
            };

            const shouldSmooth = effectiveProps.smooth ?? true;
            const processedCoordinates = shouldSmooth
                ? smoothLineCoordinates(feature.geometry.coordinates, 12)
                : feature.geometry.coordinates;

            lineFeatures.push({
                ...feature,
                properties: effectiveProps,
                geometry: {
                    ...feature.geometry,
                    coordinates: processedCoordinates,
                },
            });
        } else if (feature.geometry.type === 'Polygon') {
            if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) {
                return;
            }

            const isActivelyDrawing = !props.createdAt;
            const effectiveProps: Record<string, any> = isActivelyDrawing ? {
                ...props,
                infrastructureType: configs.activePolygonConfig.infrastructureType,
                color: configs.activePolygonConfig.color,
                smooth: configs.activePolygonConfig.smooth,
                fillOpacity: 0.6,
                zIndex: baseZIndex,
            } : {
                ...props,
                zIndex: baseZIndex,
            };

            const shouldSmooth = effectiveProps.smooth ?? false;

            const processedCoordinates = feature.geometry.coordinates
                .map((ring) => {
                    if (!ring || !Array.isArray(ring)) return [];
                    return shouldSmooth
                        ? smoothPolygonCoordinates(ring, 12)
                        : ring;
                })
                .filter((ring) => Array.isArray(ring) && ring.length >= (configs.polygonSmoothingEnabled ? 4 : 3));

            if (processedCoordinates.length > 0) {
                polygonFeatures.push({
                    ...feature,
                    properties: effectiveProps,
                    geometry: {
                        ...feature.geometry,
                        coordinates: processedCoordinates,
                    },
                });
            }
        } else if (feature.geometry.type === 'Point') {
            const isActivelyDrawing = !props.createdAt;

            let resolvedIconName = props.iconName || '';
            if (!isActivelyDrawing) {
                if (props.infrastructureType === 'arrow_left') {
                    resolvedIconName = 'arrow-left-icon';
                } else if (props.infrastructureType === 'arrow_right') {
                    resolvedIconName = 'arrow-right-icon';
                } else if (props.infrastructureType === 'arrow_forward') {
                    resolvedIconName = 'arrow-forward-icon';
                } else if (props.infrastructureType === 'bus_label') {
                    resolvedIconName = ''; // No icon for bus labels
                }
            }

            const effectiveProps: Record<string, any> = isActivelyDrawing ? {
                ...props,
                infrastructureType: configs.activeSinglePointConfig.infrastructureType,
                color: configs.activeSinglePointConfig.color,
                widthMeters: configs.activeSinglePointConfig.widthMeters,
                rotation: configs.activeSinglePointConfig.rotation,
                iconName: configs.activeSinglePointConfig.iconName,
                zIndex: baseZIndex,
            } : {
                ...props,
                iconName: resolvedIconName,
                zIndex: baseZIndex,
            };

            pointFeatures.push({ ...feature, properties: effectiveProps });
        }
    });

    return { lineFeatures, polygonFeatures, pointFeatures };
}