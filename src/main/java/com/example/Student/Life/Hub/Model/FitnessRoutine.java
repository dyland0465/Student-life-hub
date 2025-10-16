package com.example.Student.Life.Hub.Model;

import java.util.*;

public class FitnessRoutine {
  private String routineName;
  private int duration;
  private String type;
  private ArrayList<FitnessRoutine> workoutLog;

  public void logWorkout() {
    workoutLog.add(this);
    System.out.println("Logged workout: " + routineName);

  }

  public ArrayList<FitnessRoutine> getWorkoutLog() {
    return new ArrayList<>(workoutLog);
  }

}
