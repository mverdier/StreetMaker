import { downloadGeoJSON, parseGeoJSONFile } from './FileHandler';

export interface FileExportActions {
    deactivateMeasureTool: () => void;
    getDrawData: () => GeoJSON.FeatureCollection;
    setDrawData: (geojson: GeoJSON.FeatureCollection) => void;
    handleGeometryChange: () => void;
    fitMapToGeoJSON: (geojson: GeoJSON.FeatureCollection) => void;
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
            console.log(`Successfully imported ${geojson.features.length} feature(s).`);
        } catch (error) {
            console.error(error);
            alert(`Import failed: ${(error as Error).message}`);
        }
    });
}