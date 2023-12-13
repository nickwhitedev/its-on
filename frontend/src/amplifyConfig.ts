import { ResourcesConfig } from 'aws-amplify'

const config: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string,
      // OPTIONAL - This is used when autoSignIn is enabled for Auth.signUp
      // 'code' is used for Auth.confirmSignUp, 'link' is used for email link verification
      signUpVerificationMethod: 'code', // 'code' | 'link'
      loginWith: {
        // OPTIONAL - Hosted UI configuration
        oauth: {
          domain: import.meta.env.VITE_AUTH_URL as string,
          scopes: ['phone', 'email', 'profile', 'openid'],
          redirectSignIn: [import.meta.env.VITE_BASE_URL as string],
          redirectSignOut: [import.meta.env.VITE_BASE_URL as string],
          responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
        },
      },
    },
  },
}

export default config
