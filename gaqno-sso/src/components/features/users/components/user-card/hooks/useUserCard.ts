import { useState } from 'react'
import { IUserCardProps } from '../types'

export const useUserCard = (props: IUserCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = () => {
    props.onEdit(props.user)
  }

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja deletar ${props.user.name}?`)) {
      setIsDeleting(true)
      try {
        await props.onDelete(props.user.user_id)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return {
    handleEdit,
    handleDelete,
    isDeleting,
  }
}

