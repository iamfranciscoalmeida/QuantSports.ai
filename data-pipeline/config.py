import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
FOOTBALL_DATA_API_KEY = os.getenv('FOOTBALL_DATA_API_KEY')
ODDS_API_KEY = os.getenv('ODDS_API_KEY')
VITE_SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
VITE_SUPABASE_ANON_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

# Database Configuration - Use service role for ETL operations
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# API URLs
FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'
ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4'

# EPL Configuration
EPL_COMPETITION_ID = 'PL'  # Premier League ID for football-data.org
EPL_SPORT_KEY = 'soccer_epl'  # Sport key for odds-api.com

# Rate limiting
MAX_REQUESTS_PER_MINUTE = 10
BATCH_SIZE = 50

# Data validation
REQUIRED_FIELDS = ['match_id', 'date', 'home_team', 'away_team', 'season']
OPTIONAL_FIELDS = ['result_home', 'result_away', 'odds_opening', 'odds_closing', 'xg']

# Seasons to process (can be expanded)
SEASONS = [
    # '2021',  # Commented out - requires premium subscription
    # '2022',  # Commented out - requires premium subscription  
    '2023',
    '2024'
]

# API Subscription limitations
FOOTBALL_DATA_FREE_TIER_START_SEASON = '2023'  # Free tier only allows recent seasons
ODDS_API_HISTORICAL_LIMIT_DAYS = 3  # Very restrictive free tier - only recent dates work

# Team name mappings for normalization
TEAM_MAPPINGS = {
    'Man City': 'Manchester City',
    'Man Utd': 'Manchester United',
    'Spurs': 'Tottenham',
    'Brighton': 'Brighton & Hove Albion',
    'West Ham': 'West Ham United',
    'Newcastle': 'Newcastle United',
    'Wolves': 'Wolverhampton Wanderers',
    'Leicester': 'Leicester City',
    'Crystal Palace': 'Crystal Palace',
    'Nottingham Forest': "Nottingham Forest",
    'Leeds': 'Leeds United',
    'Everton': 'Everton',
    'Brentford': 'Brentford',
    'Fulham': 'Fulham',
    'Bournemouth': 'AFC Bournemouth',
    'Sheffield United': 'Sheffield United',
    'Burnley': 'Burnley',
    'Luton': 'Luton Town'
}