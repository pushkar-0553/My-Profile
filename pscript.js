document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".btn");
    
    buttons.forEach(button => {
        button.addEventListener("mouseover", () => {
            button.style.transform = "scale(1.1)";
        });
        
        button.addEventListener("mouseout", () => {
            button.style.transform = "scale(1)";
        });
    });
});
