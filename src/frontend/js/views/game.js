export async function loadGamePage(addToHistory = true) {
    try {
        if (addToHistory) {
            history.pushState(
                {
                    view: "game",
                },
                ""
            );
        }

        console.log("loadGamePage called");
    } catch (error) {
        console.error(error);
    }
}