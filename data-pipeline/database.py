import json
import logging
from typing import List, Dict, Optional
from supabase import create_client, Client
import pandas as pd

from .config import SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger(__name__)

class MatchDatabase:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
    def insert_matches(self, matches: List[Dict]) -> Dict:
        """
        Insert matches into the database with upsert logic
        
        Args:
            matches: List of normalized match dictionaries
            
        Returns:
            Dictionary with insertion results
        """
        if not matches:
            return {"inserted": 0, "updated": 0, "errors": 0}
        
        inserted_count = 0
        updated_count = 0
        error_count = 0
        
        logger.info(f"Inserting {len(matches)} matches into database")
        
        for match in matches:
            try:
                # Check if match already exists
                existing = self.supabase.table("matches").select("id").eq("match_id", match["match_id"]).execute()
                
                if existing.data:
                    # Update existing match
                    result = self.supabase.table("matches").update(match).eq("match_id", match["match_id"]).execute()
                    updated_count += 1
                    logger.debug(f"Updated match {match['match_id']}")
                else:
                    # Insert new match
                    result = self.supabase.table("matches").insert(match).execute()
                    inserted_count += 1
                    logger.debug(f"Inserted match {match['match_id']}")
                    
            except Exception as e:
                error_count += 1
                logger.error(f"Failed to insert/update match {match.get('match_id', 'unknown')}: {e}")
                continue
        
        logger.info(f"Database operation completed: {inserted_count} inserted, {updated_count} updated, {error_count} errors")
        return {
            "inserted": inserted_count,
            "updated": updated_count,
            "errors": error_count
        }
    
    def get_existing_matches(self, season: str = None, team: str = None) -> List[Dict]:
        """
        Get existing matches from database
        
        Args:
            season: Filter by season (optional)
            team: Filter by team (optional)
            
        Returns:
            List of existing match dictionaries
        """
        query = self.supabase.table("matches").select("*")
        
        if season:
            query = query.eq("season", season)
            
        if team:
            query = query.or_(f"home_team.eq.{team},away_team.eq.{team}")
        
        try:
            result = query.execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to fetch existing matches: {e}")
            return []
    
    def get_matches_without_odds(self) -> List[Dict]:
        """
        Get matches that don't have odds data yet
        
        Returns:
            List of matches without odds
        """
        try:
            result = self.supabase.table("matches").select("*").is_("odds_opening", "null").execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to fetch matches without odds: {e}")
            return []
    
    def save_to_csv(self, matches: List[Dict], filename: str) -> bool:
        """
        Save matches data to CSV file as backup
        
        Args:
            matches: List of match dictionaries
            filename: Output CSV filename
            
        Returns:
            Success status
        """
        try:
            df = pd.DataFrame(matches)
            
            # Convert JSONB fields to strings for CSV
            json_columns = ['odds_opening', 'odds_closing', 'xg']
            for col in json_columns:
                if col in df.columns:
                    df[col] = df[col].apply(lambda x: json.dumps(x) if x is not None else None)
            
            df.to_csv(filename, index=False)
            logger.info(f"Saved {len(matches)} matches to {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save CSV: {e}")
            return False
    
    def load_from_csv(self, filename: str) -> List[Dict]:
        """
        Load matches data from CSV file
        
        Args:
            filename: Input CSV filename
            
        Returns:
            List of match dictionaries
        """
        try:
            df = pd.read_csv(filename)
            
            # Convert string JSON back to objects
            json_columns = ['odds_opening', 'odds_closing', 'xg']
            for col in json_columns:
                if col in df.columns:
                    df[col] = df[col].apply(lambda x: json.loads(x) if pd.notna(x) and x != 'None' else None)
            
            matches = df.to_dict('records')
            logger.info(f"Loaded {len(matches)} matches from {filename}")
            return matches
            
        except Exception as e:
            logger.error(f"Failed to load CSV: {e}")
            return []
    
    def get_team_statistics(self, team: str, season: str = None) -> Dict:
        """
        Get basic statistics for a team
        
        Args:
            team: Team name
            season: Season filter (optional)
            
        Returns:
            Dictionary with team statistics
        """
        query = self.supabase.table("matches").select("*").or_(f"home_team.eq.{team},away_team.eq.{team}")
        
        if season:
            query = query.eq("season", season)
        
        try:
            result = query.execute()
            matches = result.data
            
            if not matches:
                return {}
            
            stats = {
                "total_matches": len(matches),
                "home_matches": len([m for m in matches if m["home_team"] == team]),
                "away_matches": len([m for m in matches if m["away_team"] == team]),
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "goals_for": 0,
                "goals_against": 0
            }
            
            for match in matches:
                if match["result_home"] is None or match["result_away"] is None:
                    continue
                    
                is_home = match["home_team"] == team
                team_goals = match["result_home"] if is_home else match["result_away"]
                opponent_goals = match["result_away"] if is_home else match["result_home"]
                
                stats["goals_for"] += team_goals
                stats["goals_against"] += opponent_goals
                
                if team_goals > opponent_goals:
                    stats["wins"] += 1
                elif team_goals == opponent_goals:
                    stats["draws"] += 1
                else:
                    stats["losses"] += 1
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get team statistics: {e}")
            return {}
    
    def validate_match_data(self, match: Dict) -> List[str]:
        """
        Validate match data before insertion
        
        Args:
            match: Match dictionary
            
        Returns:
            List of validation errors
        """
        errors = []
        
        required_fields = ["match_id", "date", "home_team", "away_team", "season"]
        for field in required_fields:
            if field not in match or match[field] is None:
                errors.append(f"Missing required field: {field}")
        
        # Validate date format
        try:
            from datetime import datetime
            datetime.fromisoformat(match["date"])
        except (ValueError, KeyError):
            errors.append("Invalid date format")
        
        # Validate scores if present
        if match.get("result_home") is not None:
            if not isinstance(match["result_home"], int) or match["result_home"] < 0:
                errors.append("Invalid home result")
                
        if match.get("result_away") is not None:
            if not isinstance(match["result_away"], int) or match["result_away"] < 0:
                errors.append("Invalid away result")
        
        return errors