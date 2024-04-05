export class DrawOscillogramm {
    constructor ({ analyser, canvasCtx, width, height }) {
        this.analyser = analyser;
        this.canvasCtx = canvasCtx;
        this.width = width;
        this.height = height;
        this.draw = this.draw.bind(this);
    }

    start () {
        this.analyser.fftSize = 256;
        const bufferLength = this.analyser.fftSize;

        // We can use Float32Array instead of Uint8Array if we want higher precision
        // const dataArray = new Float32Array(bufferLength);
        this.dataArray = new Uint8Array(bufferLength);
        this.bufferLength = bufferLength;
        this.draw();
    }

    stop () {
        cancelAnimationFrame(this.drawVisual);
        this.clearCanvas();
        this.drawVisual = undefined;
    }

    clearCanvas() {
        const canvasCtx = this.canvasCtx;
        const WIDTH = this.width;
        const HEIGHT = this.height;

        canvasCtx.fillStyle = "rgb(255, 255, 255)";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    draw () {
        this.drawVisual = requestAnimationFrame(this.draw);
        this.analyser.getByteTimeDomainData(this.dataArray);

        this.clearCanvas();

        const canvasCtx = this.canvasCtx;
        const WIDTH = this.width;
        const HEIGHT = this.height;

        canvasCtx.lineWidth = 1.5;
        canvasCtx.strokeStyle = "rgb(50, 50, 50)";
        canvasCtx.beginPath();
        const sliceWidth = WIDTH / this.bufferLength;
        let x = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = v * (HEIGHT / 2);

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(WIDTH, HEIGHT / 2);
        canvasCtx.stroke();
    }
}

