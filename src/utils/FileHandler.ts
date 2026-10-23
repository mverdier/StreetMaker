/**
 * Triggers a browser download of a JS object formatted as a formatted .geojson file.
 */
export function downloadGeoJSON(data: object, filename: string = 'road-layout.geojson'): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

/**
 * Reads and parses a local GeoJSON file selected via an HTML File Input.
 */
export function parseGeoJSONFile(file: File): Promise<GeoJSON.FeatureCollection> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const parsed = JSON.parse(text);

                if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
                    resolve(parsed as GeoJSON.FeatureCollection);
                } else if (parsed.type === 'Feature') {
                    resolve({
                        type: 'FeatureCollection',
                        features: [parsed],
                    });
                } else {
                    reject(new Error('Invalid GeoJSON format: expected FeatureCollection or Feature.'));
                }
            } catch (err) {
                reject(new Error('Failed to parse file as valid JSON.'));
            }
        };

        reader.onerror = () => reject(new Error('Error reading local file.'));
        reader.readAsText(file);
    });
}