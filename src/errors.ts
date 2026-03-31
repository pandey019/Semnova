export enum ErrorCode {
  MODEL_LOAD_FAILED = 'MODEL_LOAD_FAILED',
  EMPTY_TEXT = 'EMPTY_TEXT',
  STORE_CONNECTION_FAILED = 'STORE_CONNECTION_FAILED',
  DIMENSION_MISMATCH = 'DIMENSION_MISMATCH',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export class SemanticSearchError extends Error {
  public code: ErrorCode;
  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN) {
    super(message);
    this.name = 'SemanticSearchError';
    this.code = code;
  }
}

export class ModelLoadError extends SemanticSearchError {
  constructor(message: string) {
    super(message, ErrorCode.MODEL_LOAD_FAILED);
    this.name = 'ModelLoadError';
  }
}

export class EmptyTextError extends SemanticSearchError {
  constructor(message: string = 'Text to embed cannot be null, undefined, or empty.') {
    super(message, ErrorCode.EMPTY_TEXT);
    this.name = 'EmptyTextError';
  }
}

export class StoreConnectionError extends SemanticSearchError {
  constructor(message: string) {
    super(message, ErrorCode.STORE_CONNECTION_FAILED);
    this.name = 'StoreConnectionError';
  }
}

export class DimensionMismatchError extends SemanticSearchError {
  constructor(message: string) {
    super(message, ErrorCode.DIMENSION_MISMATCH);
    this.name = 'DimensionMismatchError';
  }
}

export class ItemNotFoundError extends SemanticSearchError {
  constructor(message: string) {
    super(message, ErrorCode.ITEM_NOT_FOUND);
    this.name = 'ItemNotFoundError';
  }
}
