package com.example.Student.Life.Hub.Model;

import java.time.*;

public class SleepSchedule {
  private LocalTime bedTime;
  private LocalTime wakeTime;

  public void adjustSchedule(LocalTime newBedTime, LocalTime newWakeTime) {
    this.bedTime = newBedTime;
    this.bedTime = newWakeTime;
  }
}
