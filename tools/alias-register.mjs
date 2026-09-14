// Enregistre le résolveur d'alias « @/… » avant de lancer un script tools/.
import { register } from "node:module";
register(new URL("./alias-loader.mjs", import.meta.url));
