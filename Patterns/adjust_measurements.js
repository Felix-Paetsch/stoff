export default function adjusted_measurements(mea, design_config){
    const measurements = {};
    Object.assign(measurements, mea);

    if (measurements.bust_width){
        let half = measurements.under_bust / 2;
        measurements.bust_width_front = measurements.bust_width - (half + 2);
        measurements.bust_width_back = measurements.bust_width - measurements.bust_width_front;
        measurements.waist_width_front = measurements.waist_width - (half - 5);
        measurements.waist_width_back = measurements.waist_width - measurements.waist_width_front;
        measurements.ratio = measurements.bust_width_front/measurements.bust_width_back;
    }

    measurements.belly += design_config["top designs"].ease;
    measurements.bottom_width_back += design_config["top designs"].ease / 2;
    measurements.bottom_width_front += design_config["top designs"].ease / 2;

    measurements["arm"] += 2;
    measurements["arm length"] += 4;
    measurements.wristwidth += 3;
    measurements["ellbow_width"] += 4;

    return measurements;
}