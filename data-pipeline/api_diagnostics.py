#!/usr/bin/env python3
"""
API Diagnostics Script for EPL Data Pipeline

This script helps diagnose API connectivity and subscription limitations
before running the full pipeline.
"""

import logging
import sys
from datetime import datetime, timedelta

from data_sources import FootballDataAPI, OddsAPI
from config import SEASONS, FOOTBALL_DATA_FREE_TIER_START_SEASON, ODDS_API_HISTORICAL_LIMIT_DAYS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

def test_football_data_api():
    """Test Football Data API connectivity and subscription limits"""
    logger.info("=== Testing Football Data API ===")
    
    football_api = FootballDataAPI()
    
    # Test with current allowed season
    test_season = FOOTBALL_DATA_FREE_TIER_START_SEASON
    logger.info(f"Testing with season {test_season}")
    
    try:
        matches = football_api.get_season_matches(test_season)
        if matches:
            logger.info(f"✅ Successfully fetched {len(matches)} matches for season {test_season}")
            logger.info(f"Sample match: {matches[0]['home_team']} vs {matches[0]['away_team']} on {matches[0]['date']}")
        else:
            logger.warning(f"⚠️  No matches returned for season {test_season}")
    except Exception as e:
        logger.error(f"❌ Failed to fetch matches for season {test_season}: {e}")
    
    # Test with restricted season
    restricted_season = '2021'
    logger.info(f"Testing with restricted season {restricted_season}")
    
    try:
        matches = football_api.get_season_matches(restricted_season)
        if matches:
            logger.info(f"✅ Unexpectedly got {len(matches)} matches for restricted season {restricted_season}")
        else:
            logger.info(f"✅ Correctly skipped restricted season {restricted_season}")
    except Exception as e:
        logger.error(f"❌ Error handling restricted season {restricted_season}: {e}")

def test_odds_api():
    """Test Odds API connectivity and historical limitations"""
    logger.info("=== Testing Odds API ===")
    
    odds_api = OddsAPI()
    
    # Test with recent date (should work)
    recent_date = (datetime.now() - timedelta(days=7)).date().isoformat()
    logger.info(f"Testing with recent date: {recent_date}")
    
    try:
        odds_data = odds_api.get_historical_odds(recent_date, recent_date)
        if odds_data:
            logger.info(f"✅ Successfully fetched odds data for {recent_date}")
            logger.info(f"Found {len(odds_data)} matches with odds")
        else:
            logger.info(f"⚠️  No odds data returned for {recent_date}")
    except Exception as e:
        logger.error(f"❌ Failed to fetch odds for {recent_date}: {e}")
    
    # Test with old date (should be filtered out)
    old_date = (datetime.now() - timedelta(days=ODDS_API_HISTORICAL_LIMIT_DAYS + 10)).date().isoformat()
    logger.info(f"Testing with old date: {old_date} (should be filtered)")
    
    # Create a mock match to test filtering
    mock_matches = [{
        'match_id': 'test_match',
        'date': old_date,
        'home_team': 'Arsenal',
        'away_team': 'Chelsea'
    }]
    
    try:
        odds_data = odds_api.get_odds_for_matches(mock_matches)
        if not odds_data:
            logger.info(f"✅ Correctly filtered out old date {old_date}")
        else:
            logger.warning(f"⚠️  Unexpectedly got odds data for old date {old_date}")
    except Exception as e:
        logger.error(f"❌ Error testing old date filtering: {e}")

def check_configuration():
    """Check configuration and environment setup"""
    logger.info("=== Checking Configuration ===")
    
    from config import FOOTBALL_DATA_API_KEY, ODDS_API_KEY
    
    # Check API keys
    if FOOTBALL_DATA_API_KEY:
        logger.info("✅ Football Data API key is configured")
    else:
        logger.error("❌ Football Data API key is missing")
    
    if ODDS_API_KEY:
        logger.info("✅ Odds API key is configured")
    else:
        logger.error("❌ Odds API key is missing")
    
    # Show current settings
    logger.info(f"Configured seasons: {SEASONS}")
    logger.info(f"Football Data free tier start season: {FOOTBALL_DATA_FREE_TIER_START_SEASON}")
    logger.info(f"Odds API historical limit: {ODDS_API_HISTORICAL_LIMIT_DAYS} days")

def main():
    """Run all diagnostic tests"""
    logger.info("Starting API Diagnostics...")
    
    check_configuration()
    test_football_data_api()
    test_odds_api()
    
    logger.info("=== Diagnostic Summary ===")
    logger.info("If all tests passed, you can run the main pipeline with:")
    logger.info("python etl_main.py --season 2024")
    logger.info("or")
    logger.info("python etl_main.py --all-seasons")

if __name__ == "__main__":
    main() 