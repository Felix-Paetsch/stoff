export default class ObjData{

  constructor(design){
    if (design){
      this.design = design;
    } else {
      this.design = {
        'top designs': {
          type: 'without dart',
          position: 'waistline',
          styleline: 'panel',
          closed: false,
          dartstyle: 'normal',
          length: 0.9,
          ease: 8
        },
        neckline: { type: 'round' },
        sleeve: { type: 'straight', length: 0.5 }
      };
    }
  }


  set_type(type){
    this.design["top designs"].type = type;
  };


  // Side wird an manchen stellen verwendet.
  // bezieht sich direkt auf die Namen von Linien!!!
  set_side(type, position){
    this.design["top designs"].side = type;
    this.design["top designs"].percent = position;
  };

  set_styleline(type){
    this.design["top designs"].styleline = type;
  };

  set_closed(bool){
    this.design["top designs"].closed = bool;
  };

  set_dartstyle(type){
    this.design["top designs"].dartstyle = type;
  };

  set_ease(width){
    this.design["top designs"].ease = width;
  };

  set_length(len){
    this.design["top designs"].length = len;
  };

  set_neckline(type){
    this.design["neckline"].type = type;
  };

// Hoffnung ist, dass das unwichtig wird, sobald es nicht mehr standard
// Richtungen gibt
  set_position(type){
    this.design["top designs"].position = type;
  }


  get(key = null){
    if (!key) return this.design;
    return this.design[key];
  }


  set_styleline(first, second, firstpercent, secondpercent){
    this.design.side = first;
    this.design.percent = firstpercent;
    this.design.secondside = second;
    this.design.secondpercent = secondpercent;
  }


}
