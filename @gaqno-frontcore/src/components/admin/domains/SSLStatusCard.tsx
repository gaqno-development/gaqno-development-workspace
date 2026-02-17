import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { SSL_STATUS_LABEL } from "../constants";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { IDomain } from "../../../types/admin";

interface SSLStatusCardProps {
  domain: IDomain;
}

export const SSLStatusCard: React.FC<SSLStatusCardProps> = ({ domain }) => {
  const getStatusIcon = () => {
    switch (domain.sslCertificateStatus) {
      case "valid":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "expiring":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "expired":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () =>
    SSL_STATUS_LABEL[domain.sslCertificateStatus ?? "none"] ?? "Not Checked";

  const getDaysUntilExpiry = () => {
    if (!domain.sslCertificateExpiresAt) return null;
    const expiresAt = new Date(domain.sslCertificateExpiresAt);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          SSL Certificate Status
        </CardTitle>
        <CardDescription>{domain.domain}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">{getStatusText()}</span>
            </div>
            <Badge
              variant={
                domain.sslCertificateStatus === "valid"
                  ? "default"
                  : domain.sslCertificateStatus === "expiring"
                    ? "outline"
                    : "destructive"
              }
            >
              {domain.sslCertificateStatus || "none"}
            </Badge>
          </div>

          {domain.sslCertificateIssuedAt && (
            <div>
              <div className="text-sm text-muted-foreground">Issued</div>
              <div className="text-sm font-medium">
                {new Date(domain.sslCertificateIssuedAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {domain.sslCertificateExpiresAt && (
            <div>
              <div className="text-sm text-muted-foreground">Expires</div>
              <div className="text-sm font-medium">
                {new Date(domain.sslCertificateExpiresAt).toLocaleDateString()}
                {daysUntilExpiry !== null && (
                  <span
                    className={`ml-2 ${daysUntilExpiry <= 30 ? "text-yellow-500" : ""}`}
                  >
                    ({daysUntilExpiry} days)
                  </span>
                )}
              </div>
            </div>
          )}

          {domain.sslLastCheckedAt && (
            <div>
              <div className="text-sm text-muted-foreground">Last Checked</div>
              <div className="text-sm font-medium">
                {new Date(domain.sslLastCheckedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
