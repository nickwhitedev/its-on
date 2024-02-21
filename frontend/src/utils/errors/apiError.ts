import { ErrorBase } from './errorBase'

type ErrorName = 'REQUEST_FAILED'

export class APIError extends ErrorBase<ErrorName> {}
