
export function drawBuffer (canvasCtx, buffer, width, height) {
    canvasCtx.fillStyle = "rgb(255, 255, 255)";
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.fillStyle = "rgb(0, 0, 80)";
    canvasCtx.strokeStyle = "rgb(0, 0, 80)";

    const sliceWidth = width / buffer.length;
    let x = 0;
    for (let i = 0; i < buffer.length; i++) {
        const y = buffer[i] * height;
        canvasCtx.fillRect(x, height / 2, x + sliceWidth, y)
        x += sliceWidth;
    }

    canvasCtx.moveTo(0, height / 2);
    canvasCtx.lineTo(width, height / 2);
    canvasCtx.stroke();
}