package Model;

public class HealthManager {
    private SleepSchedule sleepSchedule;
    private HealthManager healthManager;
    public HealthManager() {
        this.sleepSchedule = new SleepSchedule();
        this.healthManager = new HealthManager();
    }
    
}
