const ARG_GET = "get";
const ARG_SET = "set";

export default async function config(
  params: string[],
  storage: Record<string, unknown>
): Promise<string> {
  if (params.length < 1) {
    return `Invalid command structure. Expected either '${ARG_GET}' or '${ARG_SET}'`;
  }

  let result: string;
  const getOrSet = params[0].toLowerCase() as typeof ARG_GET | typeof ARG_SET;

  switch (getOrSet) {
    case ARG_GET:
      // Get stuff
      console.log("Received 'config get' command.");
      result = "This command will get stuff. Stay tuned!";
      break;

    case ARG_SET:
      // Set stuff
      console.log("Received 'config set' command.");
      result = "This command will set stuff. Stay tuned!";
      break;

    default:
      console.log("Received invalid config command.");
      result = `Invalid command argument. Expected either '${ARG_GET}' or '${ARG_SET}'`;
  }

  return result;
}
