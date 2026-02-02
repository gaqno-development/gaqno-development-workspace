import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Shield } from "lucide-react";

export const RolesList: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Papéis
      </CardTitle>
      <CardDescription>Gerenciar papéis e permissões</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">Em desenvolvimento.</p>
    </CardContent>
  </Card>
);
