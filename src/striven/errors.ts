export class StrivenHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly method: string,
    public readonly path: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "StrivenHttpError";
  }
}
