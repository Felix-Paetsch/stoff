class ImgJoint{
    constructor(project_joint, img){
        this.project_joint = project_joint;
        this.el        = null;
        this.img       = img;
        this.canvas    = this.img.canvas;
        this.scale_val = 1;
        
        this.img_points = img.possible_keypoints.filter(p => 
            [String(project_joint.point_id), String(project_joint.connected_point_id)].includes(p.id)
        ).map(p => p.img_point);
    }

    remove(){
        if (this.el){
            this.el.parentNode.removeChild(this.el);
            this.el = null;
        }
    }

    create_and_format_own_element(){
        this.remove();
        // const aspect_ratio = this.canvas.previousElementSibling.width / this.canvas.previousElementSibling.height;

        let [x1, y1, x2, y2] = [
            this.img_points[0].point_obj.widthPercent, this.img_points[0].point_obj.heightPercent,
            this.img_points[1].point_obj.widthPercent, this.img_points[1].point_obj.heightPercent
        ];

        this.el = document.createElement('div');
        this.canvas.appendChild(this.el);

        // Set line styles
        this.el.style.position = 'absolute';
        this.el.style.height = length + 'px';

        this.el.style.left = `calc(${ Math.min(x1, x2) }% - 0px)`;
        this.el.style.top = `calc(${  Math.min(y1, y2) }% - 0px)`;
        this.el.style.width = `calc(${   Math.abs(x1 - x2) }% - 0px)`;
        this.el.style.height = `calc(${  Math.abs(y1 - y2) }% - 0px)`;

        
        const line = document.createElement('div');
        this.el.appendChild(line);
        this.el.classList.add("canvas_line")
        line.style.background = "black";
        line.style.height = `calc(.1rem * ${ this.scale_val })`;
        line.style.borderRadius = "5rem";

        const resizeObserver = new ResizeObserver(entries => {
            for (let _ of entries) {
                if (this.el == null){
                    return;
                }

                const rect = this.el.getBoundingClientRect();
                const diagonal = Math.sqrt(rect.width ** 2 + rect.height ** 2) * this.scale_val;
                const angle = Math.atan2(rect.height, rect.width) * (180 / Math.PI);

                // Apply styles to the line
                line.style.position = 'absolute';
                line.style.width = `${diagonal}px`;
                line.style.top = `calc(0.05rem * ${ this.scale_val })`;
                line.style.left = '0';
                line.style.transformOrigin = '0 0';
                line.style.transform = `rotate(${angle}deg)`;
            }
        });

        if ((x1 - x2)*(y1 - y2) < 0){
            this.el.style.transform = "scaleX(-1)"
        }

        resizeObserver.observe(this.el);

        this.el.style.zIndex = '5';
        this.el.style.pointerEvents = 'none';

        if (!this.canvas){ throw new Error("joint canvas is not defined!"); }
        this.canvas.appendChild(this.el);
        return this.el;
    }

    scale(val){
        this.scale_val = val;
        if (this.el){
            this.el.firstElementChild.style.height = `calc(.1rem * ${ this.scale_val })`;
        }
    }

    render(){
        if (!this.img_points[0].position_in_img_set() || !this.img_points[1].position_in_img_set()){
            this.remove();
            return;
        };
        
        return this.create_and_format_own_element();
    }
}