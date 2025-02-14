const config = {
    // Mapbox configuration
    accessToken: 'pk.eyJ1IjoiYW5kcmV3LXZpbmNlbnQiLCJhIjoiY202OW4wNm5yMGlubzJtcTJmMnBxb2x1cSJ9.jrR3Ucv9Nvtc-T_7aKIQCg',
    style: 'mapbox://styles/mapbox/streets-v12',
    
    // Default map view
    center: [-98.5795, 39.8283], // US center
    zoom: 4,
    
    // City configurations
    cities: {
        atlanta: {
            name: 'Atlanta, GA',
            center: [-84.3880, 33.7490],
            zoom: 10,
            kmlFile: 'data/KMLs/Atlanta_Metric_Validation_Metric_Validation.kml'
        },
        austin: {
            name: 'Austin, TX',
            center: [-97.7431, 30.2672],
            zoom: 10,
            kmlFile: 'data/KMLs/Austin_Metric_Validation_Metric_Validation.kml'
        },
        boston: {
            name: 'Boston, MA',
            center: [-71.0589, 42.3601],
            zoom: 10,
            kmlFile: 'data/KMLs/Boston_Metric_Validation_Metric_Validation.kml'
        },
        chicago: {
            name: 'Chicago, IL',
            center: [-87.6298, 41.8781],
            zoom: 10,
            kmlFile: 'data/KMLs/Chicago_Metric_Validation_Metric_Validation.kml'
        },
        denver: {
            name: 'Denver, CO',
            center: [-104.9903, 39.7392],
            zoom: 10,
            kmlFile: 'data/KMLs/Denver_Metric_Validation_Metric_Validation.kml'
        }
    },
    
    // Schools configuration
    schools: {
        source: 'data/schools.geojson',
        defaultMinTuition: 30000,
        layer: {
            paint: {
                'circle-radius': 6,
                'circle-color': '#B42222',
                'circle-opacity': 0.7
            }
        }
    },
    
    // Heatmap configuration
    heatmap: {
        colors: [
            'rgba(0, 0, 255, 0)',    // invisible blue
            'rgba(0, 0, 255, 0.5)',  // blue
            'rgba(0, 255, 0, 0.5)',  // green
            'rgba(255, 255, 0, 0.5)', // yellow
            'rgba(255, 165, 0, 0.5)', // orange
            'rgba(255, 0, 0, 0.5)',   // red
            'rgba(128, 0, 128, 0.5)'  // purple
        ],
        defaultOpacity: 0.5
    }
};
