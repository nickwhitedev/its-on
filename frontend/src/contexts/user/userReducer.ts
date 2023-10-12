import { UserDispatchAction } from './userContextTypes'

export enum UserDispatchActionType {
  SYNCED = 'SYNCED',
}

export default function userReducer(
  user: IUser | null,
  action: UserDispatchAction,
): IUser | null {
  switch (action.type) {
    case UserDispatchActionType.SYNCED: {
      return action.user ?? user
    }
  }
}
