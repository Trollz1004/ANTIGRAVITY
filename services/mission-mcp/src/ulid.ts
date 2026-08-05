import { ulid as _ulid } from "ulid";

/** Generate a new ULID string */
export function ulid(): string {
  return _ulid();
}
