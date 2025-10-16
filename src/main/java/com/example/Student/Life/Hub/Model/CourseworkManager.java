package com.example.Student.Life.Hub.Model;

import java.util.*;

public class CourseworkManager {
  private ArrayList<Course> courses;

  public void addCourse(Course course) {
    if (!courses.contains(course)) {
      courses.add(course);
    }
  }

  public void removeCourse(Course course) {
    courses.remove(course);
  }

  public ArrayList<Assignment> getDeadlines(ArrayList<Assignment> deadline) {
    for (Course course : courses) {
      deadline.addAll(course.getAssignment());
    }
    return deadline;
  }

}
