// Result type for error handling - inspired by Rust's Result<T>
export enum ResultType {
  OK = 0,
  ERROR = 1
}

export class Result<T> {
  private type: ResultType;
  private value: T | null;
  private error: string;

  private constructor(type: ResultType, value: T | null = null, error: string = '') {
    this.type = type;
    this.value = value;
    this.error = error;
  }

  static ok<T>(value: T): Result<T> {
    return new Result<T>(ResultType.OK, value);
  }

  static error<T>(error: string): Result<T> {
    return new Result<T>(ResultType.ERROR, null, error);
  }

  isOk(): boolean {
    return this.type === ResultType.OK;
  }

  isError(): boolean {
    return this.type === ResultType.ERROR;
  }

  unwrap(): T {
    if (this.isError()) {
      throw new Error(`Unwrap called on error: ${this.error}`);
    }
    return this.value!;
  }

  unwrapOr(defaultValue: T): T {
    return this.isOk() ? this.value! : defaultValue;
  }

  getError(): string {
    return this.error;
  }

  map<U>(fn: (value: T) => U): Result<U> {
    if (this.isOk()) {
      return Result.ok<U>(fn(this.value!));
    }
    return Result.error<U>(this.error);
  }

  mapError(fn: (error: string) => string): Result<T> {
    if (this.isError()) {
      return Result.error<T>(fn(this.error));
    }
    return Result.ok<T>(this.value!);
  }
}