// Global variables
let map;
let currentCity;
let currentLayer;
let kmlData;
const schoolsLayer = 'schools-layer';

// Initialize map
async function initMap() {
    mapboxgl.accessToken = config.accessToken;
    
    map = new mapboxgl.Map({
        container: 'map',
        style: config.style,
        center: config.center,
        zoom: config.zoom
    });
    
    // Wait for map to load before initializing
    map.on('load', async () => {
        await initControls();
        await loadSchools();
    });
}

function initControls() {
    // City selector
    const citySelector = document.getElementById('city-selector');
    citySelector.innerHTML = '';
    
    // Add cities to selector
    Object.entries(config.cities).forEach(([id, city]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = city.name;
        citySelector.appendChild(option);
    });
    
    // Event listeners
    citySelector.addEventListener('change', (e) => {
        loadCity(e.target.value);
    });
    
    document.getElementById('metric-select')?.addEventListener('change', (e) => {
        displayMetric(e.target.value);
    });
    
    // Set up tuition filter
    const minTuition = document.getElementById('minTuition');
    minTuition.value = config.schools.defaultMinTuition;
    minTuition.addEventListener('change', filterSchools);
    
    // Load first city
    if (citySelector.options.length > 0) {
        loadCity(citySelector.options[0].value);
    }
}

async function loadCity(cityId) {
    try {
        // Remove existing city layer
        if (currentLayer) {
            map.removeLayer(currentLayer);
            map.removeSource(currentLayer);
        }
        
        currentCity = cityId;
        const city = config.cities[cityId];
        
        // Load and parse KML
        const response = await fetch(city.kmlFile);
        const kmlText = await response.text();
        const parser = new DOMParser();
        kmlData = parser.parseFromString(kmlText, 'text/xml');
        
        // Convert to GeoJSON
        const geojson = kmlToGeoJSON(kmlData);
        
        // Add source and layer
        map.addSource(cityId, {
            type: 'geojson',
            data: geojson
        });
        
        map.addLayer({
            id: cityId,
            type: 'fill',
            source: cityId,
            paint: {
                'fill-opacity': config.heatmap.defaultOpacity
            }
        });
        
        currentLayer = cityId;
        
        // Update map view
        map.flyTo({
            center: city.center,
            zoom: city.zoom
        });
        
        // Update metrics list and display first metric
        updateMetricsList();
        
    } catch (error) {
        console.error('Error loading city:', error);
    }
}

async function loadSchools() {
    try {
        const response = await fetch(config.schools.source);
        const data = await response.json();
        
        if (map.getSource('schools')) {
            map.removeLayer(schoolsLayer);
            map.removeSource('schools');
        }
        
        map.addSource('schools', {
            type: 'geojson',
            data: data
        });
        
        map.addLayer({
            id: schoolsLayer,
            type: 'circle',
            source: 'schools',
            paint: config.schools.layer.paint,
            filter: ['>=', ['get', 'tuition'], config.schools.defaultMinTuition]
        });
        
    } catch (error) {
        console.warn('Error loading schools:', error);
    }
}

function filterSchools() {
    const minTuition = parseFloat(document.getElementById('minTuition').value) || 0;
    map.setFilter(schoolsLayer, ['>=', ['get', 'tuition'], minTuition]);
}

function kmlToGeoJSON(kmlData) {
    const features = [];
    const placemarks = kmlData.getElementsByTagName('Placemark');
    
    for (const placemark of placemarks) {
        // Get coordinates
        const coordinates = [];
        const polygons = placemark.getElementsByTagName('Polygon');
        for (const polygon of polygons) {
            const coords = polygon.getElementsByTagName('coordinates')[0].textContent.trim();
            const points = coords.split(' ').filter(p => p.trim());
            const ring = points.map(point => {
                const [lon, lat] = point.split(',').map(Number);
                return [lon, lat];
            });
            coordinates.push(ring);
        }
        
        // Get all data values
        const properties = {};
        const dataElements = placemark.getElementsByTagName('data');
        for (const data of dataElements) {
            const name = data.getAttribute('name');
            if (name) {
                const value = data.textContent.trim();
                // Convert numeric strings to numbers
                const numValue = Number(value);
                properties[name] = isNaN(numValue) ? value : numValue;
            }
        }
        
        features.push({
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: coordinates
            },
            properties: properties
        });
    }
    
    return {
        type: 'FeatureCollection',
        features: features
    };
}

function updateMetricsList() {
    if (!kmlData) return;
    
    const metricSelect = document.getElementById('metric-select');
    if (!metricSelect) {
        console.warn('Metric selector not found');
        return;
    }
    
    metricSelect.innerHTML = '';
    
    // Get all unique data names from the KML
    const metrics = new Set();
    const placemarks = kmlData.getElementsByTagName('Placemark');
    
    // Loop through each placemark to find all unique data names
    for (const placemark of placemarks) {
        const dataElements = placemark.getElementsByTagName('data');
        for (const data of dataElements) {
            const name = data.getAttribute('name');
            if (name) {
                metrics.add(name);
            }
        }
    }
    
    // Add metrics to selector
    Array.from(metrics).sort().forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = metric;
        metricSelect.appendChild(option);
    });
    
    // Select first metric if available
    if (metricSelect.options.length > 0) {
        displayMetric(metricSelect.options[0].value);
    }
}

function displayMetric(metric) {
    if (!currentLayer || !metric) return;
    
    // Get all values for this metric
    const values = [];
    const placemarks = kmlData.getElementsByTagName('Placemark');
    
    // Loop through each placemark to get values for the selected metric
    for (const placemark of placemarks) {
        const dataElements = placemark.getElementsByTagName('data');
        for (const data of dataElements) {
            if (data.getAttribute('name') === metric) {
                const value = parseFloat(data.textContent.trim());
                if (!isNaN(value)) {
                    values.push(value);
                }
                break; // Found the metric for this placemark
            }
        }
    }
    
    if (values.length === 0) return;
    
    // Calculate min and max
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Create color scale
    const colorScale = config.heatmap.colors;
    const steps = [];
    
    // Create color stops
    for (let i = 0; i < colorScale.length; i++) {
        const value = min + (i / (colorScale.length - 1)) * (max - min);
        steps.push(value);
        steps.push(colorScale[i]);
    }
    
    // Update layer style
    map.setPaintProperty(currentLayer, 'fill-color', [
        'interpolate',
        ['linear'],
        ['get', metric],
        ...steps
    ]);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initMap);
