"""
EPL Historical Sports Betting Data Pipeline

A robust, extensible backend pipeline that ingests, stores, and serves 
Premier League historical odds and results data.
"""

__version__ = "1.0.0"
__author__ = "Betting Data Pipeline Team"

from .etl_main import EPLDataPipeline
from .database import MatchDatabase
from .data_sources import FootballDataAPI, OddsAPI

__all__ = [
    'EPLDataPipeline',
    'MatchDatabase', 
    'FootballDataAPI',
    'OddsAPI'
]