import { UserDispatchActionType } from './userReducer'

interface UserDispatchAction {
  type: UserDispatchActionType
  id?: string
  user?: IUser
}

interface UserDispatch {
  dispatch: (action: UserDispatchActionType) => void
}
