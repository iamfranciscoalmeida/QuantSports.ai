#!/usr/bin/env python3
"""
Odds API Test Script

Test the Odds API with different date ranges and show available options.
"""

import logging
import sys
from datetime import datetime, timedelta
from data_sources import OddsAPI
from config import ODDS_API_HISTORICAL_LIMIT_DAYS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

def test_current_odds():
    """Test fetching current/recent odds data"""
    logger.info("=== Testing Current Odds Data ===")
    
    odds_api = OddsAPI()
    today = datetime.now().date()
    
    # Test with today's date
    logger.info(f"Testing odds for today: {today}")
    try:
        odds_data = odds_api.get_historical_odds(today.isoformat(), today.isoformat())
        if odds_data:
            logger.info(f"✅ Found {len(odds_data)} matches with odds for today")
            
            # Show sample match
            if odds_data:
                sample = odds_data[0]
                logger.info(f"Sample match: {sample.get('home_team', 'N/A')} vs {sample.get('away_team', 'N/A')}")
                bookmakers = sample.get('bookmakers', [])
                if bookmakers:
                    logger.info(f"Available bookmakers: {len(bookmakers)}")
                else:
                    logger.info("No bookmaker data available")
        else:
            logger.info("⚠️  No matches with odds found for today")
    except Exception as e:
        logger.error(f"❌ Failed to fetch today's odds: {e}")
    
    # Test with recent dates
    for days_ago in [1, 2, 3, 7]:
        test_date = (today - timedelta(days=days_ago)).isoformat()
        logger.info(f"Testing odds for {days_ago} days ago: {test_date}")
        
        try:
            odds_data = odds_api.get_historical_odds(test_date, test_date)
            if odds_data:
                logger.info(f"✅ Found {len(odds_data)} matches with odds for {test_date}")
            else:
                logger.info(f"⚠️  No matches with odds for {test_date}")
        except Exception as e:
            logger.warning(f"❌ Failed to fetch odds for {test_date}: {e}")

def test_live_odds():
    """Test fetching live/upcoming odds (if available)"""
    logger.info("=== Testing Live/Upcoming Odds ===")
    
    odds_api = OddsAPI()
    
    # The Odds API also has endpoints for live/upcoming matches
    # Let's try the current odds endpoint (not historical)
    try:
        # This would be a different endpoint - live odds
        # For historical API, we're limited to past matches
        logger.info("Note: Your current API subscription is for historical data only")
        logger.info("For live/upcoming odds, you would need the live odds endpoint")
        logger.info("Historical API is limited to past matches within your subscription period")
        
    except Exception as e:
        logger.error(f"Live odds test failed: {e}")

def show_odds_options():
    """Show different options for getting odds data"""
    logger.info("=== Odds Data Options ===")
    
    current_limit = ODDS_API_HISTORICAL_LIMIT_DAYS
    oldest_allowed = (datetime.now() - timedelta(days=current_limit)).date()
    
    logger.info(f"Current subscription allows odds data from: {oldest_allowed} onwards")
    logger.info(f"This means {current_limit} days of historical data")
    
    logger.info("\n📋 Options to get more odds data:")
    logger.info("1. **Upgrade Odds API Subscription:**")
    logger.info("   - Visit https://the-odds-api.com/")
    logger.info("   - Choose a plan with more historical data access")
    logger.info("   - Update ODDS_API_HISTORICAL_LIMIT_DAYS in config.py")
    
    logger.info("\n2. **Focus on Recent Matches:**")
    logger.info("   - Process only current season matches from recent weeks")
    logger.info("   - Set up daily pipeline runs to capture odds as matches happen")
    
    logger.info("\n3. **Alternative Odds Sources:**")
    logger.info("   - Web scraping (ensure compliance with terms)")
    logger.info("   - CSV import from other sources")
    logger.info("   - Partner with odds data providers")
    
    logger.info("\n4. **Hybrid Approach:**")
    logger.info("   - Use Football Data API for match results (works great)")
    logger.info("   - Add odds data separately when available")
    logger.info("   - Build historical dataset over time")

def create_sample_with_current_odds():
    """Create a sample pipeline run with current odds data"""
    logger.info("=== Sample Pipeline with Current Odds ===")
    
    from data_sources import FootballDataAPI
    
    # Get recent matches that might have odds
    football_api = FootballDataAPI()
    odds_api = OddsAPI()
    
    logger.info("Getting current season matches...")
    matches_2024 = football_api.get_season_matches('2024')
    
    if matches_2024:
        logger.info(f"Found {len(matches_2024)} matches from 2024 season")
        
        # Filter for very recent matches (if any)
        recent_matches = []
        cutoff_date = (datetime.now() - timedelta(days=ODDS_API_HISTORICAL_LIMIT_DAYS)).date()
        
        for match in matches_2024:
            match_date = datetime.fromisoformat(match['date']).date()
            if match_date >= cutoff_date:
                recent_matches.append(match)
        
        logger.info(f"Found {len(recent_matches)} matches within odds API limit ({ODDS_API_HISTORICAL_LIMIT_DAYS} days)")
        
        if recent_matches:
            logger.info("These matches could potentially have odds data:")
            for match in recent_matches[:5]:  # Show first 5
                logger.info(f"  - {match['date']}: {match['home_team']} vs {match['away_team']}")
            
            # Try to enrich with odds
            logger.info("Attempting to fetch odds for recent matches...")
            enriched = odds_api.enrich_matches_with_odds(recent_matches)
            
            odds_count = len([m for m in enriched if m.get('odds_opening')])
            logger.info(f"Successfully added odds to {odds_count} matches")
            
        else:
            logger.info("No recent matches found within the odds API date limit")
            logger.info(f"The most recent 2024 match needs to be after {cutoff_date}")

def main():
    """Run odds API tests and show options"""
    logger.info("Starting Odds API Analysis...")
    
    test_current_odds()
    test_live_odds()
    show_odds_options()
    create_sample_with_current_odds()
    
    logger.info("\n=== Summary ===")
    logger.info("Odds data is null because most 2024 matches are outside your API's date limit")
    logger.info("Consider upgrading your Odds API subscription for historical data")
    logger.info("Or focus on current matches and build your dataset over time")

if __name__ == "__main__":
    main() 