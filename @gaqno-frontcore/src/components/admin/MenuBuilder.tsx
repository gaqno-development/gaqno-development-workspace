import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Menu } from "lucide-react";

export const MenuBuilder: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Menu className="h-5 w-5" />
        Menu
      </CardTitle>
      <CardDescription>Construtor de menu administrativo</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">Em desenvolvimento.</p>
    </CardContent>
  </Card>
);
