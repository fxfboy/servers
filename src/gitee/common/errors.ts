export class GiteeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GiteeError';
  }
}

export class GiteeValidationError extends GiteeError {
  constructor(message: string, public response?: any) {
    super(message);
    this.name = 'GiteeValidationError';
  }
}

export class GiteeResourceNotFoundError extends GiteeError {
  constructor(message: string) {
    super(message);
    this.name = 'GiteeResourceNotFoundError';
  }
}

export class GiteeAuthenticationError extends GiteeError {
  constructor(message: string) {
    super(message);
    this.name = 'GiteeAuthenticationError';
  }
}

export class GiteePermissionError extends GiteeError {
  constructor(message: string) {
    super(message);
    this.name = 'GiteePermissionError';
  }
}

export class GiteeRateLimitError extends GiteeError {
  constructor(message: string, public resetAt: Date) {
    super(message);
    this.name = 'GiteeRateLimitError';
  }
}

export function isGiteeError(error: any): error is GiteeError {
  return error instanceof GiteeError;
}
