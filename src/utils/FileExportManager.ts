import { downloadGeoJSON, parseGeoJSONFile } from './FileHandler';

const AUTOSAVE_KEY = 'road_editor_autosave';

export interface FileExportActions {
    deactivateMeasureTool: () => void;
    getDrawData: () => GeoJSON.FeatureCollection;
    setDrawData: (geojson: GeoJSON.FeatureCollection) => void;
    handleGeometryChange: () => void;
    fitMapToGeoJSON: (geojson: GeoJSON.FeatureCollection) => void;
}

/**
 * Saves the current FeatureCollection to localStorage.
 */
export function saveProjectToLocalStorage(geojson: GeoJSON.FeatureCollection): void {
    try {
        if (geojson.features && geojson.features.length > 0) {
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(geojson));
        } else {
            localStorage.removeItem(AUTOSAVE_KEY);
        }
    } catch (e) {
        console.error('Failed to auto-save project to localStorage:', e);
    }
}

/**
 * Loads an auto-saved project from localStorage using existing actions.
 */
export function loadSavedProject(actions: FileExportActions): boolean {
    try {
        const savedDataString = localStorage.getItem(AUTOSAVE_KEY);
        if (!savedDataString) return false;

        const parsedData = JSON.parse(savedDataString) as GeoJSON.FeatureCollection;
        if (!parsedData || !parsedData.features || parsedData.features.length === 0) {
            return false;
        }

        setTimeout(() => {
            actions.setDrawData(parsedData);
            actions.handleGeometryChange();
            actions.fitMapToGeoJSON(parsedData);
            console.log(`Successfully restored ${parsedData.features.length} feature(s) from auto-save.`);
        }, 50);

        return true;
    } catch (e) {
        console.error('Failed to load auto-saved project:', e);
        return false;
    }
}

/**
 * Clears the project currently saved in localStorage
 */
export function clearSavedProject(): void {
    try {
        localStorage.removeItem(AUTOSAVE_KEY);
        console.log('Cleared auto-saved project from localStorage.');
    } catch (e) {
        console.error('Failed to clear auto-saved project from localStorage:', e);
    }
}

export function setupFileImportExport(actions: FileExportActions): void {
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const fileInput = document.getElementById('file-input-geojson') as HTMLInputElement;

    // Export
    btnExport?.addEventListener('click', () => {
        actions.deactivateMeasureTool();
        const geojson = actions.getDrawData();

        if (!geojson.features || geojson.features.length === 0) {
            alert('No road features to export.');
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 10);
        downloadGeoJSON(geojson, `road-layout-${timestamp}.geojson`);
    });

    // Import
    btnImport?.addEventListener('click', () => {
        actions.deactivateMeasureTool();
        if (fileInput) {
            fileInput.value = '';
            fileInput.click();
        }
    });

    fileInput?.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        try {
            const geojson = await parseGeoJSONFile(file);
            actions.setDrawData(geojson);
            actions.handleGeometryChange();
            actions.fitMapToGeoJSON(geojson);
            saveProjectToLocalStorage(geojson);
            console.log(`Successfully imported and saved ${geojson.features.length} feature(s).`);
        } catch (error) {
            console.error(error);
            alert(`Import failed: ${(error as Error).message}`);
        }
    });

    const btnAmsterdamRoundabout = document.getElementById('btn-amsterdam-roundabout');
    btnAmsterdamRoundabout?.addEventListener('click', () => {
        loadExampleProject(actions, '../../resources/examples/example_amsterdam_roundabout.geojson');
        closeSettings();
    })
    const btnToulouseStation = document.getElementById('btn-toulouse-station');
    btnToulouseStation?.addEventListener('click', () => {
        loadExampleProject(actions, '../../resources/examples/example_toulouse_station.geojson');
        closeSettings();
    })
}

async function loadExampleProject(actions: FileExportActions, fileName: string): Promise<void> {
    try {
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`Failed to fetch example GeoJSON (${response.status} ${response.statusText})`);
        }

        const blob = await response.blob();
        const file = new File([blob], 'fileName', {
            type: 'application/geo+json',
        });

        const geojson = await parseGeoJSONFile(file);
        actions.setDrawData(geojson);
        actions.handleGeometryChange();
        actions.fitMapToGeoJSON(geojson);
        saveProjectToLocalStorage(geojson);
        console.log(`Successfully imported and saved ${geojson.features.length} feature(s).`);
    } catch (error) {
        console.error(error);
        alert(`Import failed: ${(error as Error).message}`);
    }
}

function closeSettings() {
    var settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) settingsPanel.style.display = 'none';
}