import { IUserProfile } from './user'
import { SessionContext, SessionUser } from './shared/auth'

export interface IAuthContext {
  user: SessionUser | null
  session: SessionContext | null
  profile: IUserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

export interface ILoginCredentials {
  email: string
  password: string
}

export interface IRegisterCredentials {
  email: string
  password: string
  name: string
}

