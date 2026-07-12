export enum ErrorCode {
  UNSUPPORTED_MEDIA_TYPE = "UNSUPPORTED_MEDIA_TYPE",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  MEETING_NOT_FOUND = "MEETING_NOT_FOUND",
  TENANT_MISMATCH = "TENANT_MISMATCH",
  INVALID_STATE_TRANSITION = "INVALID_STATE_TRANSITION",
  REJECTION_REASON_REQUIRED = "REJECTION_REASON_REQUIRED",
  TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED",
  STORAGE_OBJECT_MISSING = "STORAGE_OBJECT_MISSING",
  ANALYSIS_FAILED = "ANALYSIS_FAILED",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  DUPLICATE = "DUPLICATE",
  INTERNAL = "INTERNAL",
}

export interface AppErrorDetails {
  field?: string;
  received?: unknown;
  allowed?: unknown;
  storageReference?: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly httpStatus: number;
  public readonly details?: AppErrorDetails | AppErrorDetails[];
  public readonly retryable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    httpStatus: number,
    details?: AppErrorDetails | AppErrorDetails[],
    retryable = false,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.retryable = retryable;
  }
}

export function validationError(message: string, details?: AppErrorDetails | AppErrorDetails[]): AppError {
  return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, details);
}

export function notFound(message: string): AppError {
  return new AppError(ErrorCode.NOT_FOUND, message, 404);
}
