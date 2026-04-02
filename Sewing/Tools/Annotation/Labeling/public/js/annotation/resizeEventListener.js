function setImgContainerWidth() {
  // Get all elements with class ._hu_point_container
  const containers = document.querySelectorAll("._hu_point_container");
  
  // Iterate over each container
  containers.forEach(container => {
      // Get the previous element (an image) and its aspect ratio
      const img = container.previousElementSibling;
      const imgAspectRatio = img.naturalWidth / img.naturalHeight;
      
      // Get the parent element of the container
      const parent = container.parentElement;
      
      // Get its width and height
      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;

      // Calculate the width and height of the image if it was rescaled to be 
      // the biggest possible to still fit inside the parent container (keeping the aspect ratio)
      let newImgWidth, newImgHeight;
      if (imgAspectRatio > (parentWidth / parentHeight)) {
          newImgWidth = parentWidth;
          newImgHeight = newImgWidth / imgAspectRatio;
      } else {
          newImgHeight = parentHeight;
          newImgWidth = newImgHeight * imgAspectRatio;
      }

      // Set the parent elements top row and bottom row to 1fr height. 
      // Set the middle row height to the maximum height of the image.
      // Do the same with the 3 columns.
      parent.style.gridTemplateRows = `1fr ${newImgHeight}px 1fr`;
      parent.style.gridTemplateColumns = `1fr ${newImgWidth}px 1fr`;

      img.style.width = `${newImgWidth}px`;
      img.style.height = `${newImgHeight}px`;
  });
}

event_handler.on_window_load(setImgContainerWidth);
event_handler.on_window_resize(setImgContainerWidth);