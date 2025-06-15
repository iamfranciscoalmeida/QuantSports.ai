#!/usr/bin/env python3
"""
Database Connectivity Test

Test script to verify Supabase connection and permissions.
"""

import logging
import sys
from database import MatchDatabase
from config import SUPABASE_SERVICE_ROLE_KEY

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

def test_database_connection():
    """Test database connectivity and permissions"""
    logger.info("=== Testing Database Connection ===")
    
    # Check if service role key is configured
    if not SUPABASE_SERVICE_ROLE_KEY:
        logger.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables")
        logger.info("Please add your service role key to the .env file")
        return False
    
    logger.info("✅ Service role key is configured")
    
    try:
        # Initialize database with service role
        db = MatchDatabase(use_service_role=True)
        logger.info("✅ Database client initialized successfully")
        
        # Test read access
        existing_matches = db.get_existing_matches()
        logger.info(f"✅ Read access successful - found {len(existing_matches)} existing matches")
        
        # Test insert with a sample match
        test_match = {
            'match_id': 'TEST_MATCH_001',
            'date': '2024-01-01',
            'home_team': 'Test Home Team',
            'away_team': 'Test Away Team',
            'result_home': 2,
            'result_away': 1,
            'league': 'Test League',
            'season': '2024/25',
            'market': '1X2',
            'odds_opening': None,
            'odds_closing': None,
            'xg': None
        }
        
        # Test insert
        result = db.insert_matches([test_match])
        
        if result['errors'] == 0:
            logger.info("✅ Write access successful - test match inserted")
            
            # Clean up test match
            try:
                db.supabase.table("matches").delete().eq("match_id", "TEST_MATCH_001").execute()
                logger.info("✅ Test cleanup successful")
            except Exception as e:
                logger.warning(f"⚠️  Test cleanup failed (not critical): {e}")
                
        else:
            logger.error("❌ Write access failed - check RLS policies or permissions")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def main():
    """Run database connectivity test"""
    logger.info("Starting Database Connectivity Test...")
    
    success = test_database_connection()
    
    if success:
        logger.info("=== Test Summary ===")
        logger.info("✅ All database tests passed!")
        logger.info("You can now run the main pipeline:")
        logger.info("python3 etl_main.py --season 2024")
    else:
        logger.error("=== Test Summary ===")
        logger.error("❌ Database tests failed")
        logger.error("Please check your Supabase configuration and service role key")

if __name__ == "__main__":
    main() 