export class ErrorBase<T extends string> extends Error {
  cause?: Record<string, unknown>
  message: string
  name: T

  constructor({
    cause,
    message,
    name,
  }: {
    cause?: Record<string, unknown>
    message: string
    name: T
  }) {
    super()
    this.cause = cause
    this.name = name
    this.message = message
  }
}
