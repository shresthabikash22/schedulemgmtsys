package com.example.employeeschedulemanagementsys;

import com.example.employeeschedulemanagementsys.gui.MainFrame;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import javax.swing.*;
import java.awt.*;


@SpringBootApplication
public class EmployeeschedulemanagementsysApplication {

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception e) {
            System.out.println("Error: "+ e.toString());
        }

        // Launch GUI on Event Dispatch Thread
        SwingUtilities.invokeLater(() -> new MainFrame().setVisible(true));
    }

}
