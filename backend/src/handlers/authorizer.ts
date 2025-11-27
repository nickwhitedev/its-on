import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerHandler,
  ConditionBlock,
} from 'aws-lambda'

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'
import jwt, { JwtPayload } from 'jsonwebtoken'
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

interface APIOptions {
  region: string
  restApiId: string
  stage: string
}

type StatementEffect = 'Allow' | 'Deny'

type HttpVerb =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'HEAD'
  | 'DELETE'
  | 'OPTIONS'
  | '*'

interface StatementMethod {
  resourceArn: string
  conditions: ConditionBlock | undefined
}

interface PolicyStatement {
  Action: string
  Condition?: ConditionBlock | undefined
  Effect: StatementEffect
  Resource: string[]
}

export const handler: APIGatewayTokenAuthorizerHandler = async event => {
  // Do not print the auth token in production
  // console.log('Client token: ' + event.authorizationToken);
  console.log('Method ARN: ' + event.methodArn)

  // validate the incoming token
  // and produce the principal user identifier associated with the token
  let claims: JwtPayload
  try {
    claims = await verifyAccessToken(
      event.authorizationToken.replace('Bearer ', ''),
    )
  } catch (error) {
    console.error(error)
    throw new Error('Unauthorized')
  }

  const principalId = `user|${claims.sub ?? 'noid'}`

  // build apiOptions for the AuthPolicy
  const methodArnSplit = event.methodArn.split(':')
  const apiGatewayArnSplit = methodArnSplit[5].split('/')
  const awsAccountId = methodArnSplit[4]
  const apiOptions = {
    region: methodArnSplit[3],
    restApiId: apiGatewayArnSplit[0],
    stage: apiGatewayArnSplit[1],
  }
  //// Use for specific method - remember this gets cached - see tip below too
  // const method = apiGatewayArnSplit[2] as HttpVerb
  // let resource = '/' // root resource
  // if (apiGatewayArnSplit[3]) {
  //   resource += apiGatewayArnSplit.slice(3, apiGatewayArnSplit.length).join('/')
  // }

  // this function must generate a policy that is associated with the recognized principal user identifier.
  // depending on your use case, you might store policies in a DB, or generate them on the fly

  // keep in mind, the policy is cached for 5 minutes by default (TTL is configurable in the authorizer)
  // and will apply to subsequent calls to any method/resource in the RestApi
  // made with the same token
  const policy = new AuthPolicy(principalId, awsAccountId, apiOptions)

  // the example policy below denies access to all resources in the RestApi
  // policy.denyAllMethods();
  policy.allowAllMethods()

  // finally, build the policy
  const authResponse = policy.build()

  // new! -- add additional key-value pairs
  // these are made available by APIGW like so: $context.authorizer.<key>
  // additional context is cached
  authResponse.context = {
    sub: claims.sub, // $context.authorizer.sub -> value
    username: claims.username as string, // $context.authorizer.username -> value
  }
  // authResponse.context.arr = ['foo']; <- this is invalid, APIGW will not accept it
  // authResponse.context.obj = {'foo':'bar'}; <- also invalid

  return authResponse
}

async function verifyAccessToken(accessToken: string): Promise<JwtPayload> {
  const jwksEndpoint = process.env.JWKS_ENDPOINT ?? ''
  const secretKey = await new SecretsManagerClient({
    region: 'us-east-1',
  }).send(
    new GetSecretValueCommand({
      SecretId: process.env.CLERK_SECRET_KEY_NAME,
    }),
  )

  const requestHeaders = {
    Authorization: `Bearer ${secretKey.SecretString ?? ''}`,
  }

  const client = jwksClient({
    jwksUri: jwksEndpoint,
    requestHeaders,
  })

  const jwksResponse = await fetch(jwksEndpoint, {
    headers: requestHeaders,
  })

  if (!jwksResponse.ok) {
    throw new Error('Bad jwks response')
  }

  const jwks = (await jwksResponse.json()) as JWKS

  const key = await client.getSigningKey(jwks.keys[0].kid)

  const claims = jwt.verify(accessToken, key.getPublicKey())

  if (typeof claims === 'string') {
    throw new Error('verifyAccessToken returned a string')
  }
  const now = Date.now()
  if ((claims.exp ?? 0) * 1000 < now || (claims.nbf ?? 0 * 1000) > now) {
    throw new Error('Claim not valid - expired or early')
  }

  return claims
}

/**
 * AuthPolicy receives a set of allowed and denied methods and generates a valid
 * AWS policy for the API Gateway authorizer. The constructor receives the calling
 * user principal, the AWS account ID of the API owner, and an apiOptions object.
 * The apiOptions can contain an API Gateway RestApi Id, a region for the RestApi, and a
 * stage that calls should be allowed/denied for. For example
 * {
 *   restApiId: "xxxxxxxxxx",
 *   region: "us-east-1",
 *   stage: "dev"
 * }
 *
 * const testPolicy = new AuthPolicy("[principal user identifier]", "[AWS account id]", apiOptions);
 * testPolicy.allowMethod(AuthPolicy.HttpVerb.GET, "/users/username");
 * testPolicy.denyMethod(AuthPolicy.HttpVerb.POST, "/pets");
 * context.succeed(testPolicy.build());
 *
 * @class AuthPolicy
 * @constructor
 */
class AuthPolicy {
  allowMethods: StatementMethod[]
  awsAccountID: string
  denyMethods: StatementMethod[]
  pathRegex: RegExp
  principalID: string
  region: string
  restApiId: string
  stage: string
  version: string

  constructor(
    principalID: string,
    awsAccountID: string,
    apiOptions: APIOptions,
  ) {
    /**
     * The AWS account id the policy will be generated for. This is used to create
     * the method ARNs.
     */
    this.awsAccountID = awsAccountID

    /**
     * The principal used for the policy, this should be a unique identifier for
     * the end user.
     */
    this.principalID = principalID

    /**
     * The policy version used for the evaluation. This should always be "2012-10-17"
     */
    this.version = '2012-10-17'

    /**
     * The regular expression used to validate resource paths for the policy
     */
    this.pathRegex = new RegExp('^[/.a-zA-Z0-9-*]+$')

    // these are the internal lists of allowed and denied methods. These are lists
    // of objects and each object has 2 properties: A resource ARN and a nullable
    // conditions statement.
    // the build method processes these lists and generates the approriate
    // statements for the final policy
    this.allowMethods = []
    this.denyMethods = []

    if (apiOptions.restApiId === '') {
      // Replace the placeholder value with a default API Gateway API id to be used in the policy.
      // Beware of using '*' since it will not simply mean any API Gateway API id, because stars will greedily expand over '/' or other separators.
      // See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html for more details.
      this.restApiId = '*'
    } else {
      this.restApiId = apiOptions.restApiId
    }
    if (apiOptions.region === '') {
      // Replace the placeholder value with a default region to be used in the policy.
      // Beware of using '*' since it will not simply mean any region, because stars will greedily expand over '/' or other separators.
      // See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html for more details.
      this.region = 'us-east-1'
    } else {
      this.region = apiOptions.region
    }
    if (apiOptions.stage === '') {
      // Replace the placeholder value with a default stage to be used in the policy.
      // Beware of using '*' since it will not simply mean any stage, because stars will greedily expand over '/' or other separators.
      // See https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html for more details.
      this.stage = '*'
    } else {
      this.stage = apiOptions.stage
    }
  }

  /**
   * Adds a method to the internal lists of allowed or denied methods. Each object in
   * the internal list contains a resource ARN and a condition statement. The condition
   * statement can be null.
   */
  protected addMethod(
    effect: StatementEffect,
    verb: HttpVerb,
    resource: string,
    conditions?: ConditionBlock,
  ): void {
    if (!this.pathRegex.test(resource)) {
      throw new Error(
        'Invalid resource path: ' +
          resource +
          '. Path should match ' +
          this.pathRegex.toString(),
      )
    }

    let cleanedResource = resource
    if (resource.startsWith('/')) {
      cleanedResource = resource.substring(1, resource.length)
    }
    const resourceArn =
      'arn:aws:execute-api:' +
      this.region +
      ':' +
      this.awsAccountID +
      ':' +
      this.restApiId +
      '/' +
      this.stage +
      '/' +
      verb +
      '/' +
      cleanedResource

    if (effect === 'Allow') {
      this.allowMethods.push({
        resourceArn: resourceArn,
        conditions,
      })
    } else {
      this.denyMethods.push({
        resourceArn: resourceArn,
        conditions,
      })
    }
  }

  /**
   * Returns an empty statement object prepopulated with the correct action and the
   * desired effect.
   */
  protected getEmptyStatement(effect: StatementEffect): PolicyStatement {
    return {
      Action: 'execute-api:Invoke',
      Effect: effect,
      Resource: [],
    }
  }

  /**
   * This function loops over an array of objects containing a resourceArn and
   * conditions statement and generates the array of statements for the policy.
   */
  protected getStatementsForEffect(
    effect: StatementEffect,
    methods: StatementMethod[],
  ): PolicyStatement[] {
    const statements = []

    if (methods.length > 0) {
      const statement = this.getEmptyStatement(effect)

      for (const method of methods) {
        if (method.conditions != null) {
          statement.Resource.push(method.resourceArn)
        } else {
          const conditionalStatement = this.getEmptyStatement(effect)
          conditionalStatement.Resource.push(method.resourceArn)
          conditionalStatement.Condition = method.conditions
          statements.push(conditionalStatement)
        }
      }

      if (statement.Resource.length > 0) {
        statements.push(statement)
      }
    }

    return statements
  }

  /**
   * Adds an Allow "*" statement to the policy.
   */
  allowAllMethods(): void {
    this.addMethod('Allow', '*', '*')
  }

  /**
   * Adds a Deny "*" statement to the policy.
   */
  denyAllMethods(): void {
    this.addMethod('Deny', '*', '*')
  }

  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
   * methods for the policy
   */
  allowMethod(verb: HttpVerb, resource: string): void {
    this.addMethod('Allow', verb, resource)
  }

  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of denied
   * methods for the policy
   */
  denyMethod(verb: HttpVerb, resource: string): void {
    this.addMethod('Deny', verb, resource)
  }

  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of allowed
   * methods and includes a condition for the policy statement. More on AWS policy
   * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
   */
  allowMethodWithConditions(
    verb: HttpVerb,
    resource: string,
    conditions: ConditionBlock,
  ): void {
    this.addMethod('Allow', verb, resource, conditions)
  }

  /**
   * Adds an API Gateway method (Http verb + Resource path) to the list of denied
   * methods and includes a condition for the policy statement. More on AWS policy
   * conditions here: http://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html#Condition
   */
  denyMethodWithConditions(
    verb: HttpVerb,
    resource: string,
    conditions: ConditionBlock,
  ): void {
    this.addMethod('Deny', verb, resource, conditions)
  }

  /**
   * Generates the policy document based on the internal lists of allowed and denied
   * conditions. This will generate a policy with two main statements for the effect:
   * one statement for Allow and one statement for Deny.
   * Methods that includes conditions will have their own statement in the policy.
   */
  build(): APIGatewayAuthorizerResult {
    if (this.allowMethods.length === 0 && this.denyMethods.length === 0) {
      throw new Error('No statements defined for the policy')
    }

    return {
      principalId: this.principalID,
      policyDocument: {
        Statement: [
          ...this.getStatementsForEffect('Allow', this.allowMethods),
          ...this.getStatementsForEffect('Deny', this.denyMethods),
        ],
        Version: this.version,
      },
    }
  }
}
