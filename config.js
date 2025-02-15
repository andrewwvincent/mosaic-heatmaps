const config = {
    // Mapbox configuration
    accessToken: 'pk.eyJ1IjoiYW5kcmV3LXZpbmNlbnQiLCJhIjoiY202OW4wNm5yMGlubzJtcTJmMnBxb2x1cSJ9.jrR3Ucv9Nvtc-T_7aKIQCg',
    style: 'mapbox://styles/mapbox/streets-v12',
    
    // Default map view
    center: [-98.5795, 39.8283], // US center
    zoom: 4,
    
    // City configurations
    cities: {
        aspen: {
            name: 'CO - Aspen',
            center: [-106.8175, 39.1911],
            zoom: 10,
            kmlFile: 'data/KMLs/Aspen_Metric_Validation_Metric_Validation.kml'
        },
        atlanta: {
            name: 'GA - Atlanta',
            center: [-84.3880, 33.7490],
            zoom: 10,
            kmlFile: 'data/KMLs/Atlanta_Metric_Validation_Metric_Validation.kml'
        },
        austin: {
            name: 'TX - Austin',
            center: [-97.7431, 30.2672],
            zoom: 10,
            kmlFile: 'data/KMLs/Austin_Metric_Validation_Metric_Validation.kml'
        },
        baltimore: {
            name: 'MD - Baltimore',
            center: [-76.6122, 39.2904],
            zoom: 10,
            kmlFile: 'data/KMLs/Baltimore_Metric_Validation_Metric_Validation.kml'
        },
        bayArea: {
            name: 'CA - Bay Area',
            center: [-122.4194, 37.7749],
            zoom: 9,
            kmlFile: 'data/KMLs/Bay_Area_Metric_Validation_Metric_Validation.kml'
        },
        boston: {
            name: 'MA - Boston',
            center: [-71.0589, 42.3601],
            zoom: 10,
            kmlFile: 'data/KMLs/Boston_Metric_Validation_Metric_Validation.kml'
        },
        charleston: {
            name: 'SC - Charleston',
            center: [-79.9311, 32.7765],
            zoom: 10,
            kmlFile: 'data/KMLs/Charleston_Metric_Validation_Metric_Validation.kml'
        },
        charlotte: {
            name: 'NC - Charlotte',
            center: [-80.8431, 35.2271],
            zoom: 10,
            kmlFile: 'data/KMLs/Charlotte_Metric_Validation_Metric_Validation.kml'
        },
        charlottesville: {
            name: 'VA - Charlottesville',
            center: [-78.4767, 38.0293],
            zoom: 10,
            kmlFile: 'data/KMLs/Charlottesville_Metric_Validation_Metric_Validation.kml'
        },
        chicago: {
            name: 'IL - Chicago',
            center: [-87.6298, 41.8781],
            zoom: 10,
            kmlFile: 'data/KMLs/Chicago_Metric_Validation_Metric_Validation.kml'
        },
        cincinnati: {
            name: 'OH - Cincinnati',
            center: [-84.5120, 39.1031],
            zoom: 10,
            kmlFile: 'data/KMLs/Cincinnati_Metric_Validation_Metric_Validation.kml'
        },
        columbus: {
            name: 'OH - Columbus',
            center: [-82.9988, 39.9612],
            zoom: 10,
            kmlFile: 'data/KMLs/Columbus_Metric_Validation_Metric_Validation.kml'
        },
        dallas: {
            name: 'TX - Dallas',
            center: [-96.7970, 32.7767],
            zoom: 10,
            kmlFile: 'data/KMLs/Dallas_Metric_Validation_Metric_Validation.kml'
        },
        denver: {
            name: 'CO - Denver',
            center: [-104.9903, 39.7392],
            zoom: 10,
            kmlFile: 'data/KMLs/Denver_Metric_Validation_Metric_Validation.kml'
        },
        fortWorth: {
            name: 'TX - Fort Worth',
            center: [-97.3208, 32.7555],
            zoom: 10,
            kmlFile: 'data/KMLs/Fort_Worth_Metric_Validation_Metric_Validation.kml'
        },
        hartford: {
            name: 'CT - Hartford',
            center: [-72.6851, 41.7658],
            zoom: 10,
            kmlFile: 'data/KMLs/Hartford_Metric_Validation_Metric_Validation.kml'
        },
        houston: {
            name: 'TX - Houston',
            center: [-95.3698, 29.7604],
            zoom: 10,
            kmlFile: 'data/KMLs/Houston_Metric_Validation_Metric_Validation.kml'
        },
        indianapolis: {
            name: 'IN - Indianapolis',
            center: [-86.1581, 39.7684],
            zoom: 10,
            kmlFile: 'data/KMLs/Indianapolis_Metric_Validation_Metric_Validation.kml'
        },
        lasVegas: {
            name: 'NV - Las Vegas',
            center: [-115.1398, 36.1699],
            zoom: 10,
            kmlFile: 'data/KMLs/Las_Vegas_Metric_Validation_Metric_Validation.kml'
        },
        losAngeles: {
            name: 'CA - Los Angeles',
            center: [-118.2437, 34.0522],
            zoom: 10,
            kmlFile: 'data/KMLs/Los_Angeles_Metric_Validation_Metric_Validation.kml'
        },
        milwaukee: {
            name: 'WI - Milwaukee',
            center: [-87.9065, 43.0389],
            zoom: 10,
            kmlFile: 'data/KMLs/Milwaukee_Metric_Validation_Metric_Validation.kml'
        },
        minneapolis: {
            name: 'MN - Minneapolis',
            center: [-93.2650, 44.9778],
            zoom: 10,
            kmlFile: 'data/KMLs/Minneapolis_Metric_Validation_Metric_Validation.kml'
        },
        nashville: {
            name: 'TN - Nashville',
            center: [-86.7816, 36.1627],
            zoom: 10,
            kmlFile: 'data/KMLs/Nashville_Metric_Validation_Metric_Validation.kml'
        },
        newYork: {
            name: 'NY - New York City',
            center: [-74.0060, 40.7128],
            zoom: 10,
            kmlFile: 'data/KMLs/NYC_Metric_Validation_Metric_Validation.kml'
        },
        newark: {
            name: 'NJ - Newark',
            center: [-74.1724, 40.7357],
            zoom: 10,
            kmlFile: 'data/KMLs/Newark_Metric_Validation_Metric_Validation.kml'
        },
        orlando: {
            name: 'FL - Orlando',
            center: [-81.3792, 28.5383],
            zoom: 10,
            kmlFile: 'data/KMLs/Orlando_Metric_Validation_Metric_Validation.kml'
        },
        philadelphia: {
            name: 'PA - Philadelphia',
            center: [-75.1652, 39.9526],
            zoom: 10,
            kmlFile: 'data/KMLs/Philadelphia_Metric_Validation_Metric_Validation.kml'
        },
        phoenix: {
            name: 'AZ - Phoenix',
            center: [-112.0740, 33.4484],
            zoom: 10,
            kmlFile: 'data/KMLs/Phoenix_Metric_Validation_Metric_Validation.kml'
        },
        portland: {
            name: 'OR - Portland',
            center: [-122.6765, 45.5155],
            zoom: 10,
            kmlFile: 'data/KMLs/Portland_Metric_Validation_Metric_Validation.kml'
        },
        raleigh: {
            name: 'NC - Raleigh',
            center: [-78.6382, 35.7796],
            zoom: 10,
            kmlFile: 'data/KMLs/Raleigh_Metric_Validation_Metric_Validation.kml'
        },
        richmond: {
            name: 'VA - Richmond',
            center: [-77.4360, 37.5407],
            zoom: 10,
            kmlFile: 'data/KMLs/Richmond_Metric_Validation_Metric_Validation.kml'
        },
        sacramento: {
            name: 'CA - Sacramento',
            center: [-121.4944, 38.5816],
            zoom: 10,
            kmlFile: 'data/KMLs/Sacramento_Metric_Validation_Metric_Validation.kml'
        },
        saltLakeCity: {
            name: 'UT - Salt Lake City',
            center: [-111.8910, 40.7608],
            zoom: 10,
            kmlFile: 'data/KMLs/Salt_Lake_City_Metric_Validation_Metric_Validation.kml'
        },
        sanDiego: {
            name: 'CA - San Diego',
            center: [-117.1611, 32.7157],
            zoom: 10,
            kmlFile: 'data/KMLs/San_Diego_Metric_Validation_Metric_Validation.kml'
        },
        santaBarbara: {
            name: 'CA - Santa Barbara',
            center: [-119.6982, 34.4208],
            zoom: 10,
            kmlFile: 'data/KMLs/Santa_Barbara_Metric_Validation_Metric_Validation.kml'
        },
        seattle: {
            name: 'WA - Seattle',
            center: [-122.3321, 47.6062],
            zoom: 10,
            kmlFile: 'data/KMLs/Seattle_Metric_Validation_Metric_Validation.kml'
        },
        stamford: {
            name: 'CT - Stamford',
            center: [-73.5387, 41.0534],
            zoom: 10,
            kmlFile: 'data/KMLs/Stamford_Metric_Validation_Metric_Validation.kml'
        },
        tampa: {
            name: 'FL - Tampa',
            center: [-82.4572, 27.9506],
            zoom: 10,
            kmlFile: 'data/KMLs/Tampa_Metric_Validation_Metric_Validation.kml'
        },
        trenton: {
            name: 'NJ - Trenton',
            center: [-74.7429, 40.2206],
            zoom: 10,
            kmlFile: 'data/KMLs/Trenton_Metric_Validation_Metric_Validation.kml'
        },
        washingtonDC: {
            name: 'DC - Washington',
            center: [-77.0369, 38.9072],
            zoom: 10,
            kmlFile: 'data/KMLs/Washington_DC_Metric_Validation_Metric_Validation.kml'
        },
        westPalmBeach: {
            name: 'FL - West Palm Beach',
            center: [-80.0534, 26.7153],
            zoom: 10,
            kmlFile: 'data/KMLs/West_Palm_Beach_Metric_Validation_Metric_Validation.kml'
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
            'rgba(128, 0, 128, 0.8)'  // purple with higher opacity
        ],
        defaultOpacity: 0.5
    },
    
    // Metrics configuration
    metrics: {
        
        "Total Population": {
            basis: "population"
        },
        "Total Families": {
            basis: "families"
        },
        "Total Households": {
            basis: "households"
        },
        "Average (Mean) Household Size": {
            basis: "household_size"
        },
        "Households >$250k": {
            basis: "wealthy_households"
        },
        "HH >$250K - A Calc": {
            basis: "wealthy_households"
        },
        "HH >$250K - B Calc": {
            basis: "wealthy_households"
        },
        "Kids 5-14": {
            basis: "kids"
        },
        "Kids 5-17": {
            basis: "kids"
        },
        "Kids 4-18 - A Calc": {
            basis: "kids"
        },
        "Kids 4-18 - B Calc": {
            basis: "kids"
        },
        "Kids 5-14 >$250k": {
            basis: "wealthy_kids"
        },
        "Kids 5-17 >$250k": {
            basis: "wealthy_kids"
        },
        "Kids 4-18 >$250k - A Calc": {
            basis: "wealthy_kids"
        },
        "Kids 4-18 >$250k - B Calc": {
            basis: "wealthy_kids"
        },
        "Average (Mean) Travel Time: Worked Away from Home": {
            basis: "time"
        },
        "Average Elementary and high school tuition": {
            basis: "tuition"
        },
        "Average (Mean) Household Income": {
            basis: "household_income"
        },
        "Median Household Income": {
            basis: "household_income"
        },
        "A - Power Elite": {
            basis: "filtered_households"
        },
        "B - Flourishing Families": {
            basis: "filtered_households"
        },
        "A01 - American Royalty": {
            basis: "filtered_households"
        },
        "A02 - Platinum Prosperity": {
            basis: "filtered_households"
        },
        "A03 - Kids and Cabernet": {
            basis: "filtered_households"
        },
        "A04 - Picture Perfect Families": {
            basis: "filtered_households"
        },
        "A05 - Couples with Clout": {
            basis: "filtered_households"
        },
        "A06 - Jet Set Urbanites": {
            basis: "filtered_households"
        },
        "B07 - Across the Ages": {
            basis: "filtered_households"
        },
        "B08 - Babies and Bliss": {
            basis: "filtered_households"
        },
        "B09 - Family Fun-tastic": {
            basis: "filtered_households"
        },
        "B10 - Cosmopolitan Achievers": {
            basis: "filtered_households"
        },
        // You can add more metrics here with their basis values
    }
};
