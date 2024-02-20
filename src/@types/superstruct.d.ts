// Patch types for `superstruct`. Remove this file once they fix their resolution stuff. See https://github.com/ianstormtaylor/superstruct/issues/1160

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-definitions, @typescript-eslint/ban-types, @typescript-eslint/array-type, @typescript-eslint/no-unnecessary-type-constraint, @typescript-eslint/prefer-function-type */

declare module "superstruct" {
	/** error.js **/

	/**
	 * A `StructFailure` represents a single specific failure in validation.
	 */
	export type Failure = {
		value: any;
		key: any;
		type: string;
		refinement: string | undefined;
		message: string;
		explanation?: string;
		branch: Array<any>;
		path: Array<any>;
	};
	/**
	 * `StructError` objects are thrown (or returned) when validation fails.
	 *
	 * Validation logic is design to exit early for maximum performance. The error
	 * represents the first error encountered during validation. For more detail,
	 * the `error.failures` property is a generator function that can be run to
	 * continue validation and receive all the failures in the data.
	 */
	export class StructError extends TypeError {
		value: any;
		key: any;
		type: string;
		refinement: string | undefined;
		path: Array<any>;
		branch: Array<any>;
		failures: () => Array<Failure>;
		[x: string]: any;
		constructor(failure: Failure, failures: () => Generator<Failure>);
	}

	/** utils.js **/

	/**
	 * Check if a value is a plain object.
	 */
	export function isObject(x: unknown): x is object;
	/**
	 * Check if a value is a plain object.
	 */
	export function isPlainObject(x: unknown): x is {
		[key: string]: any;
	};
	/**
	 * Return a value as a printable string.
	 */
	export function print(value: any): string;
	/**
	 * Shifts (removes and returns) the first value from the `input` iterator.
	 * Like `Array.prototype.shift()` but for an `Iterator`.
	 */
	export function shiftIterator<T>(input: Iterator<T>): T | undefined;
	/**
	 * Convert a single validation result to a failure.
	 */
	export function toFailure<T, S>(
		result: string | boolean | Partial<Failure>,
		context: Context,
		struct: Struct<T, S>,
		value: any
	): Failure | undefined;
	/**
	 * Convert a validation result to an iterable of failures.
	 */
	export function toFailures<T, S>(
		result: Result,
		context: Context,
		struct: Struct<T, S>,
		value: any
	): IterableIterator<Failure>;
	/**
	 * Check a value against a struct, traversing deeply into nested values, and
	 * returning an iterator of failures or success.
	 */
	export function run<T, S>(
		value: unknown,
		struct: Struct<T, S>,
		options?: {
			path?: any[];
			branch?: any[];
			coerce?: boolean;
			mask?: boolean;
			message?: string;
		}
	): IterableIterator<[Failure, undefined] | [undefined, T]>;
	/**
	 * Convert a union of type to an intersection.
	 */
	export type UnionToIntersection<U> = (U extends any ? (arg: U) => any : never) extends (
		arg: infer I
	) => void
		? I
		: never;
	/**
	 * Assign properties from one type to another, overwriting existing.
	 */
	export type Assign<T, U> = Simplify<U & Omit<T, keyof U>>;
	/**
	 * A schema for enum structs.
	 */
	export type EnumSchema<T extends string | number | undefined | null> = {
		[K in NonNullable<T>]: K;
	};
	/**
	 * Check if a type is a match for another whilst treating overlapping
	 * unions as a match.
	 */
	export type IsMatch<T, G> = T extends G ? (G extends T ? T : never) : never;
	/**
	 * Check if a type is an exact match.
	 */
	export type IsExactMatch<T, U> =
		(<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2 ? T : never;
	/**
	 * Check if a type is a record type.
	 */
	export type IsRecord<T> = T extends object ? (string extends keyof T ? T : never) : never;
	/**
	 * Check if a type is a tuple.
	 */
	export type IsTuple<T> = T extends [any]
		? T
		: T extends [any, any]
			? T
			: T extends [any, any, any]
				? T
				: T extends [any, any, any, any]
					? T
					: T extends [any, any, any, any, any]
						? T
						: never;
	/**
	 * Check if a type is a union.
	 */
	export type IsUnion<T, U extends T = T> = (
		T extends any ? (U extends T ? false : true) : false
	) extends false
		? never
		: T;
	/**
	 * A schema for object structs.
	 */
	export type ObjectSchema = Record<string, Struct<any, any>>;
	/**
	 * Infer a type from an object struct schema.
	 */
	export type ObjectType<S extends ObjectSchema> = Simplify<
		Optionalize<{
			[K in keyof S]: Infer<S[K]>;
		}>
	>;
	/**
	 * Omit properties from a type that extend from a specific type.
	 */
	export type OmitBy<T, V> = Omit<
		T,
		{
			[K in keyof T]: V extends Extract<T[K], V> ? K : never;
		}[keyof T]
	>;
	/**
	 * Normalize properties of a type that allow `undefined` to make them optional.
	 */
	export type Optionalize<S extends object> = OmitBy<S, undefined> & Partial<PickBy<S, undefined>>;
	/**
	 * Transform an object schema type to represent a partial.
	 */
	export type PartialObjectSchema<S extends ObjectSchema> = {
		[K in keyof S]: Struct<Infer<S[K]> | undefined>;
	};
	/**
	 * Pick properties from a type that extend from a specific type.
	 */
	export type PickBy<T, V> = Pick<
		T,
		{
			[K in keyof T]: V extends Extract<T[K], V> ? K : never;
		}[keyof T]
	>;
	/**
	 * Simplifies a type definition to its most basic representation.
	 */
	export type Simplify<T> = T extends any[] | Date
		? T
		: {
				[K in keyof T]: T[K];
			} & {};
	export type If<B extends Boolean, Then, Else> = B extends true ? Then : Else;
	/**
	 * A schema for any type of struct.
	 */
	export type StructSchema<T> = [T] extends [string | undefined | null]
		? [T] extends [IsMatch<T, string | undefined | null>]
			? null
			: [T] extends [IsUnion<T>]
				? EnumSchema<T>
				: T
		: [T] extends [number | undefined | null]
			? [T] extends [IsMatch<T, number | undefined | null>]
				? null
				: [T] extends [IsUnion<T>]
					? EnumSchema<T>
					: T
			: [T] extends [boolean]
				? [T] extends [IsExactMatch<T, boolean>]
					? null
					: T
				: T extends
							| bigint
							| symbol
							| undefined
							| null
							| Function
							| Date
							| Error
							| RegExp
							| Map<any, any>
							| WeakMap<any, any>
							| Set<any>
							| WeakSet<any>
							| Promise<any>
					? null
					: T extends Array<infer E>
						? T extends IsTuple<T>
							? null
							: Struct<E>
						: T extends object
							? T extends IsRecord<T>
								? null
								: {
										[K in keyof T]: Describe<T[K]>;
									}
							: null;
	/**
	 * A schema for tuple structs.
	 */
	export type TupleSchema<T> = {
		[K in keyof T]: Struct<T[K]>;
	};
	/**
	 * Shorthand type for matching any `Struct`.
	 */
	export type AnyStruct = Struct<any, any>;
	/**
	 * Infer a tuple of types from a tuple of `Struct`s.
	 *
	 * This is used to recursively retrieve the type from `union` `intersection` and
	 * `tuple` structs.
	 */
	export type InferStructTuple<
		Tuple extends AnyStruct[],
		Length extends number = Tuple["length"]
	> = Length extends Length
		? number extends Length
			? Tuple
			: _InferTuple<Tuple, Length, []>
		: never;
	type _InferTuple<
		Tuple extends AnyStruct[],
		Length extends number,
		Accumulated extends unknown[],
		Index extends number = Accumulated["length"]
	> = Index extends Length
		? Accumulated
		: _InferTuple<Tuple, Length, [...Accumulated, Infer<Tuple[Index]>]>;

	/** struct.js **/

	/**
	 * `Struct` objects encapsulate the validation logic for a specific type of
	 * values. Once constructed, you use the `assert`, `is` or `validate` helpers to
	 * validate unknown input data against the struct.
	 */
	export class Struct<T = unknown, S = unknown> {
		readonly TYPE: T;
		type: string;
		schema: S;
		coercer: (value: unknown, context: Context) => unknown;
		validator: (value: unknown, context: Context) => Iterable<Failure>;
		refiner: (value: T, context: Context) => Iterable<Failure>;
		entries: (
			value: unknown,
			context: Context
		) => Iterable<[string | number, unknown, Struct<any> | Struct<never>]>;
		constructor(props: {
			type: string;
			schema: S;
			coercer?: Coercer;
			validator?: Validator;
			refiner?: Refiner<T>;
			entries?: Struct<T, S>["entries"];
		});
		/**
		 * Assert that a value passes the struct's validation, throwing if it doesn't.
		 */
		assert(value: unknown, message?: string): asserts value is T;
		/**
		 * Create a value with the struct's coercion logic, then validate it.
		 */
		create(value: unknown, message?: string): T;
		/**
		 * Check if a value passes the struct's validation.
		 */
		is(value: unknown): value is T;
		/**
		 * Mask a value, coercing and validating it, but returning only the subset of
		 * properties defined by the struct's schema.
		 */
		mask(value: unknown, message?: string): T;
		/**
		 * Validate a value with the struct's validation logic, returning a tuple
		 * representing the result.
		 *
		 * You may optionally pass `true` for the `withCoercion` argument to coerce
		 * the value before attempting to validate it. If you do, the result will
		 * contain the coerced result when successful.
		 */
		validate(
			value: unknown,
			options?: {
				coerce?: boolean;
				message?: string;
			}
		): [StructError, undefined] | [undefined, T];
	}
	/**
	 * Assert that a value passes a struct, throwing if it doesn't.
	 */
	export function assert<T, S>(
		value: unknown,
		struct: Struct<T, S>,
		message?: string
	): asserts value is T;
	/**
	 * Create a value with the coercion logic of struct and validate it.
	 */
	export function create<T, S>(value: unknown, struct: Struct<T, S>, message?: string): T;
	/**
	 * Mask a value, returning only the subset of properties defined by a struct.
	 */
	export function mask<T, S>(value: unknown, struct: Struct<T, S>, message?: string): T;
	/**
	 * Check if a value passes a struct.
	 */
	export function is<T, S>(value: unknown, struct: Struct<T, S>): value is T;
	/**
	 * Validate a value against a struct, returning an error if invalid, or the
	 * value (with potential coercion) if valid.
	 */
	export function validate<T, S>(
		value: unknown,
		struct: Struct<T, S>,
		options?: {
			coerce?: boolean;
			mask?: boolean;
			message?: string;
		}
	): [StructError, undefined] | [undefined, T];
	/**
	 * A `Context` contains information about the current location of the
	 * validation inside the initial input value.
	 */
	export type Context = {
		branch: Array<any>;
		path: Array<any>;
	};
	/**
	 * A type utility to extract the type from a `Struct` class.
	 */
	export type Infer<T extends Struct<any, any>> = T["TYPE"];
	/**
	 * A type utility to describe that a struct represents a TypeScript type.
	 */
	export type Describe<T> = Struct<T, StructSchema<T>>;
	/**
	 * A `Result` is returned from validation functions.
	 */
	export type Result =
		| boolean
		| string
		| Partial<Failure>
		| Iterable<boolean | string | Partial<Failure>>;
	/**
	 * A `Coercer` takes an unknown value and optionally coerces it.
	 */
	export type Coercer<T = unknown> = (value: T, context: Context) => unknown;
	/**
	 * A `Validator` takes an unknown value and validates it.
	 */
	export type Validator = (value: unknown, context: Context) => Result;
	/**
	 * A `Refiner` takes a value of a known type and validates it against a further
	 * constraint.
	 */
	export type Refiner<T> = (value: T, context: Context) => Result;

	/** coercions.js **/

	/**
	 * Augment a `Struct` to add an additional coercion step to its input.
	 *
	 * This allows you to transform input data before validating it, to increase the
	 * likelihood that it passes validation—for example for default values, parsing
	 * different formats, etc.
	 *
	 * Note: You must use `create(value, Struct)` on the value to have the coercion
	 * take effect! Using simply `assert()` or `is()` will not use coercion.
	 */
	export function coerce<T, S, C>(
		struct: Struct<T, S>,
		condition: Struct<C, any>,
		coercer: Coercer<C>
	): Struct<T, S>;
	/**
	 * Augment a struct to replace `undefined` values with a default.
	 *
	 * Note: You must use `create(value, Struct)` on the value to have the coercion
	 * take effect! Using simply `assert()` or `is()` will not use coercion.
	 */
	export function defaulted<T, S>(
		struct: Struct<T, S>,
		fallback: any,
		options?: {
			strict?: boolean;
		}
	): Struct<T, S>;
	/**
	 * Augment a struct to trim string inputs.
	 *
	 * Note: You must use `create(value, Struct)` on the value to have the coercion
	 * take effect! Using simply `assert()` or `is()` will not use coercion.
	 */
	export function trimmed<T, S>(struct: Struct<T, S>): Struct<T, S>;

	/** refinements.js **/

	/**
	 * Ensure that a string, array, map, or set is empty.
	 */
	export function empty<T extends string | any[] | Map<any, any> | Set<any>, S extends any>(
		struct: Struct<T, S>
	): Struct<T, S>;
	/**
	 * Ensure that a number or date is below a threshold.
	 */
	export function max<T extends number | Date, S extends any>(
		struct: Struct<T, S>,
		threshold: T,
		options?: {
			exclusive?: boolean;
		}
	): Struct<T, S>;
	/**
	 * Ensure that a number or date is above a threshold.
	 */
	export function min<T extends number | Date, S extends any>(
		struct: Struct<T, S>,
		threshold: T,
		options?: {
			exclusive?: boolean;
		}
	): Struct<T, S>;
	/**
	 * Ensure that a string, array, map or set is not empty.
	 */
	export function nonempty<T extends string | any[] | Map<any, any> | Set<any>, S extends any>(
		struct: Struct<T, S>
	): Struct<T, S>;
	/**
	 * Ensure that a string matches a regular expression.
	 */
	export function pattern<T extends string, S extends any>(
		struct: Struct<T, S>,
		regexp: RegExp
	): Struct<T, S>;
	/**
	 * Ensure that a string, array, number, date, map, or set has a size (or length, or time) between `min` and `max`.
	 */
	export function size<
		T extends string | number | Date | any[] | Map<any, any> | Set<any>,
		S extends any
	>(struct: Struct<T, S>, min: number, max?: number): Struct<T, S>;
	/**
	 * Augment a `Struct` to add an additional refinement to the validation.
	 *
	 * The refiner function is guaranteed to receive a value of the struct's type,
	 * because the struct's existing validation will already have passed. This
	 * allows you to layer additional validation on top of existing structs.
	 */
	export function refine<T, S>(
		struct: Struct<T, S>,
		name: string,
		refiner: Refiner<T>
	): Struct<T, S>;

	/** types.js **/

	/**
	 * Ensure that any value passes validation.
	 */
	export function any(): Struct<any, null>;
	/**
	 * Ensure that a value is an array and that its elements are of a specific type.
	 *
	 * Note: If you omit the element struct, the arrays elements will not be
	 * iterated at all. This can be helpful for cases where performance is critical,
	 * and it is preferred to using `array(any())`.
	 */
	export function array<T extends Struct<any>>(Element: T): Struct<Infer<T>[], T>;
	export function array(): Struct<unknown[], undefined>;
	/**
	 * Ensure that a value is a bigint.
	 */
	export function bigint(): Struct<bigint, null>;
	/**
	 * Ensure that a value is a boolean.
	 */
	export function boolean(): Struct<boolean, null>;
	/**
	 * Ensure that a value is a valid `Date`.
	 *
	 * Note: this also ensures that the value is *not* an invalid `Date` object,
	 * which can occur when parsing a date fails but still returns a `Date`.
	 */
	export function date(): Struct<Date, null>;
	/**
	 * Ensure that a value is one of a set of potential values.
	 *
	 * Note: after creating the struct, you can access the definition of the
	 * potential values as `struct.schema`.
	 */
	export function enums<U extends number, T extends readonly U[]>(
		values: T
	): Struct<
		T[number],
		{
			[K in T[number]]: K;
		}
	>;
	export function enums<U extends string, T extends readonly U[]>(
		values: T
	): Struct<
		T[number],
		{
			[K in T[number]]: K;
		}
	>;
	/**
	 * Ensure that a value is a function.
	 */
	export function func(): Struct<Function, null>;
	/**
	 * Ensure that a value is an instance of a specific class.
	 */
	export function instance<
		T extends {
			new (...args: any): any;
		}
	>(Class: T): Struct<InstanceType<T>, null>;
	/**
	 * Ensure that a value is an integer.
	 */
	export function integer(): Struct<number, null>;
	/**
	 * Ensure that a value matches all of a set of types.
	 */
	export function intersection<A extends AnyStruct, B extends AnyStruct[]>(
		Structs: [A, ...B]
	): Struct<Infer<A> & UnionToIntersection<InferStructTuple<B>[number]>, null>;
	/**
	 * Ensure that a value is an exact value, using `===` for comparison.
	 */
	export function literal<T extends boolean>(constant: T): Struct<T, T>;
	export function literal<T extends number>(constant: T): Struct<T, T>;
	export function literal<T extends string>(constant: T): Struct<T, T>;
	export function literal<T>(constant: T): Struct<T, null>;
	/**
	 * Ensure that a value is a `Map` object, and that its keys and values are of
	 * specific types.
	 */
	export function map(): Struct<Map<unknown, unknown>, null>;
	export function map<K, V>(Key: Struct<K>, Value: Struct<V>): Struct<Map<K, V>, null>;
	/**
	 * Ensure that no value ever passes validation.
	 */
	export function never(): Struct<never, null>;
	/**
	 * Augment an existing struct to allow `null` values.
	 */
	export function nullable<T, S>(struct: Struct<T, S>): Struct<T | null, S>;
	/**
	 * Ensure that a value is a number.
	 */
	export function number(): Struct<number, null>;
	/**
	 * Ensure that a value is an object, that is has a known set of properties,
	 * and that its properties are of specific types.
	 *
	 * Note: Unrecognized properties will fail validation.
	 */
	export function object(): Struct<Record<string, unknown>, null>;
	export function object<S extends ObjectSchema>(schema: S): Struct<ObjectType<S>, S>;
	/**
	 * Augment a struct to allow `undefined` values.
	 */
	export function optional<T, S>(struct: Struct<T, S>): Struct<T | undefined, S>;
	/**
	 * Ensure that a value is an object with keys and values of specific types, but
	 * without ensuring any specific shape of properties.
	 *
	 * Like TypeScript's `Record` utility.
	 */
	export function record<K extends string, V>(
		Key: Struct<K>,
		Value: Struct<V>
	): Struct<Record<K, V>, null>;
	/**
	 * Ensure that a value is a `RegExp`.
	 *
	 * Note: this does not test the value against the regular expression! For that
	 * you need to use the `pattern()` refinement.
	 */
	export function regexp(): Struct<RegExp, null>;
	/**
	 * Ensure that a value is a `Set` object, and that its elements are of a
	 * specific type.
	 */
	export function set(): Struct<Set<unknown>, null>;
	export function set<T>(Element: Struct<T>): Struct<Set<T>, null>;
	/**
	 * Ensure that a value is a string.
	 */
	export function string(): Struct<string, null>;
	/**
	 * Ensure that a value is a tuple of a specific length, and that each of its
	 * elements is of a specific type.
	 */
	export function tuple<A extends AnyStruct, B extends AnyStruct[]>(
		Structs: [A, ...B]
	): Struct<[Infer<A>, ...InferStructTuple<B>], null>;
	/**
	 * Ensure that a value has a set of known properties of specific types.
	 *
	 * Note: Unrecognized properties are allowed and untouched. This is similar to
	 * how TypeScript's structural typing works.
	 */
	export function type<S extends ObjectSchema>(schema: S): Struct<ObjectType<S>, S>;
	/**
	 * Ensure that a value matches one of a set of types.
	 */
	export function union<A extends AnyStruct, B extends AnyStruct[]>(
		Structs: [A, ...B]
	): Struct<Infer<A> | InferStructTuple<B>[number], null>;
	/**
	 * Ensure that any value passes validation, without widening its type to `any`.
	 */
	export function unknown(): Struct<unknown, null>;

	/** utilities.js **/

	/**
	 * Create a new struct that combines the properties properties from multiple
	 * object or type structs. Its return type will match the first parameter's type.
	 *
	 * Like JavaScript's `Object.assign` utility.
	 */
	export function assign<A extends ObjectSchema, B extends ObjectSchema>(
		A: Struct<ObjectType<A>, A>,
		B: Struct<ObjectType<B>, B>
	): Struct<ObjectType<Assign<A, B>>, Assign<A, B>>;
	export function assign<A extends ObjectSchema, B extends ObjectSchema, C extends ObjectSchema>(
		A: Struct<ObjectType<A>, A>,
		B: Struct<ObjectType<B>, B>,
		C: Struct<ObjectType<C>, C>
	): Struct<ObjectType<Assign<Assign<A, B>, C>>, Assign<Assign<A, B>, C>>;
	export function assign<
		A extends ObjectSchema,
		B extends ObjectSchema,
		C extends ObjectSchema,
		D extends ObjectSchema
	>(
		A: Struct<ObjectType<A>, A>,
		B: Struct<ObjectType<B>, B>,
		C: Struct<ObjectType<C>, C>,
		D: Struct<ObjectType<D>, D>
	): Struct<ObjectType<Assign<Assign<Assign<A, B>, C>, D>>, Assign<Assign<Assign<A, B>, C>, D>>;
	export function assign<
		A extends ObjectSchema,
		B extends ObjectSchema,
		C extends ObjectSchema,
		D extends ObjectSchema,
		E extends ObjectSchema
	>(
		A: Struct<ObjectType<A>, A>,
		B: Struct<ObjectType<B>, B>,
		C: Struct<ObjectType<C>, C>,
		D: Struct<ObjectType<D>, D>,
		E: Struct<ObjectType<E>, E>
	): Struct<
		ObjectType<Assign<Assign<Assign<Assign<A, B>, C>, D>, E>>,
		Assign<Assign<Assign<Assign<A, B>, C>, D>, E>
	>;
	/**
	 * Define a new struct type with a custom validation function.
	 */
	export function define<T>(name: string, validator: Validator): Struct<T, null>;
	/**
	 * Create a new struct based on an existing struct, but the value is allowed to
	 * be `undefined`. `log` will be called if the value is not `undefined`.
	 */
	export function deprecated<T>(
		struct: Struct<T>,
		log: (value: unknown, ctx: Context) => void
	): Struct<T>;
	/**
	 * Create a struct with dynamic validation logic.
	 *
	 * The callback will receive the value currently being validated, and must
	 * return a struct object to validate it with. This can be useful to model
	 * validation logic that changes based on its input.
	 */
	export function dynamic<T>(fn: (value: unknown, ctx: Context) => Struct<T, any>): Struct<T, null>;
	/**
	 * Create a struct with lazily evaluated validation logic.
	 *
	 * The first time validation is run with the struct, the callback will be called
	 * and must return a struct object to use. This is useful for cases where you
	 * want to have self-referential structs for nested data structures to avoid a
	 * circular definition problem.
	 */
	export function lazy<T>(fn: () => Struct<T, any>): Struct<T, null>;
	/**
	 * Create a new struct based on an existing object struct, but excluding
	 * specific properties.
	 *
	 * Like TypeScript's `Omit` utility.
	 */
	export function omit<S extends ObjectSchema, K extends keyof S>(
		struct: Struct<ObjectType<S>, S>,
		keys: K[]
	): Struct<ObjectType<Omit<S, K>>, Omit<S, K>>;
	/**
	 * Create a new struct based on an existing object struct, but with all of its
	 * properties allowed to be `undefined`.
	 *
	 * Like TypeScript's `Partial` utility.
	 */
	export function partial<S extends ObjectSchema>(
		struct: Struct<ObjectType<S>, S> | S
	): Struct<ObjectType<PartialObjectSchema<S>>, PartialObjectSchema<S>>;
	/**
	 * Create a new struct based on an existing object struct, but only including
	 * specific properties.
	 *
	 * Like TypeScript's `Pick` utility.
	 */
	export function pick<S extends ObjectSchema, K extends keyof S>(
		struct: Struct<ObjectType<S>, S>,
		keys: K[]
	): Struct<ObjectType<Pick<S, K>>, Pick<S, K>>;
	/**
	 * Define a new struct type with a custom validation function.
	 *
	 * @deprecated This function has been renamed to `define`.
	 */
	export function struct<T>(name: string, validator: Validator): Struct<T, null>;
}
