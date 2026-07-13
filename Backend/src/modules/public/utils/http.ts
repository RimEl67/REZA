import { HttpError } from '../../../lib/errors';

export function fail(status: number, payload: Record<string, unknown>): never {
  throw new HttpError(status, payload);
}

export type RedirectError = Error & { isRedirect: true; url: string };

export function isRedirectError(error: unknown): error is RedirectError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isRedirect' in error &&
    (error as RedirectError).isRedirect === true &&
    typeof (error as RedirectError).url === 'string'
  );
}

export function redirectTo(url: string): never {
  throw Object.assign(new Error('REDIRECT'), { isRedirect: true, url });
}
