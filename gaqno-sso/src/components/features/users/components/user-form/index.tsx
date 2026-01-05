import React from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@gaqno-dev/frontcore/components/ui'
import { Input } from '@gaqno-dev/frontcore/components/ui'
import { Button } from '@gaqno-dev/frontcore/components/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@gaqno-dev/frontcore/components/ui'
import { UserRole } from '@gaqno-dev/frontcore/types/user'
import { IUserFormProps } from './types'
import { useUserForm } from './hooks/useUserForm'

export const UserForm: React.FC<IUserFormProps> = (props) => {
  const { form, onSubmit, isSubmitting, error } = useUserForm(props)

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do usuário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                  <SelectItem value={UserRole.USER}>User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departamento</FormLabel>
              <FormControl>
                <Input placeholder="Departamento (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do Avatar</FormLabel>
              <FormControl>
                <Input placeholder="URL da imagem (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : props.user ? 'Atualizar' : 'Criar'}
          </Button>
          {props.onCancel && (
            <Button type="button" variant="outline" onClick={props.onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}

UserForm.displayName = 'UserForm'

