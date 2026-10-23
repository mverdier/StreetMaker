import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../style.css';
import RoadEditor from './RoadEditor';

window.addEventListener('DOMContentLoaded', () => {
    const mapElement = document.getElementById('map');

    if (!mapElement) {
        console.error('Target container #map not found in DOM.');
        return;
    }

    const editor = new RoadEditor('map');

    const sampleRoadNetwork: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
        ],
    };

    editor.loadExistingRoads(sampleRoadNetwork);
});