
export default class ApiError extends Error {
  statusCode: number;
  errors?: any;

  constructor(statusCode: number, message: string, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;

    // Fix prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}