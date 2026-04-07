import init, { add } from "./rust/pkg/stoff_rust.js";

await init();

console.log(add(3, 2));
