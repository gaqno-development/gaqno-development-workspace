import React, { useState } from 'react'
import { useDomains } from '../../../hooks/admin/useDomains'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Shield, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '../../ui/alert'

interface SSLCheckerProps {
  tenantId?: string
}

export const SSLChecker: React.FC<SSLCheckerProps> = ({ tenantId }) => {
  const { domains, isLoading, checkSsl } = useDomains(tenantId)
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set())

  const handleCheckAll = async () => {
    const activeDomains = domains.filter(d => d.isActive)
    setCheckingIds(new Set(activeDomains.map(d => d.id)))

    for (const domain of activeDomains) {
      try {
        await checkSsl(domain.id)
      } catch (error) {
        console.error(`Failed to check SSL for ${domain.domain}:`, error)
      }
    }

    setCheckingIds(new Set())
  }

  const handleCheckOne = async (id: string) => {
    setCheckingIds(new Set([id]))
    try {
      await checkSsl(id)
    } finally {
      setCheckingIds(new Set())
    }
  }

  const validCount = domains.filter(d => d.sslCertificateStatus === 'valid').length
  const expiringCount = domains.filter(d => d.sslCertificateStatus === 'expiring').length
  const expiredCount = domains.filter(d => d.sslCertificateStatus === 'expired').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SSL Certificate Checker
            </CardTitle>
            <CardDescription>Check SSL certificate status for all domains</CardDescription>
          </div>
          <Button onClick={handleCheckAll} disabled={checkingIds.size > 0 || isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${checkingIds.size > 0 ? 'animate-spin' : ''}`} />
            Check All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{validCount}</span>
              </div>
              <div className="text-sm text-muted-foreground">Valid</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{expiringCount}</span>
              </div>
              <div className="text-sm text-muted-foreground">Expiring</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{expiredCount}</span>
              </div>
              <div className="text-sm text-muted-foreground">Expired</div>
            </div>
          </div>

          {domains.length > 0 ? (
            <div className="space-y-2">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{domain.domain}</div>
                    <div className="text-sm text-muted-foreground">
                      Status: {domain.sslCertificateStatus || 'Not checked'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCheckOne(domain.id)}
                    disabled={checkingIds.has(domain.id)}
                  >
                    {checkingIds.has(domain.id) ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertDescription>No domains found. Add domains to check SSL certificates.</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

