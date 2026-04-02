const valid_point_colors = [
    'white',
    '#FAF0E6',
    '#F0FFFF'
  ];

function provide_new_point_color(){
    // Find all elements with class "point_color"
    const pointColorElements = document.querySelectorAll('.point_color');
  
    // Create an array of background colors and count their occurrences
    const backgroundColors = [];
    const colorCounts = {};
  
    for (let i = 0; i < pointColorElements.length; i++) {
      const backgroundColor = pointColorElements[i].attributes._color.value;
  
      if (backgroundColor) {
        backgroundColors.push(backgroundColor);
  
        if (colorCounts[backgroundColor]) {
          colorCounts[backgroundColor]++;
        } else {
          colorCounts[backgroundColor] = 1;
        }
      }
    }

    let leastOccurrenceColor = valid_point_colors[0];
    let leastOccurrenceCount = Number.MAX_SAFE_INTEGER;
  
    for (let i = 0; i < valid_point_colors.length; i++) {
      const color = valid_point_colors[i];
      const count = colorCounts[color] || 0;
  
      if (count < leastOccurrenceCount) {
        leastOccurrenceColor = color;
        leastOccurrenceCount = count;
      }
    }

    return leastOccurrenceColor;
}

function change_point_color(e){
    const t = e.target;
    const point_id = t.parentNode.parentNode.attributes._id.value;

    const current_color = t.attributes._color.value;
    const color_index = valid_point_colors.indexOf(current_color);
    if (color_index < 0){
        new_color = provide_new_point_color();
    } else {
        new_color = valid_point_colors[(color_index + 1) % valid_point_colors.length];
    }

    const point_cards = document.querySelectorAll('.point_card');
    for (let i = 0; i < point_cards.length; i++) {
        if (point_cards[i].attributes._id.value == point_id){
            const color_el = point_cards[i].querySelector('.point_color');
            color_el.attributes._color.value = new_color;
            color_el.style.backgroundColor = new_color;
        }
    }

    const img_points = document.querySelectorAll('.img_point');
    for (let i = 0; i < img_points.length; i++) {
        if (img_points[i].attributes._point_id.value == point_id){
          img_points[i].style.backgroundColor = new_color;
        }
    }

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            point_id,
            new_color
        })
    };
      
    fetch(`${frontend_vars.website_path}/requests/change_point_color`, requestOptions)
        .then(async response => {
            if (!response.ok) {
                const text = await response.text();
                console.log("Error: ", text);
            }
        })
        .catch(error => {
            console.log('Server error: ', error);
        });  
}