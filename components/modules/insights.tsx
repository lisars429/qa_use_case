'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, AlertTriangle, CheckCircle, Zap, Eye, Target } from 'lucide-react'

export function InsightsModule() {
  // Chart data
  const trendData = [
    { date: 'Mon', passRate: 94, coverage: 78 },
    { date: 'Tue', passRate: 96, coverage: 81 },
    { date: 'Wed', passRate: 92, coverage: 79 },
    { date: 'Thu', passRate: 97, coverage: 85 },
    { date: 'Fri', passRate: 95, coverage: 87 },
    { date: 'Sat', passRate: 98, coverage: 89 },
    { date: 'Sun', passRate: 96, coverage: 91 },
  ]

  const automationData = [
    { name: 'Automated', value: 287, fill: '#10b981' },
    { name: 'Manual', value: 63, fill: '#f59e0b' },
    { name: 'In Progress', value: 45, fill: '#6366f1' },
  ]

  const frameworkUsage = [
    { name: 'Playwright', value: 145, percentage: 42 },
    { name: 'Cypress', value: 98, percentage: 28 },
    { name: 'Selenium', value: 75, percentage: 22 },
    { name: 'Puppeteer', value: 32, percentage: 8 },
  ]

  const qualityMetrics = [
    { metric: 'Test Coverage', value: 91, target: 85, status: 'good' },
    { metric: 'Pass Rate', value: 96, target: 95, status: 'good' },
    { metric: 'Automation Coverage', value: 82, target: 85, status: 'warning' },
    { metric: 'Script Flakiness', value: 3, target: 5, status: 'good' },
  ]

  const topFailingTests = [
    { name: 'Payment Processing - Large Orders', failures: 12, lastFailed: '2 hours ago' },
    { name: 'Export PDF - Complex Layout', failures: 8, lastFailed: '1 day ago' },
    { name: 'Real-time Notifications', failures: 5, lastFailed: '3 days ago' },
  ]

  const getStatusColor = (status: string) => {
    return status === 'good' ? 'text-green-500' : 'text-yellow-500'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Quality Insights</h2>
        <p className="text-muted-foreground">AI-powered analytics and recommendations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Test Coverage</p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">91%</p>
          <p className="text-xs text-green-500 mt-2">↑ 3% from last week</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pass Rate</p>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">96%</p>
          <p className="text-xs text-green-500 mt-2">↑ 1% from last week</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Test Runtime</p>
            <Target className="w-4 h-4 text-accent" />
          </div>
          <p className="text-3xl font-bold text-foreground">2.4s</p>
          <p className="text-xs text-muted-foreground mt-2">380 total tests</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Defect Detection</p>
            <Eye className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">24</p>
          <p className="text-xs text-orange-500 mt-2">bugs caught this week</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">7-Day Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis stroke="rgba(255,255,255,0.4)" dataKey="date" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20,20,30,0.8)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="coverage" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-muted-foreground">Pass Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full" />
              <span className="text-muted-foreground">Coverage</span>
            </div>
          </div>
        </Card>

        {/* Automation Distribution */}
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Automation Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={automationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {automationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quality Metrics & Framework Usage */}
      <div className="grid grid-cols-2 gap-6">
        {/* Quality Metrics */}
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            Quality Metrics
          </h3>
          <div className="space-y-3">
            {qualityMetrics.map((metric) => (
              <div key={metric.metric} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{metric.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getStatusColor(metric.status)}`}>
                      {metric.value}%
                    </span>
                    <span className="text-xs text-muted-foreground">target: {metric.target}%</span>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      metric.status === 'good' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Framework Usage */}
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            Framework Usage
          </h3>
          <div className="space-y-3">
            {frameworkUsage.map((framework) => (
              <div key={framework.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{framework.name}</span>
                  <span className="text-sm font-semibold text-accent">{framework.value}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-primary to-accent rounded-full"
                    style={{ width: `${framework.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{framework.percentage}% of total</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Failing Tests & Recommendations */}
      <div className="grid grid-cols-2 gap-6">
        {/* Failing Tests */}
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Top Failing Tests
          </h3>
          <div className="space-y-3">
            {topFailingTests.map((test, idx) => (
              <div key={idx} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-1">{test.name}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                    {test.failures} failures
                  </Badge>
                  <span className="text-xs text-muted-foreground">{test.lastFailed}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Recommendations */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-black/20 rounded-lg border border-primary/10">
              <p className="text-sm text-accent font-medium mb-1">Optimize Parallel Execution</p>
              <p className="text-xs text-muted-foreground">
                Run 150+ independent tests in parallel to reduce total runtime by 65%
              </p>
            </div>
            <div className="p-3 bg-black/20 rounded-lg border border-primary/10">
              <p className="text-sm text-accent font-medium mb-1">Address Flaky Tests</p>
              <p className="text-xs text-muted-foreground">
                3 tests show intermittent failures. Review for race conditions or timing issues.
              </p>
            </div>
            <div className="p-3 bg-black/20 rounded-lg border border-primary/10">
              <p className="text-sm text-accent font-medium mb-1">Expand Test Coverage</p>
              <p className="text-xs text-muted-foreground">
                Payment module coverage at 82%. Target critical edge cases for comprehensive coverage.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
