import React from 'react'
import { Card, CardContent, CardFooter } from '@gaqno-dev/frontcore/components/ui'
import { Button } from '@gaqno-dev/frontcore/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@gaqno-dev/frontcore/components/ui'
import { Edit, Trash2, User } from 'lucide-react'
import { IUserCardProps } from './types'
import { useUserCard } from './hooks/useUserCard'

export const UserCard: React.FC<IUserCardProps> = (props) => {
  const { handleEdit, handleDelete, isDeleting } = useUserCard(props)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={props.user.avatar_url} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-lg">{props.user.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {props.user.role}
            </p>
            {props.user.department && (
              <p className="text-xs text-muted-foreground">
                {props.user.department}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
          className="flex-1"
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          loading={isDeleting}
          disabled={isDeleting}
          className="flex-1"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Deletar
        </Button>
      </CardFooter>
    </Card>
  )
}

UserCard.displayName = 'UserCard'

