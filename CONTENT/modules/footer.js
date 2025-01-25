// ./modules/footer.js
export function createModule(meta, content) {
    const footerDiv = document.createElement("div");
    footerDiv.style.backgroundColor = meta.BGcolor || "#333";
    footerDiv.style.color = meta.textcolor || "#fff";
    footerDiv.style.padding = "20px";

    footerDiv.innerHTML = content.body.text || "Footer";

    return footerDiv;
}
