import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { useTenantCosts } from '../../../hooks/admin/useTenantCosts'
import { Button } from '../../ui/button'
import { RefreshCw, DollarSign } from 'lucide-react'
import { Skeleton } from '../../ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'

interface TenantCostsSummaryProps {
  tenantId: string
}

export const TenantCostsSummary: React.FC<TenantCostsSummaryProps> = ({ tenantId }) => {
  const { costs, summary, isLoading, syncCosts } = useTenantCosts(tenantId)

  const handleSync = async () => {
    await syncCosts()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Summary
            </CardTitle>
            <CardDescription>Detailed breakdown of tenant costs</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleSync}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Monthly Cost</div>
                <div className="text-2xl font-bold">
                  {summary.currency} {summary.totalMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Costs</div>
                <div className="text-2xl font-bold">{summary.activeCostsCount}</div>
              </div>
            </div>

            {costs.length > 0 ? (
              <div>
                <div className="text-sm font-medium mb-2">Cost Details</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>{cost.provider}</TableCell>
                        <TableCell>{cost.serviceName}</TableCell>
                        <TableCell className="capitalize">{cost.category}</TableCell>
                        <TableCell className="text-right">
                          {cost.currency} {cost.costAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No costs found for this tenant
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

