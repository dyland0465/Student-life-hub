package com.example.Student.Life.Hub.Model;

public class HealthManager {
  private SleepSchedule sleepSchedule;
  private HealthManager healthManager;

  public HealthManager() {
    this.sleepSchedule = new SleepSchedule();
    this.healthManager = new HealthManager();
  }

  public void trackSleep(int hours) {

  }

  public void addRoutine(FitnessRoutine routine) {

  }
}
