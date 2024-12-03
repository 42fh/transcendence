// ErrorRenderer.js

export class ErrorRenderer {
  constructor() {
    this.errorLog = document.getElementById("two-d-game__error-log");
    this.maxErrorLogSize = 5;
    this.errorHistory = [];
  }

  showError(errorEvent) {
    if (!this.errorLog) {
      console.warn("Error log element not found");
      return;
    }

    const timestamp = new Date().toLocaleTimeString();

    // Create error entry
    const errorEntry = document.createElement("div");
    errorEntry.className = "error-entry";
    errorEntry.style.cssText = `
            margin-bottom: 5px;
            padding: 5px;
            border-left: 3px solid #ff6b6b;
            background-color: rgba(255, 255, 255, 0.1);
        `;

    // Add timestamp
    const timestampDiv = document.createElement("div");
    timestampDiv.style.color = "#888";
    timestampDiv.textContent = timestamp;
    errorEntry.appendChild(timestampDiv);

    // Add error details
    Object.entries(errorEvent).forEach(([key, value]) => {
      const fieldDiv = document.createElement("div");
      fieldDiv.style.cssText = `
                margin-top: 3px;
                padding-left: 10px;
            `;
      fieldDiv.textContent = `${key}: ${value}`;
      errorEntry.appendChild(fieldDiv);
    });

    // Add to error log
    if (this.errorLog.children.length > 0) {
      this.errorLog.insertBefore(errorEntry, this.errorLog.firstChild);
    } else {
      this.errorLog.appendChild(errorEntry);
    }

    // Keep only recent errors
    while (this.errorLog.children.length > this.maxErrorLogSize) {
      this.errorLog.removeChild(this.errorLog.lastChild);
    }

    // Store in history
    this.errorHistory.push({
      timestamp,
      ...errorEvent,
    });

    // Trim history
    if (this.errorHistory.length > this.maxErrorLogSize) {
      this.errorHistory.shift();
    }
  }

  clearErrors() {
    if (this.errorLog) {
      this.errorLog.innerHTML = "";
    }
    this.errorHistory = [];
  }

  getErrorHistory() {
    return this.errorHistory;
  }
}
