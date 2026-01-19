import { z } from "zod";

export const BaseMeasurementsSchema = z.object({
    over_bust_front: z.number(),
    over_bust_back: z.number(),
    belly_front: z.number(),

    shoulder_length: z.number(),
    shoulder_width: z.number(),
    bust_width: z.number(),
    under_bust: z.number(),
    bust_point_width: z.number(),
    bust_point_height: z.number(),
    shoulderblade_width: z.number(),
    shoulderblade_height: z.number(),
    waist_width: z.number(),
    waist_height: z.number(),
    shoulder_height_front: z.number(),
    shoulder_height_back: z.number(),
    center_height_front: z.number(),
    center_height_back: z.number(),
    across_front: z.number(),
    across_back: z.number(),
    diagonal_front: z.number(),
    diagonal_back: z.number(),
    side_height: z.number(),
    bottom_width_front: z.number(),
    bottom_width_back: z.number(),
    arm: z.number(),
    "arm length": z.number(),
    wristwidth: z.number(),
    ellbow_width: z.number(),
    ellbow_length: z.number(),
});

export type BaseMeasurements = z.infer<typeof BaseMeasurementsSchema>;
