import os
import re
import json
import time
import logging
import pandas as pd
import requests
from datetime import datetime
from dotenv import load_dotenv
from tqdm import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('geocoding.log'),
        logging.StreamHandler()
    ]
)

# Load environment variables
load_dotenv()
MAPBOX_TOKEN = os.getenv('MAPBOX_TOKEN')

if not MAPBOX_TOKEN:
    raise ValueError("Please set MAPBOX_TOKEN in your .env file")

def clean_address(address, state):
    """Clean address by removing phone numbers and extra whitespace"""
    # Handle non-string inputs
    if pd.isna(address) or pd.isna(state):
        return None
    
    address = str(address)
    state = str(state)
    
    # Remove phone numbers (patterns like (XXX) XXX-XXXX)
    address = re.sub(r'\(\d{3}\)\s*\d{3}-\d{4}', '', address)
    # Remove other phone number formats
    address = re.sub(r'\d{3}-\d{3}-\d{4}', '', address)
    
    # Remove suite/unit numbers after #
    address = re.sub(r'#\s*[A-Za-z0-9-]+(?=[\s,]|$)', '', address)
    # Remove suite/unit numbers after Ste/Suite
    address = re.sub(r'(?:Ste|Suite)\s+[A-Za-z0-9-]+(?=[\s,]|$)', '', address)
    # Remove unit numbers after Unit
    address = re.sub(r'Unit\s+[A-Za-z0-9-]+(?=[\s,]|$)', '', address)
    
    # Clean up newlines and extra spaces
    address = ' '.join(part.strip() for part in address.split('\n') if part.strip())
    # Remove multiple spaces
    address = re.sub(r'\s+', ' ', address)
    # Remove any remaining #
    address = address.replace('#', '')
    
    # Add state if not in address
    if state not in address:
        address = f"{address}, {state}"
    
    # Clean up any double commas
    address = re.sub(r',\s*,', ',', address)
    return address.strip()

def batch_geocode(addresses, retry_count=3, delay=1):
    """
    Geocode multiple addresses in a single request
    """
    if not addresses:
        return []
    
    start_time = time.time()
    
    # Prepare the batch request
    # Note: We're using the temporary solution of multiple API calls
    # In production, you'd want to use Mapbox's batch geocoding endpoint
    results = []
    
    for address in addresses:
        for attempt in range(retry_count):
            try:
                response = requests.get(
                    f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json",
                    params={
                        "access_token": MAPBOX_TOKEN,
                        "limit": 1,
                        "country": "US"
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if data['features']:
                    feature = data['features'][0]
                    results.append({
                        'address': address,
                        'coordinates': feature['geometry']['coordinates'],
                        'confidence': feature.get('relevance', 0),
                        'place_name': feature['place_name']
                    })
                else:
                    results.append(None)
                    logging.warning(f"No results found for address: {address}")
                
                # Add a small delay between requests to respect rate limits
                time.sleep(0.1)
                break
                
            except requests.exceptions.RequestException as e:
                if attempt == retry_count - 1:
                    results.append(None)
                    logging.error(f"Failed to geocode address: {address}")
                    logging.error(f"Error: {str(e)}")
                else:
                    time.sleep(delay * (attempt + 1))
    
    elapsed = time.time() - start_time
    logging.debug(f"Batch geocoded {len(addresses)} addresses in {elapsed:.2f}s")
    return results

def process_schools(input_csv, output_geojson, batch_size=25):
    """
    Process school data from CSV and create a GeoJSON file
    """
    start_time = time.time()
    logging.info(f"Starting geocoding process at {datetime.now()}")
    
    # Read CSV file
    df = pd.read_csv(input_csv)
    # Drop rows with missing addresses or states
    df = df.dropna(subset=['address', 'state'])
    logging.info(f"Loaded {len(df)} schools from {input_csv}")
    
    # Initialize GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    # Create cache directory if it doesn't exist
    os.makedirs('cache', exist_ok=True)
    cache_file = 'cache/geocoding_cache.json'
    
    # Load existing cache
    geocoding_cache = {}
    if os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            geocoding_cache = json.load(f)
            logging.info(f"Loaded {len(geocoding_cache)} cached geocoding results")
    
    # Track statistics
    cache_hits = 0
    successful_geocodes = 0
    failed_geocodes = 0
    
    # Process schools in batches
    for i in tqdm(range(0, len(df), batch_size)):
        batch_df = df.iloc[i:i+batch_size]
        
        # Prepare addresses to geocode
        addresses_to_geocode = []
        batch_rows = []
        
        for _, row in batch_df.iterrows():
            clean_addr = clean_address(row['address'], row['state'])
            if clean_addr is None:
                continue
                
            address_key = clean_addr.lower().replace(' ', '')
            
            if address_key in geocoding_cache:
                cache_hits += 1
                if geocoding_cache[address_key]:
                    # Handle NaN values for JSON serialization
                    properties = {
                        "name": row['name'] if pd.notna(row['name']) else None,
                        "address": clean_addr,
                        "tuition": float(row['tuition']) if pd.notna(row['tuition']) else None,
                        "grades": row['grades'] if pd.notna(row['grades']) else None,
                        "religion": row['religion'] if pd.notna(row['religion']) else None,
                        "state": row['state'],
                        "confidence": geocoding_cache[address_key]['confidence'],
                        "place_name": geocoding_cache[address_key]['place_name']
                    }
                    
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": geocoding_cache[address_key]['coordinates']
                        },
                        "properties": properties
                    }
                    geojson['features'].append(feature)
            else:
                addresses_to_geocode.append(clean_addr)
                batch_rows.append(row)
        
        # Geocode new addresses
        if addresses_to_geocode:
            results = batch_geocode(addresses_to_geocode)
            
            for j, result in enumerate(results):
                row = batch_rows[j]
                address_key = addresses_to_geocode[j].lower().replace(' ', '')
                
                if result:
                    successful_geocodes += 1
                    geocoding_cache[address_key] = result
                    
                    # Handle NaN values for JSON serialization
                    properties = {
                        "name": row['name'] if pd.notna(row['name']) else None,
                        "address": addresses_to_geocode[j],
                        "tuition": float(row['tuition']) if pd.notna(row['tuition']) else None,
                        "grades": row['grades'] if pd.notna(row['grades']) else None,
                        "religion": row['religion'] if pd.notna(row['religion']) else None,
                        "state": row['state'],
                        "confidence": result['confidence'],
                        "place_name": result['place_name']
                    }
                    
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": result['coordinates']
                        },
                        "properties": properties
                    }
                    geojson['features'].append(feature)
                else:
                    failed_geocodes += 1
                    geocoding_cache[address_key] = None
        
        # Save cache periodically
        if i % (batch_size * 10) == 0:
            with open(cache_file, 'w') as f:
                json.dump(geocoding_cache, f)
            logging.info(f"Saved cache with {len(geocoding_cache)} entries (processed {i}/{len(df)} schools)")
    
    # Save final cache
    with open(cache_file, 'w') as f:
        json.dump(geocoding_cache, f)
    
    # Save GeoJSON
    with open(output_geojson, 'w') as f:
        json.dump(geojson, f)
    
    end_time = time.time()
    elapsed = end_time - start_time
    
    # Log final statistics
    logging.info("\nGeocoding Statistics:")
    logging.info(f"Total processing time: {elapsed:.2f} seconds")
    logging.info(f"Average time per school: {elapsed/len(df):.2f} seconds")
    logging.info(f"Total schools processed: {len(df)}")
    logging.info(f"Cache hits: {cache_hits}")
    logging.info(f"Successful new geocodes: {successful_geocodes}")
    logging.info(f"Failed geocodes: {failed_geocodes}")
    logging.info(f"Success rate: {((cache_hits + successful_geocodes) / len(df)) * 100:.1f}%")
    logging.info(f"GeoJSON saved to: {output_geojson}")
    logging.info(f"Geocoding cache saved to: {cache_file}")

def reformat_geojson(input_csv, output_geojson, cache_file='cache/geocoding_cache.json'):
    """
    Reformat existing geocoded data with proper JSON null values without re-geocoding
    """
    logging.info("Reformatting GeoJSON with proper null values...")
    
    # Read CSV file
    df = pd.read_csv(input_csv)
    df = df.dropna(subset=['address', 'state'])
    
    # Load existing cache
    if not os.path.exists(cache_file):
        raise FileNotFoundError(f"Cache file {cache_file} not found. Please run geocoding first.")
        
    with open(cache_file, 'r') as f:
        geocoding_cache = json.load(f)
    
    # Initialize GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    # Process all schools
    for _, row in tqdm(df.iterrows(), total=len(df)):
        clean_addr = clean_address(row['address'], row['state'])
        if clean_addr is None:
            continue
            
        address_key = clean_addr.lower().replace(' ', '')
        
        if address_key in geocoding_cache and geocoding_cache[address_key]:
            # Handle NaN values for JSON serialization
            properties = {
                "name": row['name'] if pd.notna(row['name']) else None,
                "address": clean_addr,
                "tuition": float(row['tuition']) if pd.notna(row['tuition']) else None,
                "grades": row['grades'] if pd.notna(row['grades']) else None,
                "religion": row['religion'] if pd.notna(row['religion']) else None,
                "state": row['state'],
                "confidence": geocoding_cache[address_key]['confidence'],
                "place_name": geocoding_cache[address_key]['place_name']
            }
            
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": geocoding_cache[address_key]['coordinates']
                },
                "properties": properties
            }
            geojson['features'].append(feature)
    
    # Save reformatted GeoJSON
    with open(output_geojson, 'w') as f:
        json.dump(geojson, f)
    
    logging.info(f"Reformatted {len(geojson['features'])} schools with proper null values")
    logging.info(f"GeoJSON saved to: {output_geojson}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Geocode school addresses to GeoJSON')
    parser.add_argument('input_csv', help='Input CSV file with school data')
    parser.add_argument('output_geojson', help='Output GeoJSON file')
    parser.add_argument('--batch-size', type=int, default=25,
                      help='Number of records to process in each batch (default: 25)')
    parser.add_argument('--debug', action='store_true',
                      help='Enable debug logging')
    parser.add_argument('--reformat-only', action='store_true',
                      help='Only reformat existing geocoded data without re-geocoding')
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    if args.reformat_only:
        reformat_geojson(args.input_csv, args.output_geojson)
    else:
        process_schools(args.input_csv, args.output_geojson, args.batch_size)
