async function captureScreenWithScroll() {
    try {
        // Move to the top of the page before recording
        window.scrollTo(0, 0);

        // Start screen capture
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: 'screen' } });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = function (e) {
            chunks.push(e.data);
        };

        mediaRecorder.onstop = function () {
            // Create video blob and download
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'StoffLib_Website.webm';
            link.click();
        };

        // Start recording
        mediaRecorder.start();

        // Wait for 0.3 seconds at the top after starting the recording
        await new Promise(resolve => setTimeout(resolve, 50));
        await new Promise(resolve => setTimeout(resolve, 300));

        // Function to simulate auto-scrolling until the bottom of the page
        function autoScroll() {
            return new Promise((resolve) => {
                const scrollHeight = document.body.scrollHeight;
                const scrollStep = 10; // Step by pixels
                let scrollPosition = 0;

                const scrollInterval = setInterval(() => {
                    scrollPosition += scrollStep;
                    window.scrollBy(0, scrollStep);

                    // Check if we've reached the bottom of the page
                    if (window.innerHeight + window.scrollY >= scrollHeight) {
                        clearInterval(scrollInterval);
                        resolve();
                    }
                }, 16.66); // ~60fps for smooth scrolling
            });
        }

        // Scroll until the bottom of the page
        await autoScroll();

        // Wait for 1 second at the bottom before stopping the recording
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Stop the recording after scrolling is complete
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop()); // Stop screen sharing

    } catch (err) {
        console.error("Error capturing screen: ", err);
    }
}

document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();  // Prevent the default browser save behavior
        captureScreenWithScroll();  // Call your function
    }
});