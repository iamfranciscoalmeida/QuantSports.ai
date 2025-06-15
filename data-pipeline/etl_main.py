#!/usr/bin/env python3
"""
EPL Historical Sports Betting Data Pipeline - Main ETL Script

This script orchestrates the extraction, transformation, and loading of EPL match data
including results and betting odds from multiple sources.

Usage:
    python etl_main.py --season 2023 --save-csv
    python etl_main.py --all-seasons --update-odds-only
"""

import argparse
import logging
import sys
from datetime import datetime
from typing import List, Dict

from data_sources import FootballDataAPI, OddsAPI
from database import MatchDatabase
from config import SEASONS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'etl_pipeline_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)

logger = logging.getLogger(__name__)

class EPLDataPipeline:
    """Main pipeline class for EPL data ingestion"""
    
    def __init__(self):
        self.football_api = FootballDataAPI()
        self.odds_api = OddsAPI()
        self.database = MatchDatabase()
    
    def extract_season_data(self, season: str, include_odds: bool = True) -> List[Dict]:
        """
        Extract all data for a specific season
        
        Args:
            season: Season year (e.g., '2023')
            include_odds: Whether to include odds data
            
        Returns:
            List of complete match dictionaries
        """
        logger.info(f"Starting data extraction for season {season}")
        
        # Step 1: Get match results from football-data.org
        matches = self.football_api.get_season_matches(season)
        
        if not matches:
            logger.warning(f"No matches found for season {season}")
            return []
        
        logger.info(f"Extracted {len(matches)} matches for season {season}")
        
        # Step 2: Enrich with odds data if requested
        if include_odds:
            matches = self.odds_api.enrich_matches_with_odds(matches)
        
        return matches
    
    def transform_and_validate(self, matches: List[Dict]) -> List[Dict]:
        """
        Transform and validate match data
        
        Args:
            matches: Raw match data
            
        Returns:
            Validated and transformed matches
        """
        validated_matches = []
        
        for match in matches:
            # Validate match data
            errors = self.database.validate_match_data(match)
            
            if errors:
                logger.warning(f"Validation errors for match {match.get('match_id', 'unknown')}: {errors}")
                continue
            
            validated_matches.append(match)
        
        logger.info(f"Validated {len(validated_matches)} out of {len(matches)} matches")
        return validated_matches
    
    def load_to_database(self, matches: List[Dict]) -> Dict:
        """
        Load matches to database
        
        Args:
            matches: Validated match data
            
        Returns:
            Load results dictionary
        """
        return self.database.insert_matches(matches)
    
    def run_full_pipeline(self, seasons: List[str], save_csv: bool = False, include_odds: bool = True) -> Dict:
        """
        Run the complete ETL pipeline for specified seasons
        
        Args:
            seasons: List of season years to process
            save_csv: Whether to save data to CSV files
            include_odds: Whether to include odds data
            
        Returns:
            Pipeline execution summary
        """
        logger.info(f"Starting full pipeline for seasons: {seasons}")
        
        total_processed = 0
        total_inserted = 0
        total_updated = 0
        total_errors = 0
        
        for season in seasons:
            try:
                # Extract
                matches = self.extract_season_data(season, include_odds)
                
                if not matches:
                    continue
                
                # Transform & Validate
                validated_matches = self.transform_and_validate(matches)
                
                # Save to CSV if requested
                if save_csv:
                    csv_filename = f"epl_matches_{season}.csv"
                    self.database.save_to_csv(validated_matches, csv_filename)
                
                # Load to database
                load_results = self.load_to_database(validated_matches)
                
                # Update totals
                total_processed += len(validated_matches)
                total_inserted += load_results['inserted']
                total_updated += load_results['updated']
                total_errors += load_results['errors']
                
                logger.info(f"Completed season {season}: {len(validated_matches)} processed")
                
            except Exception as e:
                logger.error(f"Failed to process season {season}: {e}")
                continue
        
        summary = {
            "seasons_processed": len(seasons),
            "total_matches_processed": total_processed,
            "total_inserted": total_inserted,
            "total_updated": total_updated,
            "total_errors": total_errors,
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Pipeline completed: {summary}")
        return summary
    
    def update_odds_only(self) -> Dict:
        """
        Update odds for existing matches that don't have odds data
        
        Returns:
            Update results dictionary
        """
        logger.info("Starting odds-only update for existing matches")
        
        # Get matches without odds
        matches_without_odds = self.database.get_matches_without_odds()
        
        if not matches_without_odds:
            logger.info("No matches found without odds data")
            return {"updated": 0, "errors": 0}
        
        logger.info(f"Found {len(matches_without_odds)} matches without odds data")
        
        # Enrich with odds
        enriched_matches = self.odds_api.enrich_matches_with_odds(matches_without_odds)
        
        # Filter only matches that now have odds
        matches_with_new_odds = [m for m in enriched_matches if m.get('odds_opening')]
        
        if not matches_with_new_odds:
            logger.info("No new odds data obtained")
            return {"updated": 0, "errors": 0}
        
        # Update database
        results = self.database.insert_matches(matches_with_new_odds)
        
        logger.info(f"Odds update completed: {results}")
        return results

def main():
    """Main function with CLI interface"""
    parser = argparse.ArgumentParser(description='EPL Historical Data Pipeline')
    parser.add_argument('--season', type=str, help='Specific season to process (e.g., 2023)')
    parser.add_argument('--all-seasons', action='store_true', help='Process all configured seasons')
    parser.add_argument('--save-csv', action='store_true', help='Save data to CSV files')
    parser.add_argument('--update-odds-only', action='store_true', help='Only update odds for existing matches')
    parser.add_argument('--no-odds', action='store_true', help='Skip odds data (matches only)')
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = EPLDataPipeline()
    
    try:
        if args.update_odds_only:
            # Update odds only
            pipeline.update_odds_only()
            
        elif args.season:
            # Process specific season
            pipeline.run_full_pipeline(
                seasons=[args.season],
                save_csv=args.save_csv,
                include_odds=not args.no_odds
            )
            
        elif args.all_seasons:
            # Process all configured seasons
            pipeline.run_full_pipeline(
                seasons=SEASONS,
                save_csv=args.save_csv,
                include_odds=not args.no_odds
            )
            
        else:
            # Default: process current season
            current_year = str(datetime.now().year)
            pipeline.run_full_pipeline(
                seasons=[current_year],
                save_csv=args.save_csv,
                include_odds=not args.no_odds
            )
            
    except KeyboardInterrupt:
        logger.info("Pipeline interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Pipeline failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()