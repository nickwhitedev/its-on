import { ErrorBase } from './errorBase'

type ErrorName = 'LOGIN_ERROR'

export class AuthError extends ErrorBase<ErrorName> {}
