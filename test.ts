import { declares, defineError, ensure, fault, match, trySync } from "./src";

interface Config {
  id: string;
}

// const NotFoundError = defineError("NotFound")
// const UnknownError = defineError("UnknownError")

// function getUser():User {
//     try {
//     const a =  ensure(user, NotFoundError, "Could not found user")
//     return a
//     } catch (error) {
//         throw match(error,[
//             NotFoundError,
//         ], {
//             NotFound: (err) => fault("AuthError","", {cause: err} ),
//             _ : (err) => fault(UnknownError,"", {cause: err} ),
//         })
//     }
// }

const ConfigError = defineError("ConfigError");

export const parseConfig = declares([ConfigError], (raw: string) => {
  const result = trySync<Config>(() => JSON.parse(raw));
  if (!result.ok) {
    // Rethrow as typed error — original error preserved as cause
    fault(ConfigError, "Invalid JSON config", { cause: result.error });
  }
  return result.data;
});

try {
  const a = parseConfig('{"asd":1}');
} catch (error) {
  error; //?
}
