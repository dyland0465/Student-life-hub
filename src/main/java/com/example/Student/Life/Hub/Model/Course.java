package com.example.Student.Life.Hub.Model;

import java.util.*;

public class Course {
  private String courseID;
  private String courseName;
  private ArrayList<Assignment> assignments;

  public void addAssignments(ArrayList<Assignment> a) {
    assignments.addAll(a);
  }

  public ArrayList<Assignment> getAssignment() {
    return assignments;
  }

}
