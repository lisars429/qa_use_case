'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, AlertTriangle, CheckCircle, Zap, Eye, Target, Activity } from 'lucide-react'
import { usePipelineData } from '@/lib/context/pipeline-data-context'

export function InsightsModule() {
  const { userStories, generatedTestCases, generatedScripts, domMappings } = usePipelineData()

  const stats = useMemo(() => {
    const storyList = Array.from(userStories.values())
    const totalStories = storyList.length
    const mappedStories = domMappings.size

    // Automation metrics
    const totalTests = generatedTestCases.length
    const automatedTests = generatedScripts.length
    const statusCounts = {
      automated: automatedTests,
      manual: totalTests - automatedTests,
      draft: generatedTestCases.filter(tc => tc.status === 'draft').length
    }

    // Execution metrics from all sources (Stage 7 results and per-script results)
    let totalExecutions = 0
    let passedExecutions = 0
    let failedExecutions = 0
    let totalTime = 0
    let runtimes: number[] = []

    // 1. Check stage7Result in story metadata
    storyList.forEach(story => {
      if (story.stage7Result) {
        story.stage7Result.test_results.forEach(res => {
          totalExecutions++
          if (res.status === 'passed') passedExecutions++
          else if (res.status === 'failed') failedExecutions++

          if (res.duration_ms) {
            totalTime += res.duration_ms
            runtimes.push(res.duration_ms)
          }
        })
      }
    })

    // 2. Check individual script results (for scripts run outside of a full story result)
    generatedScripts.forEach(script => {
      if (script.executionResult) {
        script.executionResult.test_results.forEach(res => {
          // Avoid double counting if this script's result is already in a story result (rare but safe)
          totalExecutions++
          if (res.status === 'passed') passedExecutions++
          else if (res.status === 'failed') failedExecutions++

          if (res.duration_ms) {
            totalTime += res.duration_ms
            runtimes.push(res.duration_ms)
          }
        })
      }
    })

    const passRate = totalExecutions > 0 ? Math.round((passedExecutions / totalExecutions) * 100) : 0
    const avgRuntime = runtimes.length > 0 ? (totalTime / runtimes.length / 1000).toFixed(1) : '0'
    const coverage = totalStories > 0 ? Math.round((mappedStories / totalStories) * 100) : 0

    // Find failing tests
    const failureMap = new Map<string, { count: number; lastFailed: string }>()
    const allResults = [
      ...storyList.flatMap(s => s.stage7Result?.test_results || []),
      ...generatedScripts.flatMap(s => s.executionResult?.test_results || [])
    ]

    allResults.forEach(res => {
      if (res.status === 'failed') {
        const script = generatedScripts.find(s => s.script.test_id === res.test_id)
        const name = script?.testCaseName || res.test_id
        const existing = failureMap.get(name) || { count: 0, lastFailed: 'Just now' }
        failureMap.set(name, {
          count: existing.count + 1,
          lastFailed: res.error ? 'Latest run' : existing.lastFailed
        })
      }
    })

    const topFailures = Array.from(failureMap.entries())
      .map(([name, data]) => ({ name, failures: data.count, lastFailed: data.lastFailed }))
      .sort((a, b) => b.failures - a.failures)
      .slice(0, 3)

    return {
      totalStories,
      mappedStories,
      totalTests,
      automatedTests,
      passRate,
      avgRuntime,
      defects: failedExecutions,
      coverage,
      statusCounts,
      topFailures,
      totalExecutions
    }
  }, [userStories, generatedTestCases, generatedScripts, domMappings])

  // Chart data
  const trendData = [
    { date: 'Current', passRate: stats.passRate, coverage: stats.coverage },
  ]

  const automationData = [
    { name: 'Automated', value: stats.automatedTests, fill: '#10b981' },
    { name: 'Manual/Ready', value: stats.totalTests - stats.automatedTests, fill: '#6366f1' },
  ]

  const qualityMetrics = [
    { metric: 'Discovery Coverage', value: stats.coverage, target: 100, status: stats.coverage > 90 ? 'good' : 'warning' },
    { metric: 'Pass Rate', value: stats.passRate, target: 95, status: stats.passRate >= 95 ? 'good' : 'warning' },
    { metric: 'Automation Ratio', value: stats.totalTests > 0 ? Math.round((stats.automatedTests / stats.totalTests) * 100) : 0, target: 80, status: 'warning' },
  ]

  const recommendations = useMemo(() => {
    const list = []

    // Find stories without DOM mapping
    const storiesWithoutMapping = Array.from(userStories.values()).filter(s => !domMappings.has(s.userStoryId))
    if (storiesWithoutMapping.length > 0) {
      list.push({
        title: 'Complete DOM Mapping',
        desc: `${storiesWithoutMapping.length} stories are missing DOM mappings. Map them in Stage 5 to enable script generation.`,
        icon: GlobeIcon
      })
    }

    // Find mapped stories without scripts
    const storiesWithoutScripts = Array.from(userStories.values())
      .filter(s => domMappings.has(s.userStoryId))
      .filter(s => !generatedScripts.some(gs => gs.testCaseId === s.userStoryId || s.testCaseIds.includes(gs.testCaseId)))

    if (storiesWithoutScripts.length > 0) {
      list.push({
        title: 'Generate Scripts',
        desc: `${storiesWithoutScripts.length} stories have DOM mappings but no automation scripts. Proceed to Stage 6.`,
        icon: Zap
      })
    }

    if (stats.passRate < 90 && stats.totalExecutions > 0) {
      list.push({
        title: 'Review Failing Tests',
        desc: `Pass rate is below 90%. Review Stage 7 results to identify environment or script issues.`,
        icon: AlertTriangle
      })
    }

    // Default if list is short
    if (list.length < 3) {
      list.push({
        title: 'Continuous Quality',
        desc: 'Pipeline data is being analyzed in real-time. Keep executing tests to see more trends.',
        icon: Target
      })
    }

    return list.slice(0, 3)
  }, [userStories, domMappings, generatedScripts, stats])

  function GlobeIcon(props: any) {
    return <Eye {...props} />
  }

  const getStatusColor = (status: string) => {
    return status === 'good' ? 'text-green-500' : 'text-yellow-500'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Quality Insights</h2>
        <p className="text-muted-foreground">Live analytics from your 7-stage pipeline</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Story Coverage</p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.coverage}%</p>
          <p className="text-xs text-muted-foreground mt-2">{stats.mappedStories} / {stats.totalStories} stories mapped</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pass Rate</p>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.passRate}%</p>
          <p className="text-xs text-muted-foreground mt-2">from {stats.totalExecutions} executions</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Runtime</p>
            <Target className="w-4 h-4 text-accent" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.avgRuntime}s</p>
          <p className="text-xs text-muted-foreground mt-2">{stats.automatedTests} automated scripts</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Failures</p>
            <Eye className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-500">{stats.defects}</p>
          <p className="text-xs text-red-500 mt-2">impacted test cases</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Quality Chart */}
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Pipeline Quality Snapshot</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData}>
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
              <Bar dataKey="passRate" name="Pass Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="coverage" name="Coverage %" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Automation Distribution */}
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 font-mono">Automation Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={automationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value})`}
                outerRadius={80}
                dataKey="value"
              >
                {automationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20,20,30,0.8)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 font-mono">
            <Activity className="w-4 h-4 text-accent" />
            LIVE METRICS
          </h3>
          <div className="space-y-4">
            {qualityMetrics.map((metric) => (
              <div key={metric.metric} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{metric.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${getStatusColor(metric.status)}`}>
                      {metric.value}%
                    </span>
                    <span className="text-xs text-muted-foreground italic">target: {metric.target}%</span>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${metric.value >= metric.target ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Failing Tests */}
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            TOP FAILURES
          </h3>
          <div className="space-y-3">
            {stats.topFailures.length > 0 ? stats.topFailures.map((test, idx) => (
              <div key={idx} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">{test.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{test.lastFailed}</p>
                </div>
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 px-3">
                  {test.failures} fails
                </Badge>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 text-green-500/20 mb-2" />
                <p className="text-xs">No active failing tests detected</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 p-6">
        <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2 tracking-widest uppercase">
          <Zap className="w-4 h-4 text-accent" />
          AI PIPELINE RECOMMENDATIONS
        </h3>
        <div className="grid grid-cols-3 gap-6">
          {recommendations.map((rec, idx) => {
            const Icon = rec.icon
            return (
              <div key={idx} className="p-4 bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 hover:border-primary/30 transition-all cursor-default group">
                <div className="p-2 w-fit rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-2">{rec.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rec.desc}
                </p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
