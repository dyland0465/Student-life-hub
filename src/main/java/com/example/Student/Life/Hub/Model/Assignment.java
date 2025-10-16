package com.example.Student.Life.Hub.Model;

import java.time.*;

public class Assignment {
  private String title;
  private LocalDate dueDate;
  private String status;

  public void markCompleted() {

  }

  public void updateDueDate(LocalDate newDate) {
    this.dueDate = newDate;
  }

}
