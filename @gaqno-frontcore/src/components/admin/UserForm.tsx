import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { User } from "lucide-react";

export const UserForm: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <User className="h-5 w-5" />
        Usuário
      </CardTitle>
      <CardDescription>Criar ou editar usuário</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">Em desenvolvimento.</p>
    </CardContent>
  </Card>
);
