import pandas as pd
import numpy as np
from pathlib import Path
import os

def calculate_point_spacing(df):
    """Calculate the spacing between points in the dataset for both latitude and longitude."""
    # Sort points by latitude and longitude
    df_lat_sorted = df.sort_values('Latitude')
    df_lon_sorted = df.sort_values('Longitude')
    
    # Calculate differences between consecutive points
    lat_diffs = np.abs(df_lat_sorted['Latitude'].diff().dropna())
    lon_diffs = np.abs(df_lon_sorted['Longitude'].diff().dropna())
    
    # Get the most common spacing (mode) for both lat and lon
    def get_common_spacing(diffs, tolerance=1e-6):
        # Round to handle floating point imprecision
        rounded_diffs = np.round(diffs / tolerance) * tolerance
        unique_diffs, counts = np.unique(rounded_diffs, return_counts=True)
        # Filter out zero or very small differences that might be noise
        valid_diffs = unique_diffs[unique_diffs > tolerance]
        if len(valid_diffs) == 0:
            return 0.015  # fallback to a reasonable default
        valid_counts = counts[unique_diffs > tolerance]
        return valid_diffs[valid_counts.argmax()]
    
    lat_spacing = get_common_spacing(lat_diffs)
    lon_spacing = get_common_spacing(lon_diffs)
    
    # Return half the spacing in each direction to create squares centered on points
    return lat_spacing / 2, lon_spacing / 2

def create_square(lat, lon, size_lat, size_lon):
    """Create coordinates for a rectangle around a point using different lat/lon sizes."""
    return [
        (lon - size_lon, lat - size_lat),
        (lon + size_lon, lat - size_lat),
        (lon + size_lon, lat + size_lat),
        (lon - size_lon, lat + size_lat),
        (lon - size_lon, lat - size_lat)
    ]

def coords_to_kml(coords):
    """Convert coordinates to KML coordinate string."""
    return ' '.join(f'{lon:.4f},{lat:.4f},0' for lon, lat in coords)

def create_kml_content(features, square_size_lat, square_size_lon):
    """Create KML content for a set of features."""
    kml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<kml xmlns="http://www.opengis.net/kml/2.2">',
           '<Document>']
    
    # Add style information for default appearance
    kml.extend([
        '<Style id="style_default">',
        '<PolyStyle>',
        '<color>66ffffff</color>',  # White with transparency
        '<outline>0</outline>',
        '</PolyStyle>',
        '</Style>'
    ])
    
    # Add polygons with data
    for feature in features:
        coords = create_square(feature['Latitude'], feature['Longitude'], square_size_lat, square_size_lon)
        
        # Start placemark
        placemark = ['<Placemark>', '<styleUrl>#style_default</styleUrl>']
        
        # Add name and all metrics as data elements
        placemark.append(f'<n>{feature["Name"]}</n>')
        for key, value in feature['metrics'].items():
            # Convert value to integer if it's a number and not NaN
            if pd.notna(value) and isinstance(value, (int, float)):
                value = int(round(value)) if not key.endswith('_Pct') else round(value, 2)
            else:
                value = 0
            placemark.append(f'<data name="{key}">{value}</data>')
        
        # Add polygon geometry
        placemark.extend([
            '<Polygon>',
            '<outerBoundaryIs>',
            '<LinearRing>',
            f'<coordinates>{coords_to_kml(coords)}</coordinates>',
            '</LinearRing>',
            '</outerBoundaryIs>',
            '</Polygon>',
            '</Placemark>'
        ])
        
        kml.extend(placemark)
    
    kml.extend(['</Document>', '</kml>'])
    return '\n'.join(kml)

def write_kml_file(filename, features, square_size_lat, square_size_lon):
    """Write KML content to a file."""
    kml_content = create_kml_content(features, square_size_lat, square_size_lon)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(kml_content)

def process_city(input_file, output_kml_dir):
    """Process a single city's demographics file and create KML."""
    # Create output directory if it doesn't exist
    os.makedirs(output_kml_dir, exist_ok=True)
    
    # Determine output KML filename
    city_name = os.path.splitext(os.path.basename(input_file))[0].split('_Demographics')[0].split('_Mosaic')[0]
    output_kml = os.path.join(output_kml_dir, f"{city_name}.kml")
    
    # Skip if KML already exists
    if os.path.exists(output_kml):
        print(f"Skipping {city_name} - KML file already exists")
        return
    
    print(f"\nProcessing {input_file}...")
    
    # Read demographics data
    df = pd.read_csv(input_file)
    
    # Calculate point spacing
    square_size_lat, square_size_lon = calculate_point_spacing(df)
    
    # Prepare features for KML
    features = []
    for _, row in df.iterrows():
        # Get all numeric columns except ID, Latitude, and Longitude
        metrics = {}
        for col in df.select_dtypes(include=[np.number]).columns:
            if col not in ['ID', 'Latitude', 'Longitude']:
                metrics[col] = row[col]
        
        feature = {
            'Latitude': row['Latitude'],
            'Longitude': row['Longitude'],
            'Name': str(row['Name']),
            'metrics': metrics
        }
        features.append(feature)
    
    # Create output KML file
    write_kml_file(output_kml, features, square_size_lat, square_size_lon)
    print(f"Created KML file: {output_kml}")

def main():
    # Define paths
    base_path = Path(__file__).parent
    input_dir = base_path / "data/demographics"
    output_dir = base_path / "data/KMLs"
    
    # Process all CSV files in the input directory
    for input_file in input_dir.glob("*.csv"):
        process_city(str(input_file), str(output_dir))

if __name__ == "__main__":
    main()
