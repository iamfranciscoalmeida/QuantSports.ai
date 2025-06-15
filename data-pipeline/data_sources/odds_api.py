import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from retry import retry
import logging

from config import (
    ODDS_API_KEY,
    ODDS_API_BASE_URL,
    EPL_SPORT_KEY,
    MAX_REQUESTS_PER_MINUTE,
    TEAM_MAPPINGS,
    ODDS_API_HISTORICAL_LIMIT_DAYS
)

logger = logging.getLogger(__name__)

class OddsAPI:
    def __init__(self):
        self.base_url = ODDS_API_BASE_URL
        self.api_key = ODDS_API_KEY
        self.sport_key = EPL_SPORT_KEY
        self.request_count = 0
        self.last_request_time = time.time()
    
    def _rate_limit(self):
        """Implement rate limiting"""
        current_time = time.time()
        if current_time - self.last_request_time < 60:  # Within 1 minute
            if self.request_count >= MAX_REQUESTS_PER_MINUTE:
                sleep_time = 60 - (current_time - self.last_request_time)
                logger.info(f"Rate limit reached. Sleeping for {sleep_time:.2f} seconds")
                time.sleep(sleep_time)
                self.request_count = 0
                self.last_request_time = time.time()
        else:
            self.request_count = 0
            self.last_request_time = current_time
    
    @retry(tries=3, delay=1, backoff=2)
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make API request with rate limiting and retry logic"""
        self._rate_limit()
        
        # Add API key to params
        if params is None:
            params = {}
        params['apiKey'] = self.api_key
        
        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, params=params)
        
        self.request_count += 1
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            logger.warning("Rate limit exceeded. Retrying...")
            time.sleep(60)
            raise Exception("Rate limit exceeded")
        elif response.status_code == 422:
            # Handle unprocessable entity (invalid date) - don't retry
            logger.error(f"Invalid date parameter for odds API: {response.text}")
            return []  # Return empty list instead of raising exception
        else:
            logger.error(f"API request failed: {response.status_code} - {response.text}")
            response.raise_for_status()
    
    def normalize_team_name(self, team_name: str) -> str:
        """Normalize team names using mappings"""
        return TEAM_MAPPINGS.get(team_name, team_name)
    
    def get_historical_odds(self, date_from: str, date_to: str) -> List[Dict]:
        """
        Get historical odds for EPL matches within date range
        
        Args:
            date_from: Start date in ISO format (YYYY-MM-DD)
            date_to: End date in ISO format (YYYY-MM-DD)
            
        Returns:
            List of matches with odds data
        """
        endpoint = f"sports/{self.sport_key}/odds-history"
        params = {
            'regions': 'uk,eu',
            'markets': 'h2h',  # Head-to-head (1X2) odds
            'dateFormat': 'iso',
            'date': date_from
        }
        
        try:
            data = self._make_request(endpoint, params)
            return data if isinstance(data, list) else []
        except Exception as e:
            logger.error(f"Failed to fetch odds for {date_from}: {e}")
            return []
    
    def get_odds_for_matches(self, matches: List[Dict]) -> Dict[str, Dict]:
        """
        Get odds data for a list of matches
        
        Args:
            matches: List of match dictionaries with dates
            
        Returns:
            Dictionary mapping match_id to odds data
        """
        odds_data = {}
        
        # Group matches by date to minimize API calls
        dates_to_process = set()
        current_date = datetime.now().date()
        
        for match in matches:
            match_date = datetime.fromisoformat(match['date']).date()
            
            # Check if date is within allowed historical range
            days_ago = (current_date - match_date).days
            if days_ago > ODDS_API_HISTORICAL_LIMIT_DAYS:
                logger.warning(f"Match date {match_date} is {days_ago} days ago, exceeding historical limit of {ODDS_API_HISTORICAL_LIMIT_DAYS} days. Skipping odds fetch.")
                continue
                
            dates_to_process.add(match_date.isoformat())
        
        if not dates_to_process:
            logger.info("No dates within historical limit for odds fetching")
            return odds_data
        
        for date_str in sorted(dates_to_process):
            logger.info(f"Fetching odds for {date_str}")
            
            try:
                odds_response = self.get_historical_odds(date_str, date_str)
                
                for odds_match in odds_response:
                    # Match odds to our matches
                    home_team = self.normalize_team_name(odds_match.get('home_team', ''))
                    away_team = self.normalize_team_name(odds_match.get('away_team', ''))
                    
                    # Find corresponding match
                    for match in matches:
                        if (match['home_team'] == home_team and 
                            match['away_team'] == away_team and 
                            match['date'] == date_str):
                            
                            odds_data[match['match_id']] = self.extract_odds_data(odds_match)
                            break
                            
            except Exception as e:
                logger.error(f"Failed to process odds for {date_str}: {e}")
                continue
        
        return odds_data
    
    def extract_odds_data(self, odds_match: Dict) -> Dict:
        """
        Extract and normalize odds data from API response
        
        Args:
            odds_match: Raw odds match data from API
            
        Returns:
            Normalized odds dictionary
        """
        bookmakers = odds_match.get('bookmakers', [])
        
        if not bookmakers:
            return {'opening': None, 'closing': None}
        
        # For simplicity, use the first bookmaker's odds
        # In production, you might want to average across bookmakers
        bookmaker = bookmakers[0]
        markets = bookmaker.get('markets', [])
        
        if not markets:
            return {'opening': None, 'closing': None}
        
        # Extract h2h (1X2) odds
        h2h_market = None
        for market in markets:
            if market.get('key') == 'h2h':
                h2h_market = market
                break
        
        if not h2h_market or not h2h_market.get('outcomes'):
            return {'opening': None, 'closing': None}
        
        # Extract odds for home win (1), draw (X), away win (2)
        odds = {}
        for outcome in h2h_market['outcomes']:
            if outcome['name'] == odds_match.get('home_team'):
                odds['1'] = outcome['price']
            elif outcome['name'] == odds_match.get('away_team'):
                odds['2'] = outcome['price']
            else:  # Draw
                odds['X'] = outcome['price']
        
        # For historical data, we might not have opening vs closing distinction
        # Use the same odds for both opening and closing
        return {
            'opening': odds if odds else None,
            'closing': odds if odds else None
        }
    
    def enrich_matches_with_odds(self, matches: List[Dict]) -> List[Dict]:
        """
        Enrich match data with odds information
        
        Args:
            matches: List of match dictionaries
            
        Returns:
            List of matches enriched with odds data
        """
        logger.info(f"Enriching {len(matches)} matches with odds data")
        
        odds_data = self.get_odds_for_matches(matches)
        
        enriched_matches = []
        for match in matches:
            enriched_match = match.copy()
            
            if match['match_id'] in odds_data:
                odds = odds_data[match['match_id']]
                enriched_match['odds_opening'] = odds['opening']
                enriched_match['odds_closing'] = odds['closing']
            
            enriched_matches.append(enriched_match)
        
        logger.info(f"Successfully enriched {len([m for m in enriched_matches if m.get('odds_opening')])} matches with odds")
        return enriched_matches