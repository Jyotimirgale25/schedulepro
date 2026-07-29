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
                ╔═══════════════════════════════════════════════════════════════════╗
                ║                                                                   ║
                ║     🚀 SCHEDULE PRO BACKEND STARTED SUCCESSFULLY 🚀               ║
                ║                                                                   ║
                ║     📍 Backend API: https://schedulepro-Backend.onrender.com      ║
                ║     📍 Frontend:   https://schedulepro-frontend.onrender.com      ║
                ║     📍 Swagger:    https://schedulepro-Backend.onrender.com/swagger-ui.html ║
                ║     📍 Actuator:   https://schedulepro-Backend.onrender.com/actuator/health ║
                ║     📍 API Docs:   https://schedulepro-Backend.onrender.com/api-docs ║
                ║                                                                   ║
                ║     ✅ Database: PostgreSQL (Ready)                               ║
                ║     ✅ JWT Authentication: Configured                             ║
                ║     ✅ OAuth2 Ready: Google                                      ║
                ║     ✅ Email Service: SendGrid (OTP Ready)                        ║
                ║                                                                   ║
                ╚═══════════════════════════════════════════════════════════════════╝
        """);
    }
}