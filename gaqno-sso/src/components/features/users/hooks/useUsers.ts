import { useQuery } from '@tanstack/react-query'
import { api } from '@gaqno-dev/frontcore/lib/api'
import { IUserProfile } from '@gaqno-dev/frontcore/types/user'

export const useUsers = () => {
  return useQuery<IUserProfile[]>({
    queryKey: ['users'],
    queryFn: () => api.users.getAll()
  })
}

