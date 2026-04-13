var $ = jQuery.noConflict();

$( document ).ready( function() {

    /*------------------------------------*\

     button clicks

    \*------------------------------------*/

    $(".btn-start-annotating").on("click", function() {
        start_annotating_clicked();
    });

    $(".l-modal-btn-edit-save").on("click", function() {
        console.log('Save edit!')
        save_project_rename();
    });

    $(".l-modal-btn-new-project-save").on("click", function() {
        console.log('Save new project!')
        save_new_project();
    });

    $(".l-modal-btn-delete").on("click", function() {
        console.log('Delete!')
        delete_project();
    });

    /*------------------------------------*\

     start annotating input validation

    \*------------------------------------*/

    $( '.l-fb-panel-input-identifier' ).keyup(function(e) {

        let length = this.value.length;

        if (length < 3) {
            e.preventDefault();
            $( '.btn-start-annotating' ).addClass('disable');
        } else {
            e.preventDefault();
            $( '.btn-start-annotating' ).removeClass('disable');
        }
    });

    /*------------------------------------*\

     modal

    \*------------------------------------*/

    $(".btn-new-project").on( 'click', function () {
        $('.l-modal-wrapper, .l-modal-new-project').addClass('active');
    });

    $( '.l-fb-panel-edit-tool-adjust' ).on( 'click', function () {
        let project_name = $(this).data('project-name');
        let project_id = $(this).data('project-id');
        console.log('Adjust project: ' + project_name);
        console.log(project_id);
        window.location.href = CONF.abs_path("p/" + String(project_id));
    });

    $( '.l-fb-panel-edit-tool-edit' ).on( 'click', function () {
        let project_name = $(this).data('project-name');
        let project_id = $(this).data('project-id');
        $('.l-modal-wrapper, .l-modal-edit').addClass('active');
        $( '.l-modal-input' ).attr("data-project-name-reset", project_name);
        $( '.l-modal-input' ).attr("data-project-id", project_id);
        $( '.l-modal-input' ).attr("value", project_name);
        $( '.l-modal-input' ).val(project_name);
    });

    $( '.l-modal-close, .btn-modal' ).on( 'click', function () {
        closeModal();
    });

    $( '.l-modal-input' ).keyup(function(e) {

        let length = this.value.length,
            project_name_reset = $(this).data('project-name-reset');

            if (this.value !== project_name_reset) {
                $( '.l-modal-btn-discard' ).removeClass('disable');
                console.log( 'remove disable ' + this.value);
            } else {
                console.log( 'add disable ' + this.value);
                $( '.l-modal-btn-discard' ).addClass('disable');
            }

        if (length >= 51) {
            e.preventDefault();
            $(this).addClass('alert');
            $( '.l-modal-error' ).addClass('show');
            $( '.l-modal-btn-save' ).addClass('disable');
        } else {
            e.preventDefault();
            $(this).removeClass('alert');
            $( '.l-modal-error' ).removeClass('show');
            $( '.l-modal-btn-save' ).removeClass('disable');
        }
    });

    $( '.l-modal-btn-discard' ).on("click", function(e) {
        e.preventDefault();
        $( '.l-modal-input' ).val( $( '.l-modal-input' ).attr("data-project-name-reset") );
        $( '.l-modal-input' ).removeClass('alert');
        $( this ).addClass('disable');
        $( '.l-modal-error' ).removeClass('show');
        $( '.l-modal-btn-save' ).removeClass('disable');
    });

    $( '.l-fb-panel-edit-tool-delete' ).on( 'click', function () {
        let project_name = $(this).data('project-name');

        document.getElementById("delete_section").setAttribute("data-project-id", $(this).data('project-id'));
        $('.l-modal-wrapper, .l-modal-delete').addClass('active');
        $('.l-modal-delete-txt-project-name').text(project_name);
    });

    $( '.l-modal-delete-btn-cancel' ).on("click", function(e) {
        e.preventDefault();
        closeModal();
    });

    function closeModal() {
        $('.l-modal-wrapper, .l-modal').removeClass('active');
        $( '.l-modal-btn-discard' ).addClass('disable');
        $( '.l-modal-btn-save' ).removeClass('disable');
        $( '.l-modal-input' ).attr("data-project-name-reset", "");
        $( '.l-modal-input' ).attr("value", "");
        $( '.l-modal-input' ).val("");
        $( '.l-modal-input' ).removeClass('alert');
        $( '.l-modal-error' ).removeClass('show');
        $('.l-modal-delete-txt-project-name').text('');
    }

    /*------------------------------------*\

     table sort

    \*------------------------------------*/

    const ths = $("th");
    let sortOrder = 1;

    ths.on("click", function() {
        const rows = sortRows(this);
        rebuildTbody(rows);
        // updateClassName(this);
        sortOrder *= -1;
    })

    function sortRows(th) {
        const rows = $.makeArray($('tbody > tr'));
        const col = th.cellIndex;
        const type = th.dataset.type;
        rows.sort(function(a, b) {
            return compare(a, b, col, type) * sortOrder;
        });
        return rows;
    }

    function compare(a, b, col, type) {
        let _a = a.children[col].textContent;
        let _b = b.children[col].textContent;
        if (type === "number") {
            _a *= 1;
            _b *= 1;
        } else if (type === "string") {
            _a = _a.toLowerCase();
            _b = _b.toLowerCase();
        }

        if (_a < _b) {
            return -1;
        }
        if (_a > _b) {
            return 1;
        }
        return 0;
    }

    function rebuildTbody(rows) {
        const tbody = $("tbody");
        while (tbody.firstChild) {
            tbody.remove();
        }

        let j;
        for (j=0; j<rows.length; j++) {
            tbody.append(rows[j]);
        }
    }

    function updateClassName(th) {
        let k;
        for (k=0; k<ths.length; k++) {
            ths[k].className = "";
        }
        th.className = sortOrder === 1 ? "asc" : "desc";
    }

    /*------------------------------------*\

     press esc key

    \*------------------------------------*/

    $(document).keydown(function(e) {

        if ( e.keyCode === 27 ){
            closeModal();
        }

    });

    /*------------------------------------*\

     window load

    \*------------------------------------*/

    $( window ).on( 'load', function() {
    });

    /*------------------------------------*\

        window resize
        http://stackoverflow.com/questions/1649086/detect-rotation-of-android-phone-in-the-browser-with-javascript

    \*------------------------------------*/

    const supportsOrientationChange = 'onorientationchange' in window, orientationEvent = supportsOrientationChange ? 'orientationchange' : 'resize'; window.addEventListener( orientationEvent, function() {
    });


}); // end document ready

/*------------------------------------*\

    detect touch device
    http://ctrlq.org/code/19616-detect-touch-screen-javascript

\*------------------------------------*/

function isTouchDevice() {

    return ( ( 'ontouchstart' in window ) || ( navigator.MaxTouchPoints > 0 ) || ( navigator.msMaxTouchPoints > 0 ) );

}

if ( !isTouchDevice() ) {

    document.documentElement.className += ' no-touch';

} else {

    var touch = true;

}