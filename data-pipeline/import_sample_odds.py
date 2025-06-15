#!/usr/bin/env python3
"""
Sample Odds Import Script

Demonstrates how to import odds data from CSV files as an alternative to API.
This can be useful when API subscriptions are limited.
"""

import pandas as pd
import logging
import sys
from datetime import datetime
from database import MatchDatabase

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

def create_sample_odds_csv():
    """Create a sample CSV file with odds data for demonstration"""
    
    sample_odds_data = [
        {
            'match_id': 'EPL_2024_05_19_Manchester_City_FC_West_Ham_United_FC',
            'date': '2024-05-19',
            'home_team': 'Manchester City FC',
            'away_team': 'West Ham United FC',
            'home_win_odds': 1.25,
            'draw_odds': 6.50,
            'away_win_odds': 12.00,
            'bookmaker': 'Sample Bookie',
            'market_type': '1X2'
        },
        {
            'match_id': 'EPL_2024_05_19_Arsenal_FC_Everton_FC',
            'date': '2024-05-19',
            'home_team': 'Arsenal FC',
            'away_team': 'Everton FC',
            'home_win_odds': 1.40,
            'draw_odds': 5.00,
            'away_win_odds': 7.50,
            'bookmaker': 'Sample Bookie',
            'market_type': '1X2'
        },
        {
            'match_id': 'EPL_2024_05_19_Liverpool_FC_Crystal_Palace_FC',
            'date': '2024-05-19',
            'home_team': 'Liverpool FC',
            'away_team': 'Crystal Palace FC',
            'home_win_odds': 1.60,
            'draw_odds': 4.20,
            'away_win_odds': 5.80,
            'bookmaker': 'Sample Bookie',
            'market_type': '1X2'
        }
    ]
    
    df = pd.DataFrame(sample_odds_data)
    csv_filename = 'sample_odds_data.csv'
    df.to_csv(csv_filename, index=False)
    
    logger.info(f"Created sample odds CSV: {csv_filename}")
    logger.info(f"Sample contains {len(sample_odds_data)} matches with odds")
    
    return csv_filename

def convert_csv_to_match_format(csv_file):
    """Convert CSV odds data to match database format"""
    
    logger.info(f"Reading odds data from {csv_file}")
    df = pd.read_csv(csv_file)
    
    enriched_matches = []
    
    for _, row in df.iterrows():
        # Convert CSV format to match database format
        match_data = {
            'match_id': row['match_id'],
            'date': row['date'],
            'home_team': row['home_team'],
            'away_team': row['away_team'],
            'league': 'Premier League',
            'season': '2024/25',
            'market': row.get('market_type', '1X2'),
            'odds_opening': {
                '1': row['home_win_odds'],
                'X': row['draw_odds'], 
                '2': row['away_win_odds']
            },
            'odds_closing': {
                '1': row['home_win_odds'],
                'X': row['draw_odds'],
                '2': row['away_win_odds']
            },
            'result_home': None,  # Would be filled from match results
            'result_away': None,
            'xg': None
        }
        
        enriched_matches.append(match_data)
    
    logger.info(f"Converted {len(enriched_matches)} matches to database format")
    return enriched_matches

def merge_with_existing_matches():
    """Demonstrate merging CSV odds with existing match results"""
    
    logger.info("=== Demonstrating Odds Import Process ===")
    
    # Step 1: Create sample CSV
    csv_file = create_sample_odds_csv()
    
    # Step 2: Convert to match format
    odds_matches = convert_csv_to_match_format(csv_file)
    
    # Step 3: Show how this would merge with existing data
    logger.info("How this works with your existing pipeline:")
    logger.info("1. Your Football Data API extracts match results (✅ Working)")
    logger.info("2. You import odds from CSV files (☑️ Demonstrated here)")
    logger.info("3. Pipeline merges odds with match results by match_id")
    logger.info("4. Complete dataset gets saved to database")
    
    # Show sample merged data
    logger.info("\nSample enriched match with odds:")
    sample_match = odds_matches[0]
    for key, value in sample_match.items():
        logger.info(f"  {key}: {value}")
    
    return odds_matches

def demonstrate_database_integration():
    """Show how to integrate odds data with database"""
    
    logger.info("\n=== Database Integration Example ===")
    
    try:
        db = MatchDatabase()
        
        # Get existing matches without odds
        existing_matches = db.get_matches_without_odds()
        logger.info(f"Found {len(existing_matches)} matches without odds in database")
        
        if existing_matches:
            logger.info("Sample matches that could be enriched with CSV odds:")
            for match in existing_matches[:3]:  # Show first 3
                logger.info(f"  - {match.get('date', 'N/A')}: {match.get('home_team', 'N/A')} vs {match.get('away_team', 'N/A')}")
        
        logger.info("\nTo enrich these matches:")
        logger.info("1. Export match IDs to CSV")
        logger.info("2. Add odds data manually or from another source")
        logger.info("3. Import back using this script")
        logger.info("4. Update database with enriched data")
        
    except Exception as e:
        logger.warning(f"Could not connect to database: {e}")
        logger.info("Make sure to configure your Supabase service role key first")

def show_alternative_sources():
    """Show alternative sources for odds data"""
    
    logger.info("\n=== Alternative Odds Data Sources ===")
    
    logger.info("🔍 Free/Low-cost Sources:")
    logger.info("  • Historical data websites (manually export to CSV)")
    logger.info("  • Sports databases with odds (BigQuery public datasets)")
    logger.info("  • Academic datasets (research repositories)")
    logger.info("  • Betting forums (community-shared data)")
    
    logger.info("\n💰 Paid Alternatives:")
    logger.info("  • The Odds API ($30/month for historical data)")
    logger.info("  • SportsDataIO Vault (comprehensive historical odds)")
    logger.info("  • Sportradar (enterprise solution)")
    logger.info("  • Direct bookmaker feeds (high volume)")
    
    logger.info("\n🛠️ DIY Solutions:")
    logger.info("  • Web scraping (ensure compliance)")
    logger.info("  • Manual data entry for key matches")
    logger.info("  • Partner with other researchers")
    logger.info("  • Build dataset over time with daily collection")

def main():
    """Run the odds import demonstration"""
    
    logger.info("Starting Odds Import Demonstration...")
    
    # Demonstrate the import process
    merge_with_existing_matches()
    
    # Show database integration
    demonstrate_database_integration()
    
    # Show alternatives
    show_alternative_sources()
    
    logger.info("\n=== Summary ===")
    logger.info("✅ Match results: Working perfectly (380 matches from 2024)")
    logger.info("❌ Odds data: Blocked by API subscription limits")
    logger.info("💡 Solutions: Upgrade API subscription or use CSV import method")
    logger.info("🚀 Next step: Decide on odds data strategy based on budget and needs")

if __name__ == "__main__":
    main() 