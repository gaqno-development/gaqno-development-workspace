import { IUserProfile } from '@gaqno-dev/frontcore/types/user'

export interface IUserCardProps {
  user: IUserProfile
  onEdit: (user: IUserProfile) => void
  onDelete: (userId: string) => void
}

