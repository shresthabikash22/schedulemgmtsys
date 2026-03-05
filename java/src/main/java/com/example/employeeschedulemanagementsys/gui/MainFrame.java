package com.example.employeeschedulemanagementsys.gui;

import com.example.employeeschedulemanagementsys.model.Employee;
import com.example.employeeschedulemanagementsys.service.SchedulingService;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.util.ArrayList;
import java.util.List;

public class MainFrame extends JFrame {

    private final List<Employee> employees = new ArrayList<>();
    private final SchedulingService service = new SchedulingService();

    private final DefaultListModel<String> listModel = new DefaultListModel<>();
    private final JList<String> empList = new JList<>(listModel);
    private final JTextField nameField = new JTextField(14);
    private final JTextArea outputArea = new JTextArea();

    public MainFrame() {
        super("Employee Shift Scheduler");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setSize(1100, 560);
        setMinimumSize(new Dimension(700, 420));
        setLocationRelativeTo(null);

        JSplitPane split = new JSplitPane(
                JSplitPane.HORIZONTAL_SPLIT,
                buildInputPanel(),
                buildOutputPanel());
        split.setDividerLocation(370);
        split.setResizeWeight(0.0);
        split.setBorder(new EmptyBorder(8, 8, 8, 8));
        setContentPane(split);
    }

    private JPanel buildInputPanel() {

        // FlowLayout keeps each component at its natural preferred size.
        // The previous BorderLayout.EAST was squishing "Add" to a tiny sliver.
        JPanel nameRow = new JPanel(new FlowLayout(FlowLayout.LEFT, 4, 0));
        nameRow.setBorder(new EmptyBorder(0, 0, 6, 0));
        nameRow.add(new JLabel("Name:"));
        nameField.setPreferredSize(new Dimension(148, 26));
        nameRow.add(nameField);
        JButton addBtn = btn("Add", new Color(34, 139, 34));
        addBtn.setPreferredSize(new Dimension(56, 26));
        addBtn.addActionListener(e -> addEmployee());
        nameField.addActionListener(e -> addEmployee());
        nameRow.add(addBtn);

        empList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        empList.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 13));
        empList.setFixedCellHeight(24);
        empList.addMouseListener(new java.awt.event.MouseAdapter() {
            @Override
            public void mouseClicked(java.awt.event.MouseEvent e) {
                if (e.getClickCount() == 2) openPreferences();
            }
        });

        JScrollPane listScroll = new JScrollPane(empList);
        listScroll.setBorder(BorderFactory.createTitledBorder("Employees  (double-click to edit)"));
        listScroll.setPreferredSize(new Dimension(250, 300));

        JButton prefsBtn = btn("Set Preferences", new Color(25, 100, 200));
        JButton removeBtn = btn("Remove Selected", new Color(180, 40, 40));
        JButton genBtn = btn("Generate Schedule", new Color(20, 20, 20));

        prefsBtn.addActionListener(e -> openPreferences());
        removeBtn.addActionListener(e -> removeEmployee());
        genBtn.addActionListener(e -> generateSchedule());

        JPanel btnStack = new JPanel(new GridLayout(3, 1, 0, 5));
        btnStack.setBorder(new EmptyBorder(6, 0, 0, 0));
        btnStack.add(prefsBtn);
        btnStack.add(removeBtn);
        btnStack.add(genBtn);

        JPanel panel = new JPanel(new BorderLayout(0, 4));
        panel.setBorder(new EmptyBorder(4, 4, 4, 4));
        panel.add(nameRow, BorderLayout.NORTH);
        panel.add(listScroll, BorderLayout.CENTER);
        panel.add(btnStack, BorderLayout.SOUTH);
        return panel;
    }

    private JPanel buildOutputPanel() {
        outputArea.setEditable(false);
        outputArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        outputArea.setMargin(new Insets(6, 8, 6, 8));
        outputArea.setText(
                "How to use:\n" +
                        "  1. Type a name and click Add (or press Enter).\n" +
                        "  2. The new employee is auto-selected in the list.\n" +
                        "  3. Click \"Set Preferences\" (or double-click the name).\n" +
                        "  4. Repeat for each employee (need at least 2).\n" +
                        "  5. Click \"Generate Schedule\".\n");

        JScrollPane scroll = new JScrollPane(outputArea);
        scroll.setBorder(BorderFactory.createTitledBorder("Schedule Output"));

        JPanel panel = new JPanel(new BorderLayout());
        panel.add(scroll, BorderLayout.CENTER);
        return panel;
    }

    private JButton btn(String text, Color bg) {
        JButton b = new JButton(text);
        b.setBackground(bg);
        b.setForeground(Color.WHITE);
        b.setOpaque(true);
        b.setBorderPainted(false);
        b.setFocusPainted(false);
        b.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 12));
        return b;
    }

    private void addEmployee() {
        String name = nameField.getText().trim();
        if (name.isEmpty()) {
            warn("Enter a name first.");
            return;
        }
        for (Employee e : employees) {
            if (e.getName().equalsIgnoreCase(name)) {
                warn("\"" + name + "\" is already in the list.");
                return;
            }
        }
        employees.add(new Employee(name));
        listModel.addElement(name);
        nameField.setText("");
        empList.setSelectedIndex(listModel.getSize() - 1);
    }

    private void removeEmployee() {
        int idx = empList.getSelectedIndex();
        if (idx < 0) {
            warn("Select an employee from the list first.");
            return;
        }
        employees.remove(idx);
        listModel.remove(idx);
    }

    private void openPreferences() {
        int idx = empList.getSelectedIndex();
        if (idx < 0) {
            warn("Select an employee from the list first.");
            return;
        }
        new PreferenceDialog(this, employees.get(idx)).setVisible(true);
    }

    private void generateSchedule() {
        if (employees.size() < 2) {
            warn("Add at least 2 employees before generating.");
            return;
        }
        service.buildSchedule(employees);
        outputArea.setText(service.buildReport(employees));
        outputArea.setCaretPosition(0);
    }

    private void warn(String msg) {
        JOptionPane.showMessageDialog(this, msg, "Notice", JOptionPane.WARNING_MESSAGE);
    }
}