import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { LoaderPinwheelIcon } from "../ui/loader-pinwheel";
import { useIsRootAdmin } from "../../hooks/usePermissions";
import { useAuth } from "../../hooks/useAuth";

interface IRootAdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const RootAdminGuard: React.FC<IRootAdminGuardProps> = ({
  children,
  fallback,
  redirectTo = "/dashboard",
}) => {
  const navigate = useNavigate();
  const { loading } = useAuth();
  const isRootAdmin = useIsRootAdmin();

  useEffect(() => {
    if (!loading && !isRootAdmin) {
      if (redirectTo) {
        navigate(redirectTo);
      }
    }
  }, [isRootAdmin, loading, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderPinwheelIcon size={48} />
      </div>
    );
  }

  if (!isRootAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          You need Root Administrator privileges to access this area.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

RootAdminGuard.displayName = "RootAdminGuard";
