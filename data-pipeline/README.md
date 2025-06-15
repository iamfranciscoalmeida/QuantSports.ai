# EPL Historical Sports Betting Data Pipeline

A robust, extensible backend pipeline that ingests, stores, and serves **Premier League historical odds and results data** to power AI chat, notebook strategies, and backtesting.

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Clone and navigate to data pipeline
cd data-pipeline

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template and configure
cp .env.template .env
# Edit .env with your API keys
```

### 2. Configure API Keys

Get your free API keys:
- **Football Data API**: https://www.football-data.org/client/register
- **Odds API**: https://the-odds-api.com/
- **Supabase**: Your project settings

### 3. Setup Database

```sql
-- Run the migration in your Supabase SQL editor
-- File: supabase/migrations/001_create_matches_table.sql
```

### 4. Run ETL Pipeline

```bash
# Process specific season
python etl_main.py --season 2023 --save-csv

# Process all configured seasons
python etl_main.py --all-seasons

# Update odds only for existing matches
python etl_main.py --update-odds-only
```

## 📊 Data Schema

### Match Data Structure

```json
{
  "match_id": "EPL_2023_05_12_ARS_CHE",
  "date": "2023-05-12",
  "home_team": "Arsenal",
  "away_team": "Chelsea",
  "result": { "home_goals": 2, "away_goals": 1 },
  "odds": {
    "opening": { "1": 2.1, "X": 3.4, "2": 3.6 },
    "closing": { "1": 2.05, "X": 3.3, "2": 3.75 }
  },
  "xg": { "home": 1.6, "away": 1.0 },
  "market": "1X2",
  "league": "Premier League",
  "season": "2022/23"
}
```

### Database Tables

#### `matches` Table
- **id**: Serial primary key
- **match_id**: Unique match identifier
- **date**: Match date
- **home_team**, **away_team**: Team names
- **result_home**, **result_away**: Final scores
- **odds_opening**, **odds_closing**: JSONB odds data
- **xg**: JSONB expected goals data
- **season**: Season identifier (e.g., "2022/23")

#### `teams` Table
- **id**: Serial primary key
- **name**: Official team name
- **aliases**: Array of alternative names
- **league**: League name

## 🔌 API Usage

### TypeScript SDK

```typescript
import { 
  getMatches, 
  getTeamStats, 
  calculateROI, 
  simulateNaiveStrategy 
} from '@/lib/betting-sdk'

// Get Arsenal matches from 2023 season
const matches = await getMatches({
  team: 'Arsenal',
  season: '2022/23',
  limit: 10
})

// Get team statistics
const stats = await getTeamStats('Arsenal', '2022/23')
console.log(`Win rate: ${stats.win_rate}%`)

// Calculate ROI for a betting strategy
const roi = await calculateROI({
  team: 'Arsenal',
  side: 'home',
  stake: 10,
  min_odds: 1.5,
  max_odds: 3.0
})

console.log(`ROI: ${roi.roi_percentage}%`)
```

### Supabase Edge Functions

#### GET /functions/v1/get-matches
```bash
curl "https://your-project.supabase.co/functions/v1/get-matches?team=Arsenal&season=2022/23&limit=5"
```

#### POST /functions/v1/calculate-roi
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/calculate-roi" \
  -H "Content-Type: application/json" \
  -d '{
    "team": "Arsenal",
    "side": "home",
    "stake": 100,
    "min_odds": 1.5
  }'
```

## 🛠️ ETL Pipeline Details

### Data Sources

1. **Football-Data.org**
   - Match fixtures and results
   - Team information
   - Season data

2. **The-Odds-API**
   - Pre-match and closing odds
   - Multiple bookmaker data
   - Historical odds data

3. **Understat** (Optional)
   - Expected Goals (xG)
   - Advanced match statistics

### Pipeline Components

#### 1. Extraction (`data_sources/`)
- `FootballDataAPI`: Fetches match results and fixtures
- `OddsAPI`: Retrieves betting odds data
- Rate limiting and retry logic
- Data normalization

#### 2. Transformation (`database.py`)
- Data validation and cleaning
- Schema normalization
- Duplicate detection
- Error handling

#### 3. Loading (`database.py`)
- Upsert logic for idempotent runs
- Batch processing
- CSV export/import
- Database indexing for performance

### Running Options

```bash
# Basic usage
python etl_main.py                    # Current season with odds
python etl_main.py --season 2023      # Specific season
python etl_main.py --all-seasons      # All configured seasons

# Options
python etl_main.py --save-csv         # Save to CSV files
python etl_main.py --no-odds          # Skip odds data
python etl_main.py --update-odds-only # Only update missing odds

# Logging
# Logs are saved to: etl_pipeline_YYYYMMDD_HHMMSS.log
```

## 📈 Usage Examples

### 1. Basic Match Query
```typescript
// Get recent Arsenal matches
const matches = await getMatches({
  team: 'Arsenal',
  limit: 5
})

matches.forEach(match => {
  console.log(`${match.home_team} ${match.result_home}-${match.result_away} ${match.away_team}`)
})
```

### 2. Team Performance Analysis
```typescript
// Compare team statistics
const arsenalStats = await getTeamStats('Arsenal', '2022/23')
const chelseaStats = await getTeamStats('Chelsea', '2022/23')

console.log('Arsenal vs Chelsea 2022/23:')
console.log(`Arsenal: ${arsenalStats.wins}W ${arsenalStats.draws}D ${arsenalStats.losses}L`)
console.log(`Chelsea: ${chelseaStats.wins}W ${chelseaStats.draws}D ${chelseaStats.losses}L`)
```

### 3. Betting Strategy Backtesting
```typescript
// Test a simple home advantage strategy
const homeStrategy = await calculateROI({
  team: 'Manchester City',
  side: 'home',
  season: '2022/23',
  stake: 10
})

console.log(`Man City Home Strategy:`)
console.log(`ROI: ${homeStrategy.roi_percentage.toFixed(2)}%`)
console.log(`Win Rate: ${homeStrategy.win_rate.toFixed(2)}%`)
console.log(`Net Profit: £${homeStrategy.net_profit.toFixed(2)}`)
```

### 4. Head-to-Head Analysis
```typescript
// Arsenal vs Chelsea historical record
const h2h = await getHeadToHead('Arsenal', 'Chelsea')

console.log(`Arsenal vs Chelsea (last ${h2h.matches.length} games):`)
console.log(`Arsenal wins: ${h2h.team1_wins}`)
console.log(`Chelsea wins: ${h2h.team2_wins}`)
console.log(`Draws: ${h2h.draws}`)
```

## 🔧 Configuration

### `config.py` Settings

```python
# Seasons to process
SEASONS = ['2021', '2022', '2023', '2024']

# Rate limiting
MAX_REQUESTS_PER_MINUTE = 10
BATCH_SIZE = 50

# Team name mappings for normalization
TEAM_MAPPINGS = {
    'Man City': 'Manchester City',
    'Man Utd': 'Manchester United',
    # ... more mappings
}
```

### Environment Variables

```bash
# Required
FOOTBALL_DATA_API_KEY=your_key_here
ODDS_API_KEY=your_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here

# Optional
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

## 🚀 Deployment & Automation

### Scheduled Updates

Create a cron job for daily updates:

```bash
# Add to crontab (crontab -e)
0 6 * * * cd /path/to/data-pipeline && python etl_main.py --update-odds-only
0 2 * * 1 cd /path/to/data-pipeline && python etl_main.py --season $(date +%Y)
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Run ETL pipeline
CMD ["python", "etl_main.py", "--all-seasons"]
```

## 🔍 Monitoring & Maintenance

### Health Checks

- Check database connection
- Verify API key validity
- Monitor rate limits
- Track data freshness

### Performance Optimization

- Database indexes on frequently queried columns
- Connection pooling for concurrent requests
- Caching for repeated calculations
- Batch processing for large datasets

## 🤖 AI Integration

### Available Functions for LLM

The SDK provides these functions for AI chat integration:

- `getMatches()` - Query historical matches
- `getTeamStats()` - Get team performance data
- `calculateROI()` - Backtest betting strategies
- `simulateNaiveStrategy()` - Quick strategy simulation
- `getHeadToHead()` - Team comparison data

### Example AI Prompt

> "What was Arsenal's home win rate in the 2022/23 season, and how profitable would a £10 home win strategy have been?"

The AI can use the SDK to answer this by calling:
1. `getTeamStats('Arsenal', '2022/23')`
2. `calculateROI({ team: 'Arsenal', side: 'home', stake: 10, season: '2022/23' })`

## 📋 Troubleshooting

### Common Issues

1. **API Rate Limits**
   - Reduce `MAX_REQUESTS_PER_MINUTE`
   - Add delays between requests
   - Use premium API tiers

2. **Database Connection**
   - Check Supabase credentials
   - Verify network connectivity
   - Review RLS policies

3. **Data Quality**
   - Check team name mappings
   - Validate date formats
   - Review odds data structure

### Logs and Debugging

- ETL logs: `etl_pipeline_YYYYMMDD_HHMMSS.log`
- Set log level: `logging.getLogger().setLevel(logging.DEBUG)`
- Validate data: Use `validate_match_data()` function

## 🔮 Future Enhancements

- **Multi-Sport Support**: NBA, NFL, UFC data
- **Real-time Data**: Live match updates
- **Advanced Analytics**: xG modeling, player stats
- **Machine Learning**: Predictive models
- **Market Expansion**: Asian handicap, over/under markets

## 📝 License

MIT License - Feel free to use for commercial or personal projects.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

---

**Need Help?** Open an issue or check the [documentation](./docs/) for more detailed guides.