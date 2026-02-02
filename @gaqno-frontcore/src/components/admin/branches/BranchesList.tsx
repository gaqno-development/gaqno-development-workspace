import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { GitBranch } from "lucide-react";

export const BranchesList: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <GitBranch className="h-5 w-5" />
        Branches
      </CardTitle>
      <CardDescription>Manage tenant branches</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">Em desenvolvimento.</p>
    </CardContent>
  </Card>
);
