package com.schedulepro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class ScheduleproBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(ScheduleproBackendApplication.class, args);
        System.out.println("""
        \n
        ╔═══════════════════════════════════════════════════════════╗
        ║                                                           ║
        ║     🚀 SCHEDULE PRO BACKEND STARTED SUCCESSFULLY 🚀       ║
        ║                                                           ║
        ║     📍 API: http://localhost:8080                         ║
        ║     📍 Swagger: http://localhost:8080/swagger-ui.html    ║
        ║     📍 Actuator: http://localhost:8080/actuator/health   ║
        ║     📍 API Docs: http://localhost:8080/api-docs  
                                                            ║
        ║     ✅ Database: PostgreSQL (Ready)                       ║
        ║     ✅ JWT Authentication: Configured                     ║
        ║     ✅ OAuth2 Ready: Google/GitHub                        ║
        ║                                                           ║
        ╚═══════════════════════════════════════════════════════════╝
        """);
    }
}