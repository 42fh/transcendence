// error-handling.js
export const ErrorHandlingMixin = {
    initializeErrorLog() {
        if (!this.errorLog) {
            this.errorLog = document.createElement('div');
            this.errorLog.className = 'error-log';
            this.errorLog.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                width: 300px;
                background-color: rgba(0, 0, 0, 0.8);
                border: 1px solid #444;
                border-radius: 4px;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                color: white;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
            `;

            const header = document.createElement('div');
            header.style.cssText = `
                font-weight: bold;
                padding-bottom: 5px;
                margin-bottom: 5px;
                border-bottom: 1px solid #444;
            `;
            header.textContent = 'Error Log';
            this.errorLog.appendChild(header);

            document.body.appendChild(this.errorLog);
        }
    },

    showError(errorEvent) {
        const timestamp = new Date().toLocaleTimeString();
        
        const errorEntry = document.createElement('div');
        errorEntry.style.cssText = `
            margin-bottom: 5px;
            padding: 5px;
            border-left: 3px solid #ff6b6b;
            background-color: rgba(255, 255, 255, 0.1);
        `;

        const timestampDiv = document.createElement('div');
        timestampDiv.style.color = '#888';
        timestampDiv.textContent = timestamp;
        errorEntry.appendChild(timestampDiv);

        Object.entries(errorEvent).forEach(([key, value]) => {
            const fieldDiv = document.createElement('div');
            fieldDiv.style.cssText = `
                margin-top: 3px;
                padding-left: 10px;
            `;
            fieldDiv.textContent = `${key}: ${value}`;
            errorEntry.appendChild(fieldDiv);
        });

        if (this.errorLog) {
            if (this.errorLog.children.length > 1) {
                this.errorLog.insertBefore(errorEntry, this.errorLog.children[1]);
            } else {
                this.errorLog.appendChild(errorEntry);
            }

            while (this.errorLog.children.length > 6) {
                this.errorLog.removeChild(this.errorLog.lastChild);
            }
        }

        this.showErrorOnCanvas(errorEvent);
    },

    showErrorOnCanvas(errorEvent) {
        const existingErrors = this.svg.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());

        const errorGroup = this.createSVGElement('g', {
            class: 'error-message',
            transform: `translate(${this.config.center}, ${this.config.viewboxSize - 60})`
        });

        const background = this.createSVGElement('rect', {
            x: -140,
            y: -10,
            width: 280,
            height: (Object.keys(errorEvent).length * 20) + 20,
            fill: 'rgba(0, 0, 0, 0.7)',
            rx: 5,
            ry: 5
        });
        errorGroup.appendChild(background);

        Object.entries(errorEvent).forEach(([key, value], index) => {
            const textElement = this.createSVGElement('text', {
                x: 0,
                y: index * 20,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                'font-size': '14px',
                fill: '#ff6b6b'
            });
            textElement.textContent = `${key}: ${value}`;
            errorGroup.appendChild(textElement);
        });

        this.svg.appendChild(errorGroup);

        setTimeout(() => {
            errorGroup.remove();
        }, 5000);
    }
};
