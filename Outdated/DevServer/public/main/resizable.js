document.addEventListener('DOMContentLoaded', function () {
    const leftBar = document.getElementById('left_bar');
    const resizer = document.getElementById('resizer');
    const toggleButton = document.getElementById('toggle_button');
    let isResizing = false;
    let isHidden = false;

    let old_width;

    resizer.addEventListener('mousedown', function (e) {
        isResizing = true;
        document.body.style.cursor = 'ew-resize';
    });

    document.addEventListener('mousemove', function (e) {
        if (!isResizing) return;

        let newWidth = e.clientX;

        if (!newWidth) newWidth = 50;
        newWidth = Math.max(newWidth, 50);
        document.body.style.setProperty('--left-bar-width', `${newWidth}px`);
        resizer.style.left = `${newWidth - 5}px`;
    });

    document.addEventListener('mouseup', function () {
        isResizing = false;
        document.body.style.cursor = 'default';
    });

    toggleButton.addEventListener('click', function () {
        isHidden = !isHidden;
        if (isHidden) {
            leftBar.classList.add('hidden');
            toggleButton.innerHTML = '<i class="fas fa-arrow-right"></i>';
            old_width = getComputedStyle(document.body).getPropertyValue('--left-bar-width');
            document.body.style.setProperty('--left-bar-width', `0px`);
            resizer.style.display = "none";
        } else {
            document.body.style.setProperty('--left-bar-width', old_width);
            leftBar.classList.remove('hidden');
            toggleButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
            resizer.style.display = "block";
        }
    });
});