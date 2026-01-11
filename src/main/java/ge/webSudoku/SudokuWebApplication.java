package ge.webSudoku;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.ge")
public class SudokuWebApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(SudokuWebApplication.class, args);
        String port = context.getEnvironment().getProperty("server.port");
        System.out.println("Sudoku Web Application started!");
        System.out.println("API endpoints available at: http://localhost:"+port+"/api/");
    }
}

