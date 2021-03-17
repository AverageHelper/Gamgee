export default function assertUnreachable(x: never): never {
  throw new Error(`Unexpected value ${JSON.stringify(x)}`);
}
