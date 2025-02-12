let map;
let currentCity = null;
let currentMetric = null;
let metricStats = {};
let kmlData = null;
let currentLayer = null;

// Metric configurations including display names and default ranges
const METRIC_CONFIG = {
    // Population and Households
    'Total_Population': {
        displayName: 'Total Population',
        defaultMin: 0,
        useMaxAsDefault: true,  // Will use actual maximum from data
        order: 1
    },
    'Households': {
        displayName: 'Total Households',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 2
    },
    
    // Power Elite Categories
    'Mosaic_A': {
        displayName: 'Power Elite Households',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 10
    },
    
    // Power Elite Subcategories
    'Mosaic_A01': {
        displayName: 'American Royalty Households',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 20
    },
    'Mosaic_A02': {
        displayName: 'Platinum Prosperity Households',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 21
    },
    'Mosaic_A03': {
        displayName: 'Kids and Cabernet Households',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 22
    },
    'Mosaic_A04': {
        displayName: 'Picture Perfect Families Households',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 23
    },
    'Mosaic_A05': {
        displayName: 'Couples with Clout Households',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 24
    },
    'Mosaic_A06': {
        displayName: 'Jet Set Urbanites Households',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 25
    },
    
    // Income Metrics
    'Median_HH_Income': {
        displayName: 'Median Household Income',
        defaultMin: 50000,
        useMaxAsDefault: true,
        order: 30
    },
    'HH_GT_250k': {
        displayName: 'Households >$250k',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 31
    },
    'HH_GT_500k': {
        displayName: 'Households >$500k',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 32
    },
    
    // Kids in Wealthy Households
    'Kids_250k': {
        displayName: 'Kids in $250k+ Households',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 40
    },
    'Kids_500k': {
        displayName: 'Kids in $500k+ Households',
        defaultMin: 0,
        useMaxAsDefault: true,
        order: 41
    }
};

// Store custom ranges for metrics
const customRanges = new Map();

// Store calculated stats for metrics
const metricMaxValues = new Map();

// Field mappings for human-readable names
const FIELD_MAPPINGS = {
    'Mosaic_A': 'Power Elite Households',
    'Mosaic_A01': 'American Royalty Households',
    'Mosaic_A02': 'Platinum Prosperity Households',
    'Mosaic_A03': 'Kids and Cabernet Households',
    'Mosaic_A04': 'Picture Perfect Families Households',
    'Mosaic_A05': 'Couples with Clout Households',
    'Mosaic_A06': 'Jet Set Urbanites Households',
    'Households': 'Total Households',
    'Total_Population': 'Total Population',
    'Mosaic_A_Pct': 'Power Elite %',
    'Median_HH_Income': 'Median Household Income',
    'Kids_250k': 'Kids in $250k+ Households',
    'Kids_500k': 'Kids in $500k+ Households',
    'HH_GT_250k': 'Households >$250k',
    'HH_GT_500k': 'Households >$500k'
};

// Initialize map
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kcmV3LXZpbmNlbnQiLCJhIjoiY202OW4wNm5yMGlubzJtcTJmMnBxb2x1cSJ9.jrR3Ucv9Nvtc-T_7aKIQCg';

async function initMap() {
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-97.7431, 30.2672], // Austin coordinates
        zoom: 11
    });

    // Wait for map to load
    await new Promise(resolve => map.on('load', resolve));

    // Add geocoder control
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl
    });
    document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

    // Initialize controls
    await initControls();
    
    // Load initial city
    const cities = await loadAvailableCities();
    if (cities.length > 0) {
        await loadCity(cities[0]);
    }
}

async function loadAvailableCities() {
    const citySelector = document.getElementById('city-selector');
    citySelector.innerHTML = '';
    
    // In a real app, this would be loaded from the server
    const cities = ['Austin', 'Boston'];
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelector.appendChild(option);
    });
    
    return cities;
}

function kmlToGeoJSON(kmlData) {
    const features = [];
    const placemarks = kmlData.getElementsByTagName('Placemark');
    
    for (const placemark of placemarks) {
        const coordinates = placemark.getElementsByTagName('coordinates')[0].textContent.trim();
        const coordPairs = coordinates.split(' ');
        const coords = coordPairs.map(pair => {
            const [lon, lat] = pair.split(',').map(Number);
            return [lon, lat];
        });
        
        // Get all data attributes
        const properties = {};
        const dataElements = placemark.getElementsByTagName('data');
        for (const elem of dataElements) {
            const name = elem.getAttribute('name');
            const value = parseFloat(elem.textContent);
            if (!isNaN(value)) {
                properties[name] = value;
            }
        }
        
        // Add name if present
        const nameElem = placemark.getElementsByTagName('n')[0];
        if (nameElem) {
            properties.name = nameElem.textContent;
        }
        
        features.push({
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [coords]
            },
            properties: properties
        });
    }
    
    return {
        type: 'FeatureCollection',
        features: features
    };
}

async function loadCity(cityName) {
    currentCity = cityName;
    
    // Remove existing layer if present
    if (currentLayer && map.getLayer(currentLayer)) {
        map.removeLayer(currentLayer);
        map.removeSource(currentLayer);
    }
    
    // Load KML data
    const response = await fetch(`data/KMLs/${cityName}.kml`);
    const kmlText = await response.text();
    const parser = new DOMParser();
    kmlData = parser.parseFromString(kmlText, 'text/xml');
    
    // Convert to GeoJSON
    const geojson = kmlToGeoJSON(kmlData);
    
    // Add source
    const sourceId = `${cityName}-source`;
    currentLayer = sourceId;
    
    if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
    }
    
    map.addSource(sourceId, {
        type: 'geojson',
        data: geojson
    });
    
    // Extract available metrics
    updateMetricsList();
    
    // Update map view
    const bounds = calculateBounds(kmlData);
    map.fitBounds(bounds, { padding: 50 });
    
    // Display initial metric
    if (currentMetric) {
        displayMetric(currentMetric);
    }
}

function updateMetricsList() {
    const metricSelector = document.getElementById('metric-selector');
    metricSelector.innerHTML = '';
    
    // Get all available metrics from the KML that are in our config
    const metrics = new Set();
    const placemarks = kmlData.getElementsByTagName('Placemark');
    if (placemarks.length > 0) {
        const dataElements = placemarks[0].getElementsByTagName('data');
        for (const elem of dataElements) {
            const metricName = elem.getAttribute('name');
            if (METRIC_CONFIG[metricName]) {
                metrics.add(metricName);
            }
        }
    }
    
    // Sort metrics by their order in the config
    const sortedMetrics = Array.from(metrics).sort((a, b) => 
        METRIC_CONFIG[a].order - METRIC_CONFIG[b].order
    );
    
    // Add options to selector
    sortedMetrics.forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = METRIC_CONFIG[metric].displayName;
        metricSelector.appendChild(option);
    });
    
    // Select first metric by default
    if (metrics.size > 0 && !currentMetric) {
        currentMetric = sortedMetrics[0];
        metricSelector.value = currentMetric;
        loadMetricRanges(currentMetric);
        displayMetric(currentMetric);
    }
}

function calculateMetricStats(metric) {
    const values = [];
    const placemarks = kmlData.getElementsByTagName('Placemark');
    
    for (const placemark of placemarks) {
        const dataElements = placemark.getElementsByTagName('data');
        for (const elem of dataElements) {
            if (elem.getAttribute('name') === metric) {
                const value = parseFloat(elem.textContent);
                if (!isNaN(value)) {
                    values.push(value);
                }
                break;
            }
        }
    }
    
    if (values.length === 0) return null;
    
    values.sort((a, b) => a - b);
    const stats = {
        min: values[0],
        max: values[values.length - 1],
        mean: values.reduce((a, b) => a + b) / values.length,
        median: values[Math.floor(values.length / 2)]
    };
    
    // Store max value for this metric
    metricMaxValues.set(metric, stats.max);
    
    return stats;
}

function loadMetricRanges(metric) {
    const config = METRIC_CONFIG[metric];
    let min, max;
    
    // Check URL parameters first
    const params = new URLSearchParams(window.location.search);
    const paramKey = `${metric}_range`;
    if (params.has(paramKey)) {
        [min, max] = params.get(paramKey).split(',').map(Number);
    } else if (customRanges.has(metric)) {
        // Then check custom ranges
        [min, max] = customRanges.get(metric);
    } else {
        // Fall back to defaults
        min = config.defaultMin;
        
        // Use actual maximum if specified
        if (config.useMaxAsDefault && metricMaxValues.has(metric)) {
            max = metricMaxValues.get(metric);
            console.log(`Using actual max for ${metric}: ${max}`); // Debug log
        } else {
            max = config.defaultMax || 100;
            console.log(`Using default max for ${metric}: ${max}`); // Debug log
        }
    }
    
    // Update input fields
    document.getElementById('min-value').value = min;
    document.getElementById('max-value').value = max;
}

function saveMetricRanges(metric) {
    const min = parseFloat(document.getElementById('min-value').value);
    const max = parseFloat(document.getElementById('max-value').value);
    
    // Save to custom ranges
    customRanges.set(metric, [min, max]);
    
    // Update URL if different from defaults
    const config = METRIC_CONFIG[metric];
    const params = new URLSearchParams(window.location.search);
    const paramKey = `${metric}_range`;
    
    const defaultMax = config.useMaxAsDefault && metricMaxValues.has(metric) 
        ? metricMaxValues.get(metric) 
        : (config.defaultMax || 100);
    
    if (min !== config.defaultMin || max !== defaultMax) {
        params.set(paramKey, `${min},${max}`);
    } else {
        params.delete(paramKey);
    }
    
    // Update URL without reloading the page
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newUrl);
}

function displayMetric(metric) {
    currentMetric = metric;
    
    // Calculate stats first
    const stats = calculateMetricStats(metric);
    if (!stats) return;
    
    // Update stats display
    updateStats(stats);
    
    // Now load ranges (which will use the calculated max)
    loadMetricRanges(metric);
    
    // Get current range values
    const minValue = parseFloat(document.getElementById('min-value').value);
    const maxValue = parseFloat(document.getElementById('max-value').value);
    
    // Calculate points for the gradient
    const range = maxValue - minValue;
    const fadeRange = range * 0.2; // 20% of the range for fade-in
    const mainRange = range * 0.8; // remaining 80% for main gradient
    const mainStep = mainRange / 5; // 5 steps for 6 colors in main gradient
    
    // Calculate gradient points with debug logging
    const points = [
        [minValue, 'rgba(0, 0, 0, 0)'],        // transparent start
        [minValue + fadeRange, 'rgba(173, 216, 230, 0.6)'], // light blue
        [minValue + fadeRange + mainStep, 'rgba(0, 255, 0, 0.6)'],    // green
        [minValue + fadeRange + (2 * mainStep), 'rgba(255, 255, 0, 0.6)'],  // yellow
        [minValue + fadeRange + (3 * mainStep), 'rgba(255, 165, 0, 0.6)'],  // orange
        [minValue + fadeRange + (4 * mainStep), 'rgba(255, 0, 0, 0.6)'],    // red
        [maxValue, 'rgba(128, 0, 128, 0.6)']   // deep violet
    ];
    
    // Debug log the points
    console.log('Gradient points:', points.map(p => p[0]));
    
    // Verify points are in ascending order
    for (let i = 1; i < points.length; i++) {
        if (points[i][0] <= points[i-1][0]) {
            console.error(`Invalid gradient point at index ${i}:`, points[i-1][0], points[i][0]);
            return; // Prevent invalid layer creation
        }
    }
    
    // Update map layer
    const layerId = `${currentCity}-layer`;
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
    }
    
    // Add new layer with interpolated colors
    map.addLayer({
        id: layerId,
        type: 'fill',
        source: currentLayer,
        paint: {
            'fill-color': [
                'case',
                ['<', ['get', metric], minValue],
                'rgba(0, 0, 0, 0)',  // transparent for values below minimum
                ['interpolate',
                    ['linear'],
                    ['get', metric],
                    ...points.flat() // Spread all points into the array
                ]
            ],
            'fill-opacity': 1,
            'fill-outline-color': '#ffffff'
        }
    });
    
    // Update gradient preview with the same colors
    updateGradientPreview(minValue, maxValue, fadeRange);
}

function updateStats(stats) {
    document.getElementById('current-min').textContent = stats.min.toFixed(0);
    document.getElementById('current-max').textContent = stats.max.toFixed(0);
    document.getElementById('current-mean').textContent = stats.mean.toFixed(0);
    document.getElementById('current-median').textContent = stats.median.toFixed(0);
}

function updateGradientPreview(minValue, maxValue, fadeRange) {
    const gradient = document.querySelector('.gradient-preview');
    gradient.style.background = `linear-gradient(to right, 
        rgba(0, 0, 0, 0) 0%,
        rgba(173, 216, 230, 0.6) 20%,  /* light blue at 20% */
        rgba(0, 255, 0, 0.6) 36%,      /* green at 36% */
        rgba(255, 255, 0, 0.6) 52%,    /* yellow at 52% */
        rgba(255, 165, 0, 0.6) 68%,    /* orange at 68% */
        rgba(255, 0, 0, 0.6) 84%,      /* red at 84% */
        rgba(128, 0, 128, 0.6) 100%    /* deep violet at 100% */
    )`;
    
    const minLabel = document.querySelector('.gradient-min');
    const maxLabel = document.querySelector('.gradient-max');
    minLabel.textContent = minValue.toFixed(0);
    maxLabel.textContent = maxValue.toFixed(0);
}

function calculateBounds(kmlData) {
    const placemarks = kmlData.getElementsByTagName('Placemark');
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLon = Infinity;
    let maxLon = -Infinity;
    
    for (const placemark of placemarks) {
        const coordinates = placemark.getElementsByTagName('coordinates')[0].textContent.trim();
        const coordPairs = coordinates.split(' ');
        
        for (const pair of coordPairs) {
            const [lon, lat] = pair.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lon)) {
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLon = Math.min(minLon, lon);
                maxLon = Math.max(maxLon, lon);
            }
        }
    }
    
    // Add some padding to the bounds
    const latPadding = (maxLat - minLat) * 0.1;
    const lonPadding = (maxLon - minLon) * 0.1;
    
    return [
        [minLon - lonPadding, minLat - latPadding], // Southwest corner
        [maxLon + lonPadding, maxLat + latPadding]  // Northeast corner
    ];
}

async function initControls() {
    // City selector
    document.getElementById('city-selector').addEventListener('change', (e) => {
        loadCity(e.target.value);
    });
    
    // Metric selector
    document.getElementById('metric-selector').addEventListener('change', (e) => {
        displayMetric(e.target.value);
    });
    
    // Range controls
    document.getElementById('apply-range').addEventListener('click', () => {
        if (currentMetric) {
            saveMetricRanges(currentMetric);
            displayMetric(currentMetric);
        }
    });
    
    // Collapse button
    document.getElementById('collapse-btn').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
    });
    
    // Load ranges from URL on initial load
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params.entries()) {
        if (key.endsWith('_range')) {
            const metric = key.replace('_range', '');
            const [min, max] = value.split(',').map(Number);
            customRanges.set(metric, [min, max]);
        }
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', initMap);
