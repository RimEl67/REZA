export class HttpError extends Error {
  constructor(
    public status: number,
    public payload: Record<string, unknown>
  ) {
    super(JSON.stringify(payload));
    this.name = 'HttpError';
  }
}
