export class AccessDeniedError extends Error {
  constructor(message = 'Access Denied') {
    super();
    this.message = message;
  }
}
export class LastAdminError extends Error {
  constructor(message = 'Not Allowed to delete the last admin') {
    super();
    this.message = message;
  }
}
export class ValidationError extends Error {
  constructor(message = 'Not Valid') {
    super();
    this.message = message;
  }
}
export class DuplicateError extends Error {
  constructor(message = 'Already exist') {
    super();
    this.message = message;
  }
}
export class SamePasswordError extends Error {
  constructor(message = 'New password cannot be same as the old password') {
    super();
    this.message = message;
  }
}
