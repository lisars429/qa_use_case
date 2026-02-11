'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react'

interface ImportConfig {
  jiraUrl: string
  email: string
  apiToken: string
  projectKey: string
  jql?: string
}

interface ImportedStory {
  key: string
  summary: string
  description: string
  status: string
}

export function JiraImportDialog({ onClose, onImport }: { onClose: () => void; onImport: (stories: any[]) => void }) {
  const [step, setStep] = useState<'config' | 'preview' | 'complete'>('config')
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<ImportConfig>({
    jiraUrl: '',
    email: '',
    apiToken: '',
    projectKey: '',
    jql: 'issuetype = Story AND status != Done',
  })
  const [importedStories, setImportedStories] = useState<ImportedStory[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (!config.jiraUrl || !config.email || !config.apiToken || !config.projectKey) {
        throw new Error('Please fill in all required fields')
      }

      // Normalize URL
      const baseUrl = config.jiraUrl.replace(/\/$/, '')

      // Mock Jira API call - in production, this would be a backend API
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock response data
      const mockStories: ImportedStory[] = [
        {
          key: 'PROJ-1',
          summary: 'Implement user authentication',
          description: 'Add OAuth2 and JWT token support',
          status: 'To Do',
        },
        {
          key: 'PROJ-2',
          summary: 'Payment gateway integration',
          description: 'Integrate Stripe for payment processing',
          status: 'In Progress',
        },
        {
          key: 'PROJ-3',
          summary: 'Real-time notification system',
          description: 'Implement WebSocket-based notifications',
          status: 'To Do',
        },
        {
          key: 'PROJ-4',
          summary: 'Analytics dashboard',
          description: 'Create data visualization and reporting',
          status: 'To Do',
        },
      ]

      console.log('[v0] Importing stories from Jira:', mockStories)
      setImportedStories(mockStories)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Jira')
      console.log('[v0] Import error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      // Convert Jira stories to internal format
      const convertedStories = importedStories.map((story) => ({
        id: story.key,
        title: story.summary,
        description: story.description,
        completeness: 0,
        status: 'locked' as const,
        dependencies: 0,
        testCases: 0,
        testScripts: 0,
      }))

      onImport(convertedStories)
      setStep('complete')

      // Auto close after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import stories')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-card border-border shadow-lg">
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">Import from Jira</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 'config' && 'Connect to your Jira instance'}
                {step === 'preview' && 'Review stories to import'}
                {step === 'complete' && 'Import complete'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {step === 'config' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Jira Instance URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://your-domain.atlassian.net"
                    value={config.jiraUrl}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, jiraUrl: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="your-email@example.com"
                      value={config.email}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      API Token
                    </label>
                    <input
                      type="password"
                      placeholder="Your Jira API token"
                      value={config.apiToken}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, apiToken: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Project Key
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., PROJ"
                    value={config.projectKey}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, projectKey: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    JQL Query (Optional)
                  </label>
                  <textarea
                    placeholder="issuetype = Story AND status != Done"
                    value={config.jql}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, jql: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-20 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use Jira Query Language to filter stories
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Download className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    Found <strong>{importedStories.length}</strong> stories ready to import
                  </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {importedStories.map((story) => (
                    <div
                      key={story.key}
                      className="p-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">{story.key}</p>
                          <p className="text-sm font-medium text-foreground truncate">
                            {story.summary}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {story.description}
                          </p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-foreground flex-shrink-0">
                          {story.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 'complete' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Import Successful
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {importedStories.length} user stories have been imported
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="bg-transparent"
            >
              {step === 'complete' ? 'Close' : 'Cancel'}
            </Button>

            {step === 'config' && (
              <Button onClick={handleConnect} disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect & Fetch'
                )}
              </Button>
            )}

            {step === 'preview' && (
              <Button onClick={handleImport} disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Stories'
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
