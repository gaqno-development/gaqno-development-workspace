import { IUserProfile } from '@gaqno-dev/frontcore/types/user'

export interface IUserFormProps {
  user?: IUserProfile
  onSuccess?: () => void
  onCancel?: () => void
}

