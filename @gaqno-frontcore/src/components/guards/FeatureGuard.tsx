import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { LoaderPinwheelIcon } from "../ui/loader-pinwheel";
import { FeatureModule, FeaturePermissionLevel } from "../../types/user";
import { useHasFeatureRole } from "../../hooks/usePermissions";
import { useAuth } from "../../hooks/useAuth";
import { formatFeatureLabel } from "../../lib/permissions";

interface IFeatureGuardProps {
  feature: FeatureModule;
  minRole?: FeaturePermissionLevel;
  tenantId?: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const FeatureGuard: React.FC<IFeatureGuardProps> = ({
  feature,
  minRole = FeaturePermissionLevel.USER,
  tenantId,
  children,
  fallback,
  redirectTo,
}) => {
  const navigate = useNavigate();
  const { loading } = useAuth();
  const hasAccess = useHasFeatureRole(feature, minRole, tenantId);

  useEffect(() => {
    if (!loading && !hasAccess) {
      if (redirectTo) {
        navigate(redirectTo);
      }
    }
  }, [hasAccess, loading, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderPinwheelIcon size={48} />
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have access to the {formatFeatureLabel(feature)}{" "}
          module.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

FeatureGuard.displayName = "FeatureGuard";
