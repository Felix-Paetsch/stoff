{
    const requestIdent = Math.random().toString(36)
    const serverUrl = "/hot_reload"; 

    const checkServerReset = async () => {
        try {
            const response = await fetch(serverUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ request_ident: requestIdent }),
            });

            const result = await response.json();

            if (result) {
                console.log("Server reset detected. Reloading page...");
                window.location.reload();
            }
        } catch (error) {
            console.error("Error checking server reset:", error);
        }
    };

    setInterval(checkServerReset, 300);
}