# Sudoku Solver Web Application

A web application that automatically solves Sudoku puzzles from uploaded screenshots using OCR (Optical Character Recognition) and a backtracking algorithm.
Note: The OCR may have misread some digits. You can use manual input instead
## Features

- 📸 Upload Sudoku puzzle screenshots
- 🔍 Automatic puzzle extraction using OCR (Tesseract)
- 🧩 Solves Sudoku puzzles using backtracking algorithm
- 🎨 Beautiful, modern web interface
- 📱 Responsive design for mobile and desktop

## Prerequisites

1. **Java 17** or higher
2. **Maven** 3.6+
3. **Tesseract OCR** installed on your system

### Installing Tesseract OCR

#### Windows
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install the executable
3. Add Tesseract to your PATH or note the installation directory

#### macOS
```bash
brew install tesseract
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install tesseract-ocr
```

## Running the Application

1. **Build the project:**
   ```bash
   mvn clean install
   ```

2. **Run the Spring Boot application:**
   ```bash
   mvn spring-boot:run
   ```

3. **Open your browser and navigate to:**
   ```
   http://localhost:63342
   ```

## Usage

1. Click on the upload area or drag and drop a Sudoku puzzle screenshot
2. Preview the uploaded image
3. Click "Solve Sudoku" button
4. View the original puzzle and solution in the results section
5. Switch between "Original" and "Solution" tabs to compare

## API Endpoints

### POST `/api/solve`
Upload an image and get the solved Sudoku puzzle.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `image` (file)

**Response:**
```json
{
  "success": true,
  "original": [[...], ...],
  "solved": [[...], ...]
}
```

### POST `/api/solve-from-grid`
Solve a Sudoku puzzle from a provided grid.

**Request:**
- Content-Type: `application/json`
- Body: 9x9 integer array (0 for empty cells)

**Response:**
```json
{
  "success": true,
  "original": [[...], ...],
  "solved": [[...], ...]
}
```

## Project Structure

```
src/
├── main/
│   ├── java/com/ge/
│   │   ├── SudokuWebApplication.java    # Spring Boot main class
│   │   ├── controller/
│   │   │   └── SudokuController.java    # REST API endpoints
│   │   └── service/
│   │       └── SudokuSolverService.java # OCR and solving logic
│   └── resources/
│       ├── static/
│       │   ├── index.html               # Frontend HTML
│       │   ├── styles.css               # Styling
│       │   └── script.js                # Frontend JavaScript
│       └── application.properties       # Configuration
└── test/
    └── java/com/ge/tests/              # Original test files
```

## Troubleshooting

### OCR Not Working
- Ensure Tesseract is properly installed
- Check that the `tessdata` folder is accessible
- Try using clearer, higher resolution images
- Ensure the Sudoku grid is clearly visible in the image

### Port Already in Use
- Change the port in `src/main/resources/application.properties`
- Set `server.port=8081` (or any available port)

### Image Upload Issues
- Maximum file size is 10MB (configurable in `application.properties`)
- Supported formats: JPG, PNG, GIF, etc.

## Technologies Used

- **Spring Boot 3.2.0** - Web framework
- **Tesseract OCR** - Image text recognition
- **Java 17** - Programming language
- **Maven** - Build tool
- **HTML/CSS/JavaScript** - Frontend

## License

This project is open source and available for personal use.

