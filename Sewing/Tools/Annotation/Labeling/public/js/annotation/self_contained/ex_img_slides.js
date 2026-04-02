{
    document.getElementById("ex_img_back_btn").addEventListener("click", () => {
        const ex_img_wrapper = document.getElementsByClassName("_hu_navigator_img_wrapper");
        for (let i = 0; i < ex_img_wrapper.length; i++){ 
            if (!ex_img_wrapper[i].classList.contains("hidden")){
                activate_ex_img_wrapper(ex_img_wrapper[(i - 1 + ex_img_wrapper.length) % ex_img_wrapper.length]);
                return;
            }
        }
    });

    document.getElementById("ex_img_forward_btn").addEventListener("click", () => {
        const ex_img_wrapper = document.getElementsByClassName("_hu_navigator_img_wrapper");
        for (let i = 0; i < ex_img_wrapper.length; i++){ 
            if (!ex_img_wrapper[i].classList.contains("hidden")){
                activate_ex_img_wrapper(ex_img_wrapper[(i + 1) % ex_img_wrapper.length]);
                return;
            }
        }
    });

    function activate_ex_img_wrapper(to_activate){
        const ex_img_wrapper = document.getElementsByClassName("_hu_navigator_img_wrapper");
        for (let i = 0; i < ex_img_wrapper.length; i++){ 
            ex_img_wrapper[i].classList.add("hidden");
        }
        to_activate.classList.remove("hidden");
        to_activate.querySelector("img").resize_lines();
        document.getElementById("slide_title").textContent = to_activate.getAttribute("data-title");
    }
}

