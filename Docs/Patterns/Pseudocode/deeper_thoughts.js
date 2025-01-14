class ShirtConstructor extends PatternConstructor{
    // or just shirt?
    constructor(mea){
        this.mea = mea;

        this.method_calls = [];
        this.stages = [
            new ConstructionStage(),
            new SingleSideStage(),
            new UnfoldedStage(),
            new FinishStage()
        ];
    }
}

/*
  This is really neat, as we can make smth like
*/

function ShirtConstructor2(mea){
    const pc = new PatternConstructor(mea);
    pc.add_stage(ConstructionStage, where_info);
    // ...
    return pc;
}

/*
  where these are modular!!
  then mainly the stages/phases would have to be coded (maybe their transitions)

  Also the ShirtConstructor would mainly have additional stuff related to shirts as a global thing.
*/

// We need a good state API!
class ConstructionStage extends PatternStage{
    constructor(constr){
        this.const = constr;
    }

    enter_stage(prev_stage){
        // Unfold & do stuff
    }

    exit_stage(){
        // Do whatever
    }

    neckline(type = "round"){
        // This method will be called after we entered the stage (before exit), if it was proxied on the shirt. 
    }
}

// Stages can be "super stages" wrapping other stages ~ constructing sleeves for ex.
/* Questions:
    How do stages communicate between each other (or rather only forward)
    How do deal with cases where stages co-evolve?
      I.e. I want to have one nice wrapper for doing sleeve stuff, but it intertwines with the other "main" stages
    => Basically want an acyclic graph of stages.. how to set this up easily? 
    implicit mode currently assumes there is one clear stage to advance.. => throw error if two stages reachable provide same method?
                                                                          => specify which component the method should come from?

    uUID belongs to StoffLib
    stages belong to patterns (same as sewing sketch...) although very complicated
*/
