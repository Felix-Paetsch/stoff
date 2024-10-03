document.addEventListener('DOMContentLoaded', () => {
    const inputElements = document.querySelectorAll('input');
    const submitElement = document.getElementById('submit');
    const resetElement = document.getElementById('reset');

    if (inputElements.length > 0) {
        inputElements[0].focus();
    }

    inputElements.forEach((input, index) => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const nextIndex = (index + 1) % inputElements.length;
                inputElements[nextIndex].focus();
            }
        });

        input.addEventListener('input', () => {
            submitElement.classList.add('active');
        });
    });

    submitElement.addEventListener('click', () => {
        const data = {};
        inputElements.forEach(input => {
            data[input.name] = input.value;
        });

        fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                submitElement.classList.remove('active');
            } else {
                console.error('Error submitting form');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    resetElement.addEventListener('click', () => {
        inputElements.forEach(input => {
            input.value = '';
        });
        if (inputElements.length > 0) {
            inputElements[0].focus();
        }
        submitElement.classList.remove('active');
    });
});
