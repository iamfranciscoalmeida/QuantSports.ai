import requests
import time
from datetime import datetime, date
from typing import List, Dict, Optional
from retry import retry
import logging

from config import (
    FOOTBALL_DATA_API_KEY, 
    FOOTBALL_DATA_BASE_URL, 
    EPL_COMPETITION_ID,
    MAX_REQUESTS_PER_MINUTE,
    TEAM_MAPPINGS,
    FOOTBALL_DATA_FREE_TIER_START_SEASON
)

logger = logging.getLogger(__name__)

class FootballDataAPI:
    def __init__(self):
        self.base_url = FOOTBALL_DATA_BASE_URL
        self.api_key = FOOTBALL_DATA_API_KEY
        self.headers = {
            'X-Auth-Token': self.api_key,
            'Content-Type': 'application/json'
        }
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
        
        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        
        self.request_count += 1
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            logger.warning("Rate limit exceeded. Retrying...")
            time.sleep(60)
            raise Exception("Rate limit exceeded")
        else:
            logger.error(f"API request failed: {response.status_code} - {response.text}")
            response.raise_for_status()
    
    def get_competition_matches(self, season: str, status: str = "FINISHED") -> List[Dict]:
        """
        Get all matches for a specific season
        
        Args:
            season: Season year (e.g., '2023')
            status: Match status (FINISHED, SCHEDULED, etc.)
        
        Returns:
            List of match dictionaries
        """
        endpoint = f"competitions/{EPL_COMPETITION_ID}/matches"
        params = {
            'season': season,
            'status': status
        }
        
        try:
            data = self._make_request(endpoint, params)
            return data.get('matches', [])
        except Exception as e:
            logger.error(f"Failed to fetch matches for season {season}: {e}")
            return []
    
    def normalize_team_name(self, team_name: str) -> str:
        """Normalize team names using mappings"""
        return TEAM_MAPPINGS.get(team_name, team_name)
    
    def normalize_match_data(self, match: Dict) -> Dict:
        """
        Normalize match data from football-data.org format to our schema
        
        Args:
            match: Raw match data from API
            
        Returns:
            Normalized match dictionary
        """
        match_date = datetime.fromisoformat(match['utcDate'].replace('Z', '+00:00')).date()
        
        # Extract team names
        home_team = self.normalize_team_name(match['homeTeam']['name'])
        away_team = self.normalize_team_name(match['awayTeam']['name'])
        
        # Generate match ID
        match_id = f"EPL_{match_date.strftime('%Y_%m_%d')}_{home_team.replace(' ', '_')}_{away_team.replace(' ', '_')}"
        
        # Extract season
        season = match['season']['startDate'][:4] + "/" + str(int(match['season']['startDate'][:4]) + 1)[2:]
        
        # Extract scores
        score = match.get('score', {})
        full_time = score.get('fullTime', {})
        
        normalized_match = {
            'match_id': match_id,
            'date': match_date.isoformat(),
            'home_team': home_team,
            'away_team': away_team,
            'result_home': full_time.get('home'),
            'result_away': full_time.get('away'),
            'league': 'Premier League',
            'season': season,
            'market': '1X2',
            'odds_opening': None,  # Will be populated from odds API
            'odds_closing': None,  # Will be populated from odds API
            'xg': None  # Will be populated from other sources
        }
        
        return normalized_match
    
    def get_season_matches(self, season: str) -> List[Dict]:
        """
        Get all finished matches for a season and normalize them
        
        Args:
            season: Season year (e.g., '2023')
            
        Returns:
            List of normalized match dictionaries
        """
        # Check subscription limitations
        if int(season) < int(FOOTBALL_DATA_FREE_TIER_START_SEASON):
            logger.warning(f"Season {season} may require premium subscription. Skipping to avoid 403 errors.")
            logger.info(f"To access historical data for season {season}, upgrade your Football Data API subscription.")
            return []
        
        logger.info(f"Fetching EPL matches for season {season}")
        
        raw_matches = self.get_competition_matches(season, "FINISHED")
        normalized_matches = []
        
        for match in raw_matches:
            try:
                normalized_match = self.normalize_match_data(match)
                normalized_matches.append(normalized_match)
            except Exception as e:
                logger.error(f"Failed to normalize match {match.get('id')}: {e}")
                continue
        
        logger.info(f"Successfully normalized {len(normalized_matches)} matches for season {season}")
        return normalized_matches