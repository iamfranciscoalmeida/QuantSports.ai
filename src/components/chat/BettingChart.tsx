import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface BettingChartProps {
  data: any;
}

export function BettingChart({ data }: BettingChartProps) {
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          }
        },
        grid: {
          color: '#334155'
        }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11
          }
        },
        grid: {
          color: '#334155'
        }
      }
    },
    backgroundColor: '#1e293b',
    borderColor: '#3b82f6',
    maintainAspectRatio: false,
  };

  const renderPnLCurve = () => {
    if (!data.pnl_curve || !Array.isArray(data.pnl_curve)) return null;

    const chartData = {
      labels: data.pnl_curve.map((point: any) => point.date),
      datasets: [
        {
          label: 'Cumulative P&L',
          data: data.pnl_curve.map((point: any) => point.cumulative_pnl),
          borderColor: data.pnl_curve[data.pnl_curve.length - 1]?.cumulative_pnl >= 0 ? '#10b981' : '#ef4444',
          backgroundColor: data.pnl_curve[data.pnl_curve.length - 1]?.cumulative_pnl >= 0 ? '#10b98120' : '#ef444420',
          tension: 0.3,
          fill: true
        }
      ],
    };

    return (
      <Card className="bg-quant-bg-secondary border-quant-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-quant-text">Strategy P&L Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '300px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderBetDistribution = () => {
    if (!data.bet_distribution) return null;

    const chartData = {
      labels: ['Wins', 'Losses'],
      datasets: [
        {
          data: [data.bet_distribution.wins, data.bet_distribution.losses],
          backgroundColor: ['#10b981', '#ef4444'],
          borderColor: ['#059669', '#dc2626'],
          borderWidth: 1,
        },
      ],
    };

    return (
      <Card className="bg-quant-bg-secondary border-quant-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-quant-text">Win/Loss Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '250px' }}>
            <Pie data={chartData} options={{ ...chartOptions, scales: undefined }} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceComparison = () => {
    if (!data.performance_comparison) return null;

    const chartData = {
      labels: ['Wins', 'Draws', 'Losses'],
      datasets: [
        {
          label: 'Home',
          data: [
            data.performance_comparison.home_wins,
            data.performance_comparison.home_draws,
            data.performance_comparison.home_losses
          ],
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1,
        },
        {
          label: 'Away',
          data: [
            data.performance_comparison.away_wins,
            data.performance_comparison.away_draws,
            data.performance_comparison.away_losses
          ],
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1,
        },
      ],
    };

    return (
      <Card className="bg-quant-bg-secondary border-quant-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-quant-text">Home vs Away Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '300px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderROIComparison = () => {
    if (!data.roi_comparison) return null;

    const chartData = {
      labels: ['Favorite', 'Underdog', 'Home', 'Away'],
      datasets: [
        {
          label: 'ROI %',
          data: [
            data.roi_comparison.favorite,
            data.roi_comparison.underdog,
            data.roi_comparison.home,
            data.roi_comparison.away
          ],
          backgroundColor: data.roi_comparison.favorite >= 0 ? '#10b981' : '#ef4444',
          borderColor: data.roi_comparison.favorite >= 0 ? '#059669' : '#dc2626',
          borderWidth: 1,
        },
      ],
    };

    return (
      <Card className="bg-quant-bg-secondary border-quant-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-quant-text">ROI Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '300px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMarketPerformance = () => {
    if (!data.market_performance) return null;

    const chartData = {
      labels: ['Hit Rate', 'Miss Rate'],
      datasets: [
        {
          data: [data.market_performance.hit_rate, data.market_performance.miss_rate],
          backgroundColor: ['#10b981', '#ef4444'],
          borderColor: ['#059669', '#dc2626'],
          borderWidth: 1,
        },
      ],
    };

    return (
      <Card className="bg-quant-bg-secondary border-quant-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-quant-text">Market Hit Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '250px' }}>
            <Pie data={chartData} options={{ ...chartOptions, scales: undefined }} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResultsDistribution = () => {
    if (!data.results_distribution) return null;

    const chartData = {
      labels: ['Home Wins', 'Draws', 'Away Wins'],
      datasets: [
        {
          label: 'Matches',
          data: [
            data.results_distribution.home_wins,
            data.results_distribution.draws,
            data.results_distribution.away_wins
          ],
          backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
          borderColor: ['#2563eb', '#d97706', '#059669'],
          borderWidth: 1,
        },
      ],
    };

    return (
      <Card className="bg-quant-bg-secondary border-quant-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-quant-text">Match Results Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '300px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGoalsDistribution = () => {
    if (!data.goals_distribution) return null;

    const chartData = {
      labels: ['Over 2.5', 'Under 2.5'],
      datasets: [
        {
          data: [data.goals_distribution.over_2_5, data.goals_distribution.under_2_5],
          backgroundColor: ['#8b5cf6', '#06b6d4'],
          borderColor: ['#7c3aed', '#0891b2'],
          borderWidth: 1,
        },
      ],
    };

    return (
      <Card className="bg-quant-bg-secondary border-quant-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-quant-text">Goals Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '250px' }}>
            <Pie data={chartData} options={{ ...chartOptions, scales: undefined }} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTopTeams = () => {
    if (!data.top_teams) return null;

    const chartData = {
      labels: data.top_teams.map((team: any) => team.team),
      datasets: [
        {
          label: 'Value',
          data: data.top_teams.map((team: any) => team.value),
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1,
        },
      ],
    };

    return (
      <Card className="bg-quant-bg-secondary border-quant-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-quant-text">Top Performing Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '300px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {renderPnLCurve()}
      {renderBetDistribution()}
      {renderPerformanceComparison()}
      {renderROIComparison()}
      {renderMarketPerformance()}
      {renderResultsDistribution()}
      {renderGoalsDistribution()}
      {renderTopTeams()}
    </div>
  );
} 