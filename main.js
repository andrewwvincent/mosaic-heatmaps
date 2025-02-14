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
    const metricSelect = document.getElementById('metric-select');
    if (!metricSelect) {
        console.warn('Metric selector not found');
        return;
    }
    
    metricSelect.innerHTML = '';
    
    // Get metrics from config in original order
    const metrics = Object.keys(config.metrics);
    
    // Add metrics to selector
    metrics.forEach(metric => {
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
    
    // Calculate statistics
    values.sort((a, b) => a - b); // Sort for median calculation
    const stats = {
        min: values[0],
        max: values[values.length - 1],
        mean: values.reduce((sum, val) => sum + val, 0) / values.length,
        median: values.length % 2 === 0 
            ? (values[values.length/2 - 1] + values[values.length/2]) / 2
            : values[Math.floor(values.length/2)]
    };
    
    // Update statistics display
    const minElement = document.getElementById('current-min');
    const maxElement = document.getElementById('current-max');
    const meanElement = document.getElementById('current-mean');
    const medianElement = document.getElementById('current-median');
    
    if (minElement) minElement.textContent = stats.min.toLocaleString(undefined, {maximumFractionDigits: 2});
    if (maxElement) maxElement.textContent = stats.max.toLocaleString(undefined, {maximumFractionDigits: 2});
    if (meanElement) meanElement.textContent = stats.mean.toLocaleString(undefined, {maximumFractionDigits: 2});
    if (medianElement) medianElement.textContent = stats.median.toLocaleString(undefined, {maximumFractionDigits: 2});
    
    // Update min/max input values
    const minInput = document.getElementById('min-value');
    const maxInput = document.getElementById('max-value');
    if (minInput) minInput.value = Math.floor(stats.min);
    if (maxInput) maxInput.value = Math.ceil(stats.max);
    
    // Update color gradient preview
    const gradientPreview = document.querySelector('.gradient-preview');
    if (gradientPreview) {
        const colorScale = config.heatmap.colors;
        const gradientColors = colorScale.map((color, index) => {
            const percent = (index / (colorScale.length - 1)) * 100;
            return `${color} ${percent}%`;
        }).join(', ');
        gradientPreview.style.background = `linear-gradient(to right, ${gradientColors})`;
    }
    
    // Create color scale
    const colorScale = config.heatmap.colors;
    const steps = [];
    
    // Create color stops
    for (let i = 0; i < colorScale.length; i++) {
        const value = stats.min + (i / (colorScale.length - 1)) * (stats.max - stats.min);
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

// Add event listener for the apply range button
document.getElementById('apply-range')?.addEventListener('click', () => {
    const minValue = parseFloat(document.getElementById('min-value').value);
    const maxValue = parseFloat(document.getElementById('max-value').value);
    const currentMetric = document.getElementById('metric-select').value;
    
    if (!isNaN(minValue) && !isNaN(maxValue) && currentMetric) {
        const colorScale = config.heatmap.colors;
        const steps = [];
        
        // Create color stops with custom min/max
        for (let i = 0; i < colorScale.length; i++) {
            const value = minValue + (i / (colorScale.length - 1)) * (maxValue - minValue);
            steps.push(value);
            steps.push(colorScale[i]);
        }
        
        // Update layer style
        map.setPaintProperty(currentLayer, 'fill-color', [
            'interpolate',
            ['linear'],
            ['get', currentMetric],
            ...steps
        ]);
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initMap);
