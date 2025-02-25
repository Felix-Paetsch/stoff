export default function to_sewing_data(s){
    console.log(s.get_connected_components());
    return 
}

function validate_sewing_data(sketch, data){
    // Glue lines are adjacent

}

/*

    {
        "componets": [{
            "verticies": [
                [x,y]
            ],
            "edges": [
                {
                    "verticies": [0, 1],
                    "samples": [
                        [0,0], [1,0], [1,0]
                    ],
                    "edge_id": 1
                }
            ],
            "position": null // Do later, relative simulation position
        }],
        "glue": [
            [
                lineindex1,
                lineindex2,
                ...
            ],
            [
                lineindex1',
                lineindex2'
            ],
            true // orientation to glue together
        ]
    }

*/