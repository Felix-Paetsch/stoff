

import { ConfigComponent } from "./configComponent";
import { SketchesComponent } from "./sketchesComponent";
import { DesignInputData } from "../../App";
import { DesignRenderResult } from "src/lib/create_design_data";

type StoffStoffPageProps = {
    inputVisible: boolean,
    designInputData: DesignInputData,
    design: DesignRenderResult
}

export function MainPage({ inputVisible, designInputData, design }: StoffStoffPageProps) {
    return (
        <div className="shd__page">
            <div className="shd__main">

                {inputVisible ? (
                    <ConfigComponent
                        designInputData={designInputData}
                    />
                ) : null}

                <SketchesComponent design={design} />
            </div>
        </div>
    )
}
