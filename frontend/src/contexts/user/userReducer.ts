import { UserDispatchAction } from './userContextTypes'

export enum UserDispatchActionType {
  CHANNEL_COUNT_DECREASED = 'CHANNEL_COUNT_DECREASED',
  CHANNEL_COUNT_INCREASED = 'CHANNEL_COUNT_INCREASED',
  SUBSCRIPTION_COUNT_DECREASED = 'SUBSCRIPTION_COUNT_DECREASED',
  SUBSCRIPTION_COUNT_INCREASED = 'SUBSCRIPTION_COUNT_INCREASED',
  SYNCED = 'SYNCED',
}

export default function userReducer(
  user: IUser | null,
  action: UserDispatchAction,
): IUser | null {
  switch (action.type) {
    case UserDispatchActionType.CHANNEL_COUNT_DECREASED: {
      if (user == null) return null
      return {
        ...user,
        channelCount: (user.channelCount ?? 0) - 1,
      }
    }
    case UserDispatchActionType.CHANNEL_COUNT_INCREASED: {
      if (user == null) return null
      return {
        ...user,
        channelCount: (user.channelCount ?? 0) + 1,
      }
    }
    case UserDispatchActionType.SUBSCRIPTION_COUNT_DECREASED: {
      if (user == null) return null
      return {
        ...user,
        subscriptionCount: (user.subscriptionCount ?? 0) - 1,
      }
    }
    case UserDispatchActionType.SUBSCRIPTION_COUNT_INCREASED: {
      if (user == null) return null
      return {
        ...user,
        subscriptionCount: (user.subscriptionCount ?? 0) + 1,
      }
    }
    case UserDispatchActionType.SYNCED: {
      return action.user ?? user
    }
  }
}
