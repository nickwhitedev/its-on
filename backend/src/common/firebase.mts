import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'
import admin from 'firebase-admin'

export const initializeFirebase = async () => {
  const firebaseServiceAccountSecret = await new SecretsManagerClient({
    region: 'us-east-1',
  }).send(
    new GetSecretValueCommand({
      SecretId: process.env.FIREBASE_IOS_SERVICE_ACCOUNT_SECRET_NAME,
    }),
  )

  admin.initializeApp({
    credential: admin.credential.cert(
      firebaseServiceAccountSecret.SecretString ?? '',
    ),
  })
}

export const getMessagingChannelTopic = ({
  channelID,
  channelOwnerID,
}: {
  channelID: string
  channelOwnerID: string
}): string => {
  return `user-${channelOwnerID}_channel-${channelID}`
}

export const getUserTopic = (userID: string): string => {
  return `user-${userID}`
}
