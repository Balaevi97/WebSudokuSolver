package ge.webSudoku.service;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;

@Service
public class SudokuSolverService {

    private final Tesseract tesseract;

    @Value("${tesseract.datapath}")
    private String tesseractDatapath;

    public SudokuSolverService() {
        this.tesseract = new Tesseract();
    }

    @PostConstruct
    public void init() {
        try {
            System.out.println("Loading Tesseract data from: " + tesseractDatapath);
            tesseract.setDatapath(tesseractDatapath);
            tesseract.setLanguage("eng");
            tesseract.setTessVariable("tessedit_char_whitelist", "123456789");
        } catch (Exception e) {
            System.err.println("Error initializing Tesseract: " + e.getMessage());
        }
    }

    public int[][] extractSudokuFromImage(MultipartFile file) throws IOException {
        InputStream is = file.getInputStream();
        BufferedImage fullImage = ImageIO.read(is);

        int[][] grid = new int[9][9];

        int width = fullImage.getWidth();
        int height = fullImage.getHeight();
        int cellWidth = width / 9;
        int cellHeight = height / 9;

        System.out.println("--- OCR Process Started ---");

        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                BufferedImage cell = fullImage.getSubimage(
                        j * cellWidth + (int)(cellWidth * 0.01),
                        i * cellHeight + (int)(cellHeight * 0.01),
                        (int)(cellWidth * 0.8),
                        (int)(cellHeight * 0.8)
                );
                String result = "";
                try {
                    result = tesseract.doOCR(cell).trim();
                    if (!result.isEmpty() && result.matches("\\d")) {
                        grid[i][j] = Integer.parseInt(result);
                    } else {
                        grid[i][j] = 0;
                    }
                } catch (TesseractException e) {
                    grid[i][j] = 0;
                }
            }
        }

        printGrid(grid);
        return grid;
    }

    private void printGrid(int[][] grid) {
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                System.out.print(grid[i][j] + " ");
                if ((j + 1) % 3 == 0 && j < 8) System.out.print("| ");
            }
            System.out.println();
            if ((i + 1) % 3 == 0 && i < 8) {
                System.out.println("------+-------+------");
            }
        }
    }

    public int[][] solveSudoku(int[][] grid) {
        int[][] solvedGrid = new int[9][9];
        for (int i = 0; i < 9; i++) System.arraycopy(grid[i], 0, solvedGrid[i], 0, 9);
        if (fillSudoku(solvedGrid)) return solvedGrid;
        return null;
    }

    private boolean fillSudoku(int[][] grid) {
        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                if (grid[row][col] != 0) continue;
                for (int num = 1; num <= 9; num++) {
                    if (isValid(grid, row, col, num)) {
                        grid[row][col] = num;
                        if (fillSudoku(grid)) return true;
                        grid[row][col] = 0;
                    }
                }
                return false;
            }
        }
        return true;
    }

    private boolean isValid(int[][] grid, int row, int col, int num) {
        for (int i = 0; i < 9; i++) if (grid[row][i] == num || grid[i][col] == num) return false;
        int boxRow = row - row % 3, boxCol = col - col % 3;
        for (int r = 0; r < 3; r++)
            for (int c = 0; c < 3; c++)
                if (grid[boxRow + r][boxCol + c] == num) return false;
        return true;
    }
}