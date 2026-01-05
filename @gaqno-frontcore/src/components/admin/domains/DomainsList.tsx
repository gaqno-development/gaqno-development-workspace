import React from 'react'
import { useDomains } from '../../../hooks/admin/useDomains'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { Badge } from '../../ui/badge'
import { Globe, Plus, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Skeleton } from '../../ui/skeleton'
import { useNavigate } from 'react-router-dom'

interface DomainsListProps {
  tenantId?: string
}

export const DomainsList: React.FC<DomainsListProps> = ({ tenantId }) => {
  const { domains, isLoading, checkSsl } = useDomains(tenantId)
  const navigate = useNavigate()

  const getStatusBadge = (domain: any) => {
    if (!domain.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (domain.isVerified) {
      return <Badge variant="default" className="bg-green-500">Verified</Badge>
    }
    return <Badge variant="outline">Unverified</Badge>
  }

  const getSslBadge = (status?: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>
      case 'expiring':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Expiring</Badge>
      case 'expired':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>
      default:
        return <Badge variant="secondary">None</Badge>
    }
  }

  const handleCheckSsl = async (id: string) => {
    await checkSsl(id)
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
              <Globe className="h-5 w-5" />
              Domains
            </CardTitle>
            <CardDescription>Manage tenant domains and SSL certificates</CardDescription>
          </div>
          <Button onClick={() => navigate('/admin/domains/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Domain
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {domains.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SSL Status</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell className="font-medium">{domain.domain}</TableCell>
                  <TableCell>{getStatusBadge(domain)}</TableCell>
                  <TableCell>{getSslBadge(domain.sslCertificateStatus)}</TableCell>
                  <TableCell>
                    {domain.sslLastCheckedAt
                      ? new Date(domain.sslLastCheckedAt).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCheckSsl(domain.id)}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Check SSL
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No domains found. Add your first domain to get started.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

