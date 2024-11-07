class PatternCanvas{
  constructor(){
      this.data = data;
  }

  render(){}
  serialize(){}
}

PatternCanvas.prototype.test = function () { console.log("test", this) };
let c = new PatternCanvas();
c.test();

// Das ist auch interessant um Methoden zu überschreiben und insbesondere sie zu erweitern:

const old_test = PatternCanvas.prototype.test;
PatternCanvas.prototype.test = function (){
  console.log("Hi");
   old_test();
}

c = new PatternCanvas(); // Könnte sogar überflüssig sein
c.test();

//----

class PatternCanvas{
  constructor(){
      this.data = data;
  }

  render(){}
  serialize(){}
}

const c = new PatternCanvas();

// Decorator Pattern using a class
function add_random_functionality(canvas, data){
    const tracker = 0;
    canvas.func = function() {
        tracker++;
        console.log(tracker);
        console.log(this);
        return data;
    }
}

add_random_functionality(c, "Hi");
c.func();


// ----

class BasicData{
  const data;

  constructor(){
    this.data = data;
  }

  get_data(){
    return this.data;
  }
}
