/**
 * Return the result of this function in the `default` case of `switch`
 * statements where all cases of the value are known at compile time. A
 * compiler error will warn you when not all of the value's cases have
 * been handled before reaching `default`. If at runtime a case goes
 * unhandled, this function will throw an error.
 *
 * For example, this code is valid:
 * ```
 * type KnownKeys = "foo" | "bar";
 * const key: KnownKeys = ...;
 *
 * switch (key) {
 *  case "foo":
 *    return ...;
 *
 *  case "bar":
 *    return ...;
 *
 *  default:
 *    return assertUnreachable(key);
 * }
 * ```
 *
 * But if `KnownKeys` had an additional value, `"baz"`, then an error would
 * appear in the default case, since `"baz"` is not explicitly handled.
 *
 * @param x The unhandled value.
 * @throws An error describing the unhandled value.
 */
export default function assertUnreachable(x: never): never {
	throw new Error(`Unexpected value ${JSON.stringify(x)}`);
}
