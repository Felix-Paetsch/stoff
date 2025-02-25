export default (Class, set_if_not_exists) => {
    set_if_not_exists(Class, "remove", function(){
        const els = this.get_sketch_elements();
        els.get_lines().forEach(l => l.remove());
        els.get_points().forEach(l => l.remove());
    });
}