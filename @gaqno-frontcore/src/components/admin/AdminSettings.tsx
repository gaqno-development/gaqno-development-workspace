import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Settings } from "lucide-react";

export const AdminSettings: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Configurações
      </CardTitle>
      <CardDescription>Configurações administrativas</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">Em desenvolvimento.</p>
    </CardContent>
  </Card>
);
