package Model;

public class Student extends User{
    private String Major;
    private int year;

    public void setMajor(String newMajor) {
        Major = newMajor;
    }
    public String getMajor() {
        return Major;
    }
    public void setYear(int newYear) {
        year = newYear;
    }
    public int getYear() {
        return year;
    }
    public void viewDashboard() {

    }




}
