import java.sql.*;

public class TestDBConnection {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5433/ScheduleProDB";
        String user = "postgres";
        String password = "project123";

        try {
            Connection conn = DriverManager.getConnection(url, user, password);
            System.out.println("✅ Database connected successfully!");
            conn.close();
        } catch (Exception e) {
            System.out.println("❌ Connection failed: " + e.getMessage());
        }
    }
}