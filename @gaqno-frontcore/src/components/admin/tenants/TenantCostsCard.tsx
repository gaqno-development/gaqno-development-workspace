import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { useTenantCosts } from '../../../hooks/admin/useTenantCosts'
import { Skeleton } from '../../ui/skeleton'
import { DollarSign, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '../../ui/alert'

interface TenantCostsCardProps {
  tenantId: string
}

export const TenantCostsCard: React.FC<TenantCostsCardProps> = ({ tenantId }) => {
  const { summary, isLoading, isError, error, syncCosts } = useTenantCosts(tenantId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    const message = error instanceof Error ? error.message : (error as unknown as { message?: string })?.message ?? 'Failed to load costs'
    return (
      <Card>
        <CardHeader>
          <CardTitle>Costs</CardTitle>
          <CardDescription>Error loading cost data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Costs</CardTitle>
          <CardDescription>No cost data available</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              SaaS service is not configured or no costs found for this tenant.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Monthly Costs
        </CardTitle>
        <CardDescription>Total cost for this tenant</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-3xl font-bold">
              {summary.currency} {summary.totalMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">
              {summary.activeCostsCount} active cost{summary.activeCostsCount !== 1 ? 's' : ''}
            </div>
          </div>
          {Object.keys(summary.costsByCategory).length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">By Category</div>
              <div className="space-y-1">
                {Object.entries(summary.costsByCategory).map(([category, amount]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="capitalize">{category}</span>
                    <span>{summary.currency} {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

