export default function triangle_data(triangle) {
    const { SSA = true, ...inputTriangle } = triangle;

    // Convert all input keys to lowercase
    const normalizedTriangle = {};
    for (const key in inputTriangle) {
        normalizedTriangle[key.toLowerCase()] = inputTriangle[key];
    }

    const { a, b, c, alpha, beta, gamma } = triangle;
    
    // Check if we have at least three properties defined
    const providedValues = [a, b, c, alpha, beta, gamma].filter(val => val !== undefined);
    if (providedValues.length < 3) {
        throw new Error("At least three attributes of the triangle must be provided");
    }
    
    // Convert input to mutable variables
    let A = a, B = b, C = c;
    let Alpha = alpha, Beta = beta, Gamma = gamma;
    
    // Handle SSA case
    {
        // Collect known sides and angles
        const sides = { a: A, b: B, c: C };
        const angles = { alpha: Alpha, beta: Beta, gamma: Gamma };

        // Count number of known sides and angles
        const knownSides = Object.keys(sides).filter(k => sides[k] !== undefined);
        const knownAngles = Object.keys(angles).filter(k => angles[k] !== undefined);

        if (knownSides.length === 2 && knownAngles.length === 1) {
            // Check if the known angle is opposite one of the known sides
            const angleKey = knownAngles[0]; // Only one known angle
            const sideKeyOppositeAngle = angleKey === 'alpha' ? 'a' : angleKey === 'beta' ? 'b' : 'c';
            const sideOppositeAngle = sides[sideKeyOppositeAngle];
            if (sideOppositeAngle !== undefined) {
                // We have the SSA case
                // Proceed to calculate the unknown angle opposite the other known side
                const knownAngleValue = angles[angleKey];
                const knownSideOppositeAngle = sides[sideKeyOppositeAngle];

                // The other known side
                const otherSideKey = knownSides.find(k => k !== sideKeyOppositeAngle);
                const otherSideValue = sides[otherSideKey];

                // Calculate ratio
                const ratio = (otherSideValue * Math.sin(knownAngleValue)) / knownSideOppositeAngle;
                if (ratio < -1 || ratio > 1) {
                    throw new Error("Invalid triangle: cannot compute angle");
                }

                const anglePossible1 = Math.asin(ratio);
                const anglePossible2 = Math.PI - anglePossible1;

                const possibleAngles = [anglePossible1, anglePossible2].filter(a => a > 0 && a < Math.PI);

                if (possibleAngles.length === 0) {
                    throw new Error("No valid triangle can be formed with the given sides and angle.");
                }

                // Default to shorter side (smaller angle) unless SSA is set to false
                const useShorter = triangle.SSA !== false;
                const selectedAngle = useShorter ? Math.min(...possibleAngles) : Math.max(...possibleAngles);

                // Assign the unknown angle
                angles[otherSideKey === 'a' ? 'alpha' : otherSideKey === 'b' ? 'beta' : 'gamma'] = selectedAngle;

                // Now compute the third angle
                const thirdAngleKey = ['alpha', 'beta', 'gamma'].find(k => angles[k] === undefined);
                angles[thirdAngleKey] = Math.PI - knownAngleValue - selectedAngle;

                // Update angles
                Alpha = angles.alpha;
                Beta = angles.beta;
                Gamma = angles.gamma;

                // Now compute the third side using Law of Sines
                const thirdSideKey = ['a', 'b', 'c'].find(k => sides[k] === undefined);
                const thirdSideOppositeAngle = angles[thirdSideKey === 'a' ? 'alpha' : thirdSideKey === 'b' ? 'beta' : 'gamma'];
                sides[thirdSideKey] = (knownSideOppositeAngle * Math.sin(thirdSideOppositeAngle)) / Math.sin(knownAngleValue);

                // Update sides
                A = sides.a;
                B = sides.b;
                C = sides.c;
            }
        }
    }
    
    // If only angles are provided, set 'a' to 1
    if ((A === undefined && B === undefined && C === undefined) && (Alpha !== undefined || Beta !== undefined || Gamma !== undefined)) {
        A = 1;
    }
    
    // Calculate the third angle if two are provided
    const angles = { alpha: Alpha, beta: Beta, gamma: Gamma };
    const angleKeys = Object.keys(angles).filter(k => angles[k] !== undefined);
    if (angleKeys.length === 2) {
        const missingAngleKey = ['alpha', 'beta', 'gamma'].find(k => angles[k] === undefined);
        angles[missingAngleKey] = Math.PI - angles[angleKeys[0]] - angles[angleKeys[1]];
        if (angles[missingAngleKey] <= 0.000001) {
            throw new Error("Invalid triangle: angle sum exceeds π radians");
        }
    }
    Alpha = angles.alpha;
    Beta = angles.beta;
    Gamma = angles.gamma;
    
    // Use Law of Sines and Cosines to solve for missing sides and angles
    // We'll attempt to solve using all possible methods in a loop until all values are filled or no progress can be made
    let changed;
    do {
        changed = false;
        
        // Reconstruct sides and angles objects for this iteration
        const sides = { a: A, b: B, c: C };
        const angles = { alpha: Alpha, beta: Beta, gamma: Gamma };
        
        // Law of Sines - compute missing sides
        for (const sideKey of ['a', 'b', 'c']) {
            const angleKey = sideKey === 'a' ? 'alpha' : sideKey === 'b' ? 'beta' : 'gamma';
            if (sides[sideKey] === undefined && angles[angleKey] !== undefined) {
                // Find a known side and its opposite angle
                const known = ['a', 'b', 'c'].find(k => sides[k] !== undefined && angles[k === 'a' ? 'alpha' : k === 'b' ? 'beta' : 'gamma'] !== undefined);
                if (known) {
                    const knownAngleKey = known === 'a' ? 'alpha' : known === 'b' ? 'beta' : 'gamma';
                    sides[sideKey] = sides[known] * Math.sin(angles[angleKey]) / Math.sin(angles[knownAngleKey]);
                    changed = true;
                    A = sides.a; B = sides.b; C = sides.c;
                }
            }
        }
        
        // Law of Sines - compute missing angles
        for (const angleKey of ['alpha', 'beta', 'gamma']) {
            const sideKey = angleKey === 'alpha' ? 'a' : angleKey === 'beta' ? 'b' : 'c';
            if (angles[angleKey] === undefined && sides[sideKey] !== undefined) {
                // Find a known side and its opposite angle
                const known = ['a', 'b', 'c'].find(k => sides[k] !== undefined && angles[k === 'a' ? 'alpha' : k === 'b' ? 'beta' : 'gamma'] !== undefined);
                if (known) {
                    const knownAngleKey = known === 'a' ? 'alpha' : known === 'b' ? 'beta' : 'gamma';
                    const ratio = (sides[sideKey] * Math.sin(angles[knownAngleKey])) / sides[known];
                    
                    // Check for ambiguous case
                    if (ratio > 1 || ratio < -1) {
                        throw new Error(`Invalid triangle: cannot compute angle ${angleKey}`);
                    }
                    
                    const anglePossible1 = Math.asin(ratio);
                    const anglePossible2 = Math.PI - anglePossible1;
                    
                    // Try both possibilities
                    const possibleAngles = [anglePossible1, anglePossible2].filter(a => a > 0 && a < Math.PI);
                    for (const possibleAngle of possibleAngles) {
                        const sumAngles = (Alpha || 0) + (Beta || 0) + (Gamma || 0) + possibleAngle;
                        if (sumAngles <= Math.PI + 1e-10) {
                            angles[angleKey] = possibleAngle;
                            changed = true;
                            Alpha = angles.alpha; Beta = angles.beta; Gamma = angles.gamma;
                            break; // Stop after first valid angle
                        }
                    }
                }
            }
        }
        
        // Law of Cosines - compute missing sides
        if (A !== undefined && B !== undefined && C === undefined && Gamma !== undefined) {
            C = Math.sqrt(A**2 + B**2 - 2*A*B*Math.cos(Gamma));
            changed = true;
        }
        if (A !== undefined && C !== undefined && B === undefined && Beta !== undefined) {
            B = Math.sqrt(A**2 + C**2 - 2*A*C*Math.cos(Beta));
            changed = true;
        }
        if (B !== undefined && C !== undefined && A === undefined && Alpha !== undefined) {
            A = Math.sqrt(B**2 + C**2 - 2*B*C*Math.cos(Alpha));
            changed = true;
        }
        
        // Law of Cosines - compute missing angles
        if (A !== undefined && B !== undefined && C !== undefined) {
            if (Alpha === undefined) {
                Alpha = Math.acos((B**2 + C**2 - A**2) / (2*B*C));
                changed = true;
            }
            if (Beta === undefined) {
                Beta = Math.acos((A**2 + C**2 - B**2) / (2*A*C));
                changed = true;
            }
            if (Gamma === undefined) {
                Gamma = Math.acos((A**2 + B**2 - C**2) / (2*A*B));
                changed = true;
            }
        }

        // Angle Sum
        const anglesList = { alpha: Alpha, beta: Beta, gamma: Gamma };
        const knownAngles = Object.keys(anglesList).filter(k => anglesList[k] !== undefined);
        if (knownAngles.length === 2) {
            const missingAngleKey = ['alpha', 'beta', 'gamma'].find(k => anglesList[k] === undefined);
            const angleSum = (anglesList.alpha || 0) + (anglesList.beta || 0) + (anglesList.gamma || 0);
            anglesList[missingAngleKey] = Math.PI - angleSum;
            if (anglesList[missingAngleKey] <= 0) {
                throw new Error("Invalid triangle: angle sum exceeds π radians");
            }
            Alpha = anglesList.alpha;
            Beta = anglesList.beta;
            Gamma = anglesList.gamma;
            changed = true;
        }
    } while (changed);
    
    // Validate the triangle
    const angleSum = (Alpha || 0) + (Beta || 0) + (Gamma || 0);
    if (Math.abs(angleSum - Math.PI) > 1e-5) {
        throw new Error("Invalid triangle: angles do not sum up to π radians");
    }
    
    // Return the completed triangle
    return {
        a: A,
        b: B,
        c: C,
        alpha: Alpha,
        beta: Beta,
        gamma: Gamma
    };
}