import { createApp } from "./createApp.js";
import registry from "./registry.cloudflare.js";

export default createApp({ registry, compressResponses: false });
