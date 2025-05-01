var $ = jQuery.noConflict();

$(document).ready(function () {
    $(".l-menu-list-item").on("click", function () {
        $(".l-menu-list-item-menu-dropdown-wrapper").css("display", "none");

        setTimeout(function () {
            $(".l-menu-list-item-menu-dropdown-wrapper").css("display", "");
        }, 200);
    });

    $(".l-menu-list-item-menu-dropdown-list-item-version-history").on(
        "click",
        function () {
            $(".l-modal-wrapper").addClass("active");
        }
    );

    $(".l-modal-close, .btn-modal").on("click", function () {
        $(".l-modal-wrapper").removeClass("active");
    });

    $(".l-menu-list-item-instructions").on("click", function () {
        $("html, body").animate(
            {
                scrollTop: $(".l-instructions-wrapper").offset().top + 1,
            },
            1000
        );
    });

    $(".l-toolbar-keypoints").draggable({
        containment: "document", // "parent",
        cursor: "grab",
        stop: function () {
            const l =
                (100 / $(this).parent().outerWidth()) *
                    $(this).position().left +
                "%";
            const t =
                (100 / $(this).parent().outerHeight()) *
                    $(this).position().top +
                "%";
            $(this).css("left", l);
            $(this).css("top", t);
        },
    });

    $(".l-toolbar-navigation").draggable({
        containment: "document", // "parent",
        cursor: "grab",
        create: create_navigation,
        start: start_navigation,
        stop: function () {
            const l =
                (100 / $(this).parent().outerWidth()) *
                    $(this).position().left +
                "%";
            const t =
                (100 / $(this).parent().outerHeight()) *
                    $(this).position().bottom +
                "%";
            $(this).css("left", l);
            $(this).css("top", t);
        },
    });

    function create_navigation(e, ui) {
        $(this).css("top", $(".l-toolbar-keypoints").outerHeight() + 34);
    }

    function start_navigation(e, ui) {
        $(this).css("top", "");
    }

    $(".l-toolbar-frames").draggable({
        containment: "document", // "parent",
        cursor: "grab",
        create: create_frames,
        start: start_frames,
        stop: function () {
            const l =
                (100 / $(this).parent().outerWidth()) *
                    $(this).position().left +
                "%";
            const t =
                (100 / $(this).parent().outerHeight()) *
                    $(this).position().top +
                "%";
            $(this).css("left", l);
            $(this).css("top", t);
        },
    });

    function create_frames(e, ui) {
        $(this).css("right", "24px");
    }

    function start_frames(e, ui) {
        $(this).css("right", "");
    }

    $(".l-toolbar").on("mousedown", function () {
        $(".l-toolbar").removeClass("active");
        $(this).addClass("active");
    });

    /*------------------------------------*\

     swiper stage

    \*------------------------------------*/

    let activeZoomScale = 1;

    const swiper = new Swiper(".swiper-stage", {
        centeredSlides: true,
        slidesPerView: 1,
        speed: 0,
        /* zoom: {
            minRatio: 1,
            maxRatio: activeZoomScale,
        },*/
        allowTouchMove: false,
        loadPrevNextAmount: 10,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        scrollbar: {
            el: ".swiper-scrollbar",
            draggable: true,
            dragSize: 21,
        },
        effect: "fade",
    });

    let activeSlide = swiper.activeIndex + 1;
    $(".l-stage-controller-bar-text").text(
        "Frame: " + activeSlide + " of " + swiper.slides.length
    );

    // nonlocal !!
    swiper_objects.swiper_stage = swiper;

    swiper.on("slideChange", function () {
        let activeSlide = swiper.activeIndex + 1;
        $(".l-stage-controller-bar-text").text(
            "Frame: " + activeSlide + " of " + swiper.slides.length
        );
    });

    swiper.on("beforeSlideChangeStart", function (e) {
        swiper.zoom.out();
        $(".swiper-slide").css("opacity", "0");
        $(".l-toolbar-tools-item-move").removeClass("active");
    });

    swiper.on("scrollbarDragStart", function (e) {
        swiper.zoom.out();
        $(".swiper-slide").css("opacity", "0");
    });

    /*------------------------------------*\

     swiper navigator

    \*------------------------------------*/

    const swiper_navigator = new Swiper(".swiper-navigator", {
        centeredSlides: true,
        slidesPerView: 1,
        speed: 0,
        loop: true,
        navigation: {
            nextEl: ".swiper-navigator-button-next",
            prevEl: ".swiper-navigator-button-prev",
        },
        effect: "fade",
    });

    let slide_title = $(".swiper-slide-navigator.swiper-slide-active").data(
        "swiper-slide-title"
    );
    $(".swiper-navigator-list-item-title").text(slide_title);

    swiper_navigator.on("slideNextTransitionEnd", function () {
        let slide_title = $(".swiper-slide-navigator.swiper-slide-active").data(
            "swiper-slide-title"
        );
        $(".swiper-navigator-list-item-title").text(slide_title);
    });

    // nonlocal !!
    swiper_objects.swiper_navigator = swiper_navigator;

    /*------------------------------------*\

     toolbar accordion

    \*------------------------------------*/

    $(".l-toolbar-panel-accordion-arrow").on("click", function (e) {
        e.preventDefault();

        const toolbar_accordion = $(this).nextAll(".l-toolbar-panel-accordion");

        $(this).toggleClass("close");
        toolbar_accordion.toggleClass("close");

        if (toolbar_accordion.hasClass("close")) {
            toolbar_accordion.css({
                height: "0",
            });
        } else {
            toolbar_accordion.css("height", "");
        }
    });

    /*------------------------------------*\

     press esc key

    \*------------------------------------*/

    $(document).keydown(function (e) {
        if (e.keyCode === 27) {
        }

        if (e.keyCode === 187 || e.keyCode === 107) {
            zoomIn();
        }

        if (e.keyCode === 189 || e.keyCode === 109) {
            zoomOut();
        }
    });

    /*------------------------------------*\

        window resize
        http://stackoverflow.com/questions/1649086/detect-rotation-of-android-phone-in-the-browser-with-javascript

    \*------------------------------------*/

    const supportsOrientationChange = "onorientationchange" in window,
        orientationEvent = supportsOrientationChange
            ? "orientationchange"
            : "resize";
    window.addEventListener(orientationEvent, function () {});

    // trigger_h2d2_loaded();
    event_handler.emmit(new Action("h2d2_loaded"));
}); // end document ready

/*------------------------------------*\

    detect touch device
    http://ctrlq.org/code/19616-detect-touch-screen-javascript

\*------------------------------------*/

function isTouchDevice() {
    return (
        "ontouchstart" in window ||
        navigator.MaxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
    );
}

if (!isTouchDevice()) {
    document.documentElement.className += " no-touch";
} else {
    var touch = true;
}
