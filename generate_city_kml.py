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

def load_data_dictionary(file_path):
    """Load the data dictionary that maps column IDs to display names."""
    try:
        df = pd.read_csv(file_path)
        return dict(zip(df['ID'], df['Name']))
    except Exception as e:
        print(f"Warning: Could not load data dictionary: {e}")
        return {}

def load_calc_fields(file_path):
    """Load the calculated fields definitions."""
    try:
        df = pd.read_csv(file_path)
        return dict(zip(df['Name'], df['Formula']))
    except Exception as e:
        print(f"Warning: Could not load calculated fields: {e}")
        return {}

def evaluate_formula(formula, row_data):
    """Evaluate a formula using the row data."""
    try:
        # First add spaces around operators to ensure proper parsing
        expr = formula
        for op in ['*', '/', '+', '-', '(', ')']:
            expr = expr.replace(op, f' {op} ')
        
        # Split into tokens and process each one
        tokens = expr.split()
        for i, token in enumerate(tokens):
            # Skip operators and numbers
            if token in ['*', '/', '+', '-', '(', ')'] or token[0].isdigit():
                continue
                
            # Try to find this token in row_data
            if token in row_data:
                value = row_data[token]
                if pd.isna(value):
                    value = 0
                # If value is very small (less than 1e-10), set to 0
                if abs(float(value)) < 1e-10:
                    value = 0
                tokens[i] = str(float(value))
            else:
                print(f"Warning: Variable {token} not found in data")
                tokens[i] = "0"
        
        # Rejoin the expression
        expr = ' '.join(tokens)
        
        # Check for division by zero
        parts = expr.split('/')
        for i in range(1, len(parts)):
            try:
                denominator = float(parts[i].split()[0])
                if abs(denominator) < 1e-10:
                    return 0
            except:
                pass
            
        # Evaluate the expression with safe division
        def safe_div(x, y):
            try:
                if y == 0 or pd.isna(y) or abs(y) < 1e-10:
                    return 0
                result = x / y
                # If result is very small, return 0
                if abs(result) < 1e-10:
                    return 0
                return result
            except:
                return 0
                
        # Add safe division to the evaluation context
        eval_context = {'safe_div': safe_div}
        
        # Replace normal division with safe division call
        parts = expr.split('/')
        if len(parts) > 1:
            expr = 'safe_div(' + ','.join(parts) + ')'
        
        result = eval(expr, {"__builtins__": {}}, eval_context)
        # If final result is very small, return 0
        if abs(result) < 1e-10:
            return 0
        return float(result)
    except Exception as e:
        print(f"Warning: Could not evaluate formula '{formula}' (processed to '{expr}'): {e}")
        return 0

def create_kml_content(features, square_size_lat, square_size_lon, field_mapping=None):
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
            # Keep numeric precision for all values
            if pd.notna(value) and isinstance(value, (int, float)):
                # Use 4 decimal places for values <= 1, otherwise use 2
                value = float(value)
                if abs(value) <= 1:
                    value = round(value, 4)
                else:
                    value = round(value, 2)
            else:
                value = 0
            
            # Use mapped name if available, otherwise use original key
            mapped_key = field_mapping.get(key, key) if field_mapping else key
            placemark.append(f'<data name="{mapped_key}">{value}</data>')
        
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

def write_kml_file(filename, features, square_size_lat, square_size_lon, field_mapping=None):
    """Write KML content to a file."""
    kml_content = create_kml_content(features, square_size_lat, square_size_lon, field_mapping)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(kml_content)

def process_city(input_file, output_kml_dir):
    """Process a single city's demographics file and create KML."""
    print(f"Processing {input_file}...")
    
    # Load data dictionary from data folder
    data_folder = os.path.dirname(os.path.dirname(input_file))
    data_dict_path = os.path.join(data_folder, 'data_dictionary.csv')
    calc_fields_path = os.path.join(data_folder, 'calc_fields.csv')
    
    field_mapping = load_data_dictionary(data_dict_path)
    calc_fields = load_calc_fields(calc_fields_path)
    
    # Read the input CSV
    df = pd.read_csv(input_file)
    
    # Calculate point spacing
    lat_spacing, lon_spacing = calculate_point_spacing(df)
    
    # Prepare features list
    features = []
    for _, row in df.iterrows():
        # Get base metrics
        metrics = {col: row[col] for col in df.columns if col not in ['Name', 'Latitude', 'Longitude']}
        
        # Add calculated fields
        for field_name, formula in calc_fields.items():
            metrics[field_name] = evaluate_formula(formula, row)
        
        features.append({
            'Name': row['Name'],
            'Latitude': row['Latitude'],
            'Longitude': row['Longitude'],
            'metrics': metrics
        })
    
    # Create output filename
    city_name = os.path.splitext(os.path.basename(input_file))[0]
    output_file = os.path.join(output_kml_dir, f'{city_name}.kml')
    
    # Write KML file
    write_kml_file(output_file, features, lat_spacing, lon_spacing, field_mapping)
    print(f"Created {output_file}")

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
