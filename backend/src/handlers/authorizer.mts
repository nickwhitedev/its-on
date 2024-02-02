import { APIGatewayTokenAuthorizerHandler } from 'aws-lambda'

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

interface JWK {
  alg: string
  kty: string
  use: string
  n: string
  e: string
  kid: string
  x5t: string
  x5c: string[]
}

interface JWKS {
  keys: JWK[]
}

interface PolicyStatement {
  Action: string
  Effect: string
  Resource: string
}

// Configure the JWKS URI endppoint from your OIDC provider
const client = jwksClient({ jwksUri: process.env.JWKS_ENDPOINT ?? '' })

const apiPermissions = [
  {
    arn: `arn:aws:execute-api:${process.env.AWS_REGION}:${process.env.ACCOUNT_ID}:${process.env.API_ID}`, // NOTE: Replace with your API Gateway API ARN
    resource: '*', // NOTE: Replace with your API Gateway Resource
    stage: 'prod', // NOTE: Replace with your API Gateway Stage
    httpVerb: 'GET', // NOTE: Replace with the HTTP Verbs you want to allow access your REST Resource
    scope: 'email', // NOTE: Replace with the proper OAuth scopes that can access your REST Resource
  },
]

const defaultDenyAllPolicy = {
  principalId: 'user',
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Deny',
        Resource: '*',
      },
    ],
  },
}

const generatePolicyStatement = (
  apiName: string,
  apiStage: string,
  apiVerb: string,
  apiResource: string,
  action: 'Allow' | 'Deny',
): PolicyStatement => ({
  Action: 'execute-api:Invoke',
  Effect: action,
  Resource: apiName + '/' + apiStage + '/' + apiVerb + '/' + apiResource,
})

const generatePolicy = (
  principalId: string,
  policyStatements: PolicyStatement[],
) => ({
  policyDocument: { Statement: policyStatements, Version: '2012-10-17' },
  principalId: principalId,
})

async function verifyAccessToken(accessToken: string) {
  /*
   * Verify the access token with your Identity Provider here (check if your
   * Identity Provider provides an SDK).
   *
   * This example assumes this method returns a Promise that resolves to
   * the decoded token, you may need to modify your code according to how
   * your token is verified and what your Identity Provider returns.
   *
   * Fetch the KID attribute from your JWKS Endpoint to verify its integrity
   * You can either use a Environment Variable containing the KID or call AWS Secrets Manager with KID already securely stored.
   */
  const data = await new SecretsManagerClient({ region: 'REGION' }).send(
    new GetSecretValueCommand({
      SecretId: process.env.SM_JWKS_SECRET_NAME,
    }),
  )
  const key = await client.getSigningKey(
    (JSON.parse(data.SecretString ?? '[]') as JWKS).keys[0].kid,
  )
  return jwt.verify(accessToken, key.getPublicKey())
}

function generateIAMPolicy(scopeClaims: string[]) {
  // Declare empty policy statements array
  const policyStatements = apiPermissions
    .map(apiPermission => {
      // Check if token scopes exist in API Permission
      if (scopeClaims.includes(apiPermission.scope)) {
        // User token has appropriate scope, add API permission to policy statements
        return generatePolicyStatement(
          apiPermission.arn,
          apiPermission.stage,
          apiPermission.httpVerb,
          apiPermission.resource,
          'Allow',
        )
      }
      return null
    })
    .filter(policyStatement => policyStatement != null) as PolicyStatement[]
  // Check if no policy statements are generated, if so, create default deny all policy statement
  if (policyStatements.length === 0) {
    return defaultDenyAllPolicy
  } else {
    return generatePolicy('user', policyStatements)
  }
}

export const handler: APIGatewayTokenAuthorizerHandler = async event => {
  try {
    const data = await verifyAccessToken(
      event.authorizationToken.replace('Bearer ', ''),
    )
    if (typeof data === 'string') {
      throw new Error('verifyAccessToken returned a string')
    }
    const scopeClaims = data.claims.scp
    // Generate IAM Policy
    return generateIAMPolicy(scopeClaims)
  } catch (error) {
    console.error(error)
    return defaultDenyAllPolicy
  }
}
