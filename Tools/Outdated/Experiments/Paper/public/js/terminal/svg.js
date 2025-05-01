class SVG{
    constructor(svg) {
        if (typeof svg == "string"){
            this.svg_el = document.querySelector(svg);
        } else {
            this.svg_el = svg;
        }
    }

    clear(){
        this.svg_el.innerHTML = "";
    }

    sort_z() {
        const elements = Array.from(this.svg_el.children); // !Performance?
        elements.sort((a, b) => {
          const zA = parseInt(a.getAttribute('z') || '0');
          const zB = parseInt(b.getAttribute('z') || '0');
          return zA - zB;
        });
    
        elements.forEach(element => {
          this.svg_el.appendChild(element);
        });
    }

    add_dom_elements(de, id = null){
        for (let e of de){
            e.setAttribute('_id', id === null ? "null" : id);
            this.svg_el.appendChild(e);
        }
        this.sort_z();
    }

    add_dom_element(de, id = null){
        de.setAttribute('_id', id === null ? "null" : id);
        this.svg_el.appendChild(de);
        this.sort_z();
    }

    remove_dom_element(de){
        this.svg_el.removeChild(de);
    }

    remove_dom_elements(arr){
        for (let e of arr){
            this.svg_el.removeChild(e);
        }
    }

    remove_by_id(id){
        const els = Array.from(this.svg_el.children);  // !Performance?
        els.forEach(e => {
            if (e.getAttribute("_id") == id){
                e.parentElement.removeChild(e);
            }
        })
    }

    addEventListener(...options){
        this.svg_el.addEventListener(...options);
    }
}