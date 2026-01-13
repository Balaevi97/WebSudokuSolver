const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const solveBtn = document.getElementById('solveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');
const originalGrid = document.getElementById('originalGrid');
const solvedGrid = document.getElementById('solvedGrid');
const errorMessage = document.getElementById('errorMessage');
const resetBtn = document.getElementById('resetBtn');
const tabButtons = document.querySelectorAll('.tab-btn');
const manualInputBtn = document.getElementById('manualInputBtn');
const manualInputSection = document.getElementById('manualInputSection');
const manualGrid = document.getElementById('manualGrid');
const solveManualBtn = document.getElementById('solveManualBtn');
const cancelManualBtn = document.getElementById('cancelManualBtn');
// Always use Spring Boot backend on port 8080, regardless of where HTML is served from
const API_BASE = 'http://localhost:8080';

let currentFile = null;

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

// Handle upload area click (but not when clicking buttons)
uploadArea.addEventListener('click', (e) => {
    // Don't trigger if clicking any button
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
    }
    fileInput.click();
});

// Handle button click separately
const chooseFileBtn = document.getElementById('chooseFileBtn');
if (chooseFileBtn) {
    chooseFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
}

// Handle paste from clipboard
document.addEventListener('paste', (e) => {
    // Only handle paste when upload area is visible (not in manual input or results)
    const isUploadVisible = uploadArea.style.display !== 'none';
    const isManualVisible = manualInputSection && manualInputSection.style.display === 'block';
    const isResultsVisible = resultsSection && resultsSection.style.display === 'block';
    
    // Only process paste if we're on the main upload screen
    if (!isUploadVisible || isManualVisible || isResultsVisible) {
        return;
    }

    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const blob = items[i].getAsFile();
            // Convert blob to File object
            const file = new File([blob], 'pasted-image.png', { type: blob.type });
            handleFile(file);
            break;
        }
    }
});

// Handle file selection
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please upload an image file');
        return;
    }

    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadArea.style.display = 'none';
        previewSection.style.display = 'block';
        hideError();
    };
    reader.readAsDataURL(file);
}

// Cancel preview
cancelBtn.addEventListener('click', () => {
    resetView();
});

// Solve button
solveBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    hideError();
    previewSection.style.display = 'none';
    loading.style.display = 'block';

    const formData = new FormData();
    formData.append('image', currentFile);

    try {
        // First check if backend is reachable
        try {
            const healthCheck = await fetch(`${API_BASE}/api/health`);
            if (!healthCheck.ok) {
                throw new Error(`Backend not responding. Make sure Spring Boot is running on port 8080.`);
            }
        } catch (healthError) {
            if (healthError.message.includes('Backend not responding')) {
                throw healthError;
            }
            throw new Error(`Cannot connect to backend at ${API_BASE}. Make sure Spring Boot is running on port 8080. Error: ${healthError.message}`);
        }

        const response = await fetch(`${API_BASE}/api/solve`, {
            method: 'POST',
            body: formData
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            if (response.status === 404) {
                throw new Error(`API endpoint not found (404). Make sure Spring Boot is running and the controller is registered.`);
            }
            throw new Error(`Server error: ${response.status} ${response.statusText}. ${text.substring(0, 100)}`);
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            let errorMsg = data.error || 'Failed to solve Sudoku';
            // If it's an OCR error, suggest manual input and show button
            if (errorMsg.includes('Tesseract') || errorMsg.includes('OCR')) {
                errorMsg += '<br><br><strong>💡 Tip:</strong> OCR is not available. Use manual input instead!';
            }
            throw new Error(errorMsg);
        }

        displayResults(data.original, data.solved);
    } catch (error) {
        console.error('Error:', error);
        const errorMsg = error.message || 'An unexpected error occurred. Please check the console for details.';
        showError(errorMsg);
        loading.style.display = 'none';
        previewSection.style.display = 'block';
        
        // If OCR error, show manual input button more prominently
        if (errorMsg.includes('Tesseract') || errorMsg.includes('OCR')) {
            const errorDiv = document.getElementById('errorMessage');
            errorDiv.innerHTML = errorMsg;
            const manualBtn = document.createElement('button');
            manualBtn.className = 'btn-primary';
            manualBtn.textContent = '✏️ Use Manual Input Instead';
            manualBtn.style.marginTop = '10px';
            manualBtn.id = 'errorManualBtn';
            manualBtn.onclick = () => {
                // Hide error and preview, show manual input
                errorDiv.style.display = 'none';
                previewSection.style.display = 'none';
                uploadArea.style.display = 'none';
                manualInputSection.style.display = 'block';
                if (manualInputBtn) manualInputBtn.style.display = 'none';
                createManualGrid();
            };
            errorDiv.appendChild(document.createElement('br'));
            errorDiv.appendChild(manualBtn);
        }
    }
});

// Display results
function displayResults(original, solved) {
    loading.style.display = 'none';
    resultsSection.style.display = 'block';

    renderGrid(originalGrid, original, 'original');
    renderGrid(solvedGrid, solved, 'solved');

    // Set active tab
    setActiveTab('original');
    
    // Fun celebration animation!
    celebrate();
}

// Celebration animation function
function celebrate() {
    // Create confetti effect
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.animation = `confettiFall ${2 + Math.random() * 2}s linear forwards`;
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 4000);
        }, i * 50);
    }

    // Success message animation
    const successMsg = document.createElement('div');
    successMsg.textContent = '🎊🎉 Solved! 🎉🎊';
    successMsg.style.position = 'fixed';
    successMsg.style.top = '50%';
    successMsg.style.left = '50%';
    successMsg.style.transform = 'translate(-50%, -50%)';
    successMsg.style.fontSize = '3rem';
    successMsg.style.fontWeight = 'bold';
    successMsg.style.color = '#667eea';
    successMsg.style.zIndex = '10000';
    successMsg.style.pointerEvents = 'none';
    successMsg.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
    successMsg.style.animation = 'celebratePop 1s ease-out forwards';
    document.body.appendChild(successMsg);

    setTimeout(() => successMsg.remove(), 2000);
}

// Render Sudoku grid
function renderGrid(container, grid, type) {
    container.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            
            const value = grid[row][col];
            if (value === 0) {
                cell.textContent = '';
                cell.classList.add('empty');
            } else {
                cell.textContent = value;
                if (type === 'original') {
                    cell.classList.add('original');
                } else {
                    cell.classList.add('solved');
                }
            }
            
            container.appendChild(cell);
        }
    }
}

// Tab switching
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        setActiveTab(tab);
    });
});

function setActiveTab(tab) {
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    if (tab === 'original') {
        originalGrid.style.display = 'grid';
        solvedGrid.style.display = 'none';
    } else {
        originalGrid.style.display = 'none';
        solvedGrid.style.display = 'grid';
    }
}

// Reset button
resetBtn.addEventListener('click', () => {
    resetView();
});

// Make resetView globally accessible
window.resetView = function resetView() {
    console.log('Resetting view...');
    currentFile = null;
    fileInput.value = '';
    uploadArea.style.display = 'block';
    previewSection.style.display = 'none';
    manualInputSection.style.display = 'none';
    resultsSection.style.display = 'none';
    loading.style.display = 'none';
    hideError();
    // Show manual input button again
    if (manualInputBtn) {
        manualInputBtn.style.display = 'inline-block';
    }
    // Clear manual grid if it exists
    if (manualGrid) {
        manualGrid.innerHTML = '';
    }
    console.log('View reset complete');
};

// Make header clickable to reset to main page
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    if (header) {
        header.style.cursor = 'pointer';
        header.addEventListener('click', (e) => {
            e.preventDefault();
            resetView();
        });
        console.log('Header click handler attached');
    } else {
        console.error('Header element not found');
    }
});

// Also try to attach immediately if DOM is already loaded
const header = document.getElementById('header');
if (header) {
    header.style.cursor = 'pointer';
    header.addEventListener('click', (e) => {
        e.preventDefault();
        resetView();
    });
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Manual input functionality
manualInputBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.display = 'none';
    previewSection.style.display = 'none';
    manualInputSection.style.display = 'block';
    manualInputBtn.style.display = 'none'; // Hide the button when manual input is shown
    hideError(); // Hide any error messages
    createManualGrid();
});

cancelManualBtn.addEventListener('click', () => {
    manualInputSection.style.display = 'none';
    uploadArea.style.display = 'block';
    manualInputBtn.style.display = 'inline-block'; // Show the button again
});

function createManualGrid() {
    manualGrid.innerHTML = '';
    for (let i = 0; i < 81; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'manual-cell';
        input.maxLength = 1;
        input.pattern = '[1-9]';
        input.placeholder = '';
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            // Allow empty or single digit 1-9, remove 0 and invalid characters
            if (value && !/^[1-9]$/.test(value)) {
                // Remove 0 and any non-digit characters
                e.target.value = value.replace(/[^1-9]/g, '');
                if (e.target.value.length > 1) {
                    e.target.value = e.target.value.slice(0, 1);
                }
            }
        });
        // Allow backspace/delete to clear the cell
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.target.value = '';
            }
            // Allow navigation with arrow keys
            if (e.key.startsWith('Arrow')) {
                const index = Array.from(manualGrid.children).indexOf(e.target);
                let nextIndex = index;
                if (e.key === 'ArrowRight') nextIndex = (index + 1) % 81;
                if (e.key === 'ArrowLeft') nextIndex = (index - 1 + 81) % 81;
                if (e.key === 'ArrowDown') nextIndex = Math.min(index + 9, 80);
                if (e.key === 'ArrowUp') nextIndex = Math.max(index - 9, 0);
                manualGrid.children[nextIndex].focus();
                e.preventDefault();
            }
        });
        manualGrid.appendChild(input);
    }
    // Focus first input
    if (manualGrid.children.length > 0) {
        manualGrid.children[0].focus();
    }
}

solveManualBtn.addEventListener('click', async () => {
    const grid = [];
    for (let row = 0; row < 9; row++) {
        grid[row] = [];
        for (let col = 0; col < 9; col++) {
            const index = row * 9 + col;
            const value = manualGrid.children[index].value.trim();
            if (value === '') {
                grid[row][col] = 0;  // Empty cell = 0
            } else {
                const numValue = parseInt(value);
                // Only accept 1-9, anything else becomes 0
                grid[row][col] = (isNaN(numValue) || numValue < 1 || numValue > 9) ? 0 : numValue;
            }
        }
    }

    hideError();
    manualInputSection.style.display = 'none';
    loading.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/api/solve-from-grid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(grid)
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server error: ${response.status} ${response.statusText}. ${text.substring(0, 100)}`);
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to solve Sudoku');
        }

        displayResults(data.original, data.solved);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'An unexpected error occurred. Please check the console for details.');
        loading.style.display = 'none';
        manualInputSection.style.display = 'block';
    }
});

