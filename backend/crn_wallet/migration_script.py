#!/usr/bin/env python
import os
import sys
import json
import logging
from datetime import datetime
import configparser
from pymongo import MongoClient
import glob

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def connect_to_mongodb():
    """Connect to MongoDB using configuration from config.ini"""
    # Read config file
    config = configparser.ConfigParser()
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.ini')
    
    if os.path.exists(config_path):
        config.read(config_path)
    else:
        logger.error(f"Config file not found at {config_path}")
        return None
    
    # Get MongoDB URI
    try:
        mongo_uri = config.get('Database', 'MongoURI', 
                             fallback='mongodb+srv://abdulrahman:GmsPvw6tspNufsYE@cluster0.pujvbqx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
        
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        return client
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        return None

def migrate_violations_to_mongodb(violations_folder_path):
    """Migrate mining violations from files to MongoDB database"""
    # Connect to MongoDB
    client = connect_to_mongodb()
    if not client:
        logger.error("Failed to connect to MongoDB. Migration aborted.")
        return False
    
    # Get database and collection
    mining_db = client["cryptonel_mining"]
    violations_collection = mining_db["mining_violations"]
    
    # Check if violations collection exists
    if "mining_violations" not in mining_db.list_collection_names():
        logger.info("Creating mining_violations collection")
        mining_db.create_collection("mining_violations")
    
    # Get all JSON files in the violations folder
    if not os.path.exists(violations_folder_path):
        logger.error(f"Violations folder not found at {violations_folder_path}")
        return False
    
    json_files = glob.glob(os.path.join(violations_folder_path, '*.json'))
    logger.info(f"Found {len(json_files)} violation files to migrate")
    
    if not json_files:
        logger.warning("No violation files found in the folder")
        return False
    
    # Track migration statistics
    stats = {
        "total_files": len(json_files),
        "migrated": 0,
        "errors": 0,
        "already_exist": 0
    }
    
    # Process each violation file
    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                violation_data = json.load(file)
            
            # Normalize the data structure if needed
            if not isinstance(violation_data, dict):
                logger.warning(f"Invalid violation data format in {file_path}")
                stats["errors"] += 1
                continue
            
            # Add _id if missing and timestamp if missing
            if "timestamp" not in violation_data:
                violation_data["timestamp"] = datetime.now().isoformat()
            
            # Check if this violation already exists by looking for similar fingerprint/IP combos
            if "browser_fingerprint" in violation_data and "ip_address" in violation_data:
                existing = violations_collection.find_one({
                    "browser_fingerprint": violation_data["browser_fingerprint"],
                    "ip_address": violation_data["ip_address"]
                })
                
                if existing:
                    logger.debug(f"Violation already exists in database, skipping {file_path}")
                    stats["already_exist"] += 1
                    continue
            
            # Insert the violation into MongoDB
            result = violations_collection.insert_one(violation_data)
            
            if result.inserted_id:
                logger.debug(f"Migrated violation {os.path.basename(file_path)}")
                stats["migrated"] += 1
            else:
                logger.warning(f"Failed to insert violation from {file_path}")
                stats["errors"] += 1
                
        except Exception as e:
            logger.error(f"Error migrating violation {file_path}: {e}")
            stats["errors"] += 1
    
    # Print migration summary
    logger.info(f"Migration completed: {stats['migrated']}/{stats['total_files']} violations migrated")
    logger.info(f"Already in database: {stats['already_exist']}")
    logger.info(f"Errors: {stats['errors']}")
    
    return stats["migrated"] > 0

if __name__ == "__main__":
    # Try to find the mining_violations folder in several possible locations
    possible_paths = [
        # Argument provided path
        sys.argv[1] if len(sys.argv) > 1 else None,
        
        # Relative to script
        "mining_violations",
        
        # In project root
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "mining_violations"),
        
        # Other possible locations
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "mining_violations"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "mining_violations"),
    ]
    
    # Filter out None values
    possible_paths = [p for p in possible_paths if p]
    
    # Try each path
    for folder_path in possible_paths:
        folder_path = os.path.abspath(folder_path)
        if os.path.exists(folder_path) and os.path.isdir(folder_path):
            logger.info(f"Found mining_violations folder at: {folder_path}")
            
            if migrate_violations_to_mongodb(folder_path):
                logger.info("Migration completed successfully")
                break
        else:
            logger.debug(f"Path does not exist or is not a directory: {folder_path}")
    else:
        # This runs if the loop completes without a break
        logger.error("Migration failed - could not find mining_violations folder in any of these locations:")
        for path in possible_paths:
            logger.error(f"  - {os.path.abspath(path)}")
        
        # Create an empty collection in MongoDB anyway
        try:
            client = connect_to_mongodb()
            if client:
                mining_db = client["cryptonel_mining"]
                if "mining_violations" not in mining_db.list_collection_names():
                    mining_db.create_collection("mining_violations")
                    logger.info("Created empty mining_violations collection in MongoDB")
                else:
                    logger.info("mining_violations collection already exists in MongoDB")
        except Exception as e:
            logger.error(f"Error creating empty collection: {e}") 