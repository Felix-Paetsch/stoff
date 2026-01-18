import { Sewing } from "./Sewing/sewing";
import { Sketch } from "./StoffLib/sketch";

export type PatternFunction = (...args: any[]) => Sketch | Sewing
