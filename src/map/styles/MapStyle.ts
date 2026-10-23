import type { StyleSpecification, RasterSourceSpecification, LayerSpecification } from 'maplibre-gl';

export const DEFAULT_MAP_CENTER: [number, number] = [4.9000, 52.3728]; // Amsterdam
export const DEFAULT_MAP_ZOOM = 17;

export const GOOGLE_BASE_SOURCES: Record<string, RasterSourceSpecification> = {
    'google-satellite': {
        type: 'raster',
        tiles: ['https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
        tileSize: 256,
        attribution: '&copy; Google Maps',
    },
    'google-hybrid': {
        type: 'raster',
        tiles: ['https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'],
        tileSize: 256,
        attribution: '&copy; Google Maps',
    },
};

export const GOOGLE_BASE_LAYERS: LayerSpecification[] = [
    {
        id: 'google-satellite-layer',
        type: 'raster',
        source: 'google-satellite',
        minzoom: 0,
        maxzoom: 22,
        layout: {
            visibility: 'none',
        },
    },
    {
        id: 'google-hybrid-layer',
        type: 'raster',
        source: 'google-hybrid',
        minzoom: 0,
        maxzoom: 22,
    },
];

export const GOOGLE_SATELLITE_STYLE: StyleSpecification = {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {},
    layers: [],
};

export const GIS_SATELLITE: StyleSpecification = {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
        'gis-satellite': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '&copy; GIS',
        },
    },
    layers: [
        {
            id: 'gis-satellite-layer',
            type: 'raster',
            source: 'gis-satellite',
            minzoom: 0,
            maxzoom: 22,
        },
    ],
};

export const OSM_NON_SATELLITE: StyleSpecification = {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
        'osm-non-satellite': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OSM',
        },
    },
    layers: [
        {
            id: 'osm-non-satellite-layer',
            type: 'raster',
            source: 'osm-non-satellite',
            minzoom: 0,
            maxzoom: 22,
        },
    ],
};