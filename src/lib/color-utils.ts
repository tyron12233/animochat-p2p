export function getTextColor(bgColor: string) {
    // if bgColor is linear gradient calculate the average color
    if (bgColor.includes("linear-gradient")) {
        const colors = bgColor.match(/#([0-9A-F]{6}|[0-9A-F]{3})/gi);
        if (colors) {
            const total = colors.reduce((acc, color) => {
                const c = color.charAt(0) === "#"
                    ? color.substring(1, 7)
                    : color;
                const r = parseInt(c.substring(0, 2), 16);
                const g = parseInt(c.substring(2, 4), 16);
                const b = parseInt(c.substring(4, 6), 16);
                return acc + r * 0.299 + g * 0.587 + b * 0.114;
            }, 0);
            return total / colors.length > 186 ? "#000000" : "#ffffff";
        }
    }
    const color = bgColor.charAt(0) === "#" ? bgColor.substring(1, 7) : bgColor;
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000000" : "#ffffff";
}
