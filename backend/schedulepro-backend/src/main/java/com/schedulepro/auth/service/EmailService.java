package com.schedulepro.auth.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${sendgrid.api.key}")
    private String apiKey;

    @Value("${sendgrid.from.email}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        // ✅ Run email sending in background thread
        new Thread(() -> {
            try {
                log.info("📧 Sending OTP email via SendGrid API to: {}", toEmail);

                SendGrid sg = new SendGrid(apiKey);
                Request request = new Request();
                request.setMethod(Method.POST);
                request.setEndpoint("mail/send");

                // ✅ Build JSON body
                String body = String.format(
                        "{" +
                                "\"personalizations\":[{" +
                                "\"to\":[{\"email\":\"%s\"}]" +
                                "}]," +
                                "\"from\":{\"email\":\"%s\"}," +
                                "\"subject\":\"🔐 Schedule Pro - Your OTP Code\"," +
                                "\"content\":[{" +
                                "\"type\":\"text/plain\"," +
                                "\"value\":\"Your OTP code is: %s\\n\\nThis OTP is valid for 5 minutes.\"" +
                                "}]" +
                                "}",
                        toEmail, fromEmail, otp
                );

                request.setBody(body);
                Response response = sg.api(request);

                if (response.getStatusCode() == 202) {
                    log.info("✅ OTP email sent successfully via SendGrid API to: {}", toEmail);
                } else {
                    log.error("❌ SendGrid API error: Status {}, Body: {}",
                            response.getStatusCode(), response.getBody());
                }

            } catch (Exception e) {
                log.error("❌ Failed to send OTP email to: {}", toEmail, e);
            }
        }).start();

        log.info("📧 Email sending started in background for: {}", toEmail);
    }
}