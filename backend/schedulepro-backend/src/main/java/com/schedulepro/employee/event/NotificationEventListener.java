// src/main/java/com/schedulepro/employee/event/NotificationEventListener.java
package com.schedulepro.employee.event;

import com.schedulepro.employee.service.NotificationService.NotificationCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    @EventListener
    public void handleNotificationCreated(NotificationCreatedEvent event) {
        log.info("📬 Notification event received for user: {}", event.getUserId());
        // Here you can:
        // 1. Send via WebSocket
        // 2. Send via SSE
        // 3. Just log for now

        // For WebSocket:
        // messagingTemplate.convertAndSendToUser(event.getUserId(), "/queue/notifications", event.getNotification());
    }
}