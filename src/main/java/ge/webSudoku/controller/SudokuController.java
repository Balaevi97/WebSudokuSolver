package ge.webSudoku.controller;

import ge.webSudoku.service.SudokuSolverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${app.cors.origins}")
@RequestMapping(value = "/api", produces = MediaType.APPLICATION_JSON_VALUE)
public class SudokuController {

    @Autowired
    private SudokuSolverService sudokuSolverService;


    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("engine", "Tesseract OCR");
        response.put("message", "Sudoku Solver API is running and Tesseract is ready");
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/solve", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> solveSudoku(@RequestParam("image") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (file == null || file.isEmpty()) {
                response.put("success", false);
                response.put("error", "Please Upload Image");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            int[][] extractedGrid = sudokuSolverService.extractSudokuFromImage(file);

            int[][] solvedGrid = sudokuSolverService.solveSudoku(extractedGrid);

            if (solvedGrid == null) {
                response.put("success", false);
                response.put("error", "This Sudoku puzzle cannot be solved. The OCR may have misread some digits.");
                response.put("extracted", extractedGrid);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            response.put("original", extractedGrid);
            response.put("solved", solvedGrid);
            response.put("success", true);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("success", false);
            response.put("error", "Error reading file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (RuntimeException e) {

            response.put("success", false);
            response.put("error", "AI Service connection error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/solve-from-grid")
    public ResponseEntity<Map<String, Object>> solveSudokuFromGrid(@RequestBody int[][] grid) {
        Map<String, Object> response = new HashMap<>();

        try {
            int[][] solvedGrid = sudokuSolverService.solveSudoku(grid);

            if (solvedGrid == null) {
                response.put("success", false);
                response.put("error", "The given Sudoku puzzle is unsolvable.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            response.put("original", grid);
            response.put("solved", solvedGrid);
            response.put("success", true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error during the solving: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}