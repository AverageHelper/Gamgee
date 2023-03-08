/* eslint-disable unicorn/filename-case */

// TODO: Make a PR to DefinitelyTyped or leaked-handles with this:
declare module "leaked-handles" {
	interface SetOptions {
		/**
		 * The number of milliseconds on the internal handle timeout.
		 * @default 5001
		 */
		timeout?: number;

		/**
		 * Whether to use full stack traces.
		 * @default false
		 */
		fullStack?: boolean;

		/**
		 * @default false
		 */
		debugErrors?: boolean;

		/**
		 * Whether to pretty-print TCP exceptions.
		 * @default false
		 */
		debugSockets?: boolean;
	}

	/**
	 * Set configuration options.
	 */
	export function set(opts: Readonly<SetOptions>): void;

	export function printHandles(): void;
}
