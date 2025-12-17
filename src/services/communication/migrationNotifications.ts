/**
 * User Communication Service for Migration
 * 
 * Handles notifications, emails, and in-app messages during the
 * subscription model access control migration.
 */

export interface NotificationTemplate {
  audience: 'all' | 'free' | 'paid' | 'affected_users';
  content: string;
  cta?: {
    text: string;
    url: string;
  };
  id: string;
  title: string;
  type: 'email' | 'in_app' | 'push';
}

export const MIGRATION_NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {


  // Migration completed
  migration_completed: {
    audience: 'affected_users',
    content: `
Hệ thống AI models đã được cập nhật thành công!

**Có gì mới:**
• Models được tự động enable theo gói subscription của bạn
• Tier badges giúp bạn dễ dàng nhận biết loại model
• Giao diện lựa chọn model được cải tiến

**Gói ${'{plan_name}'} của bạn bao gồm:**
${'{allowed_models_list}'}

Hãy thử ngay các model mới! 🎉
`,
    cta: {
      text: 'Thử ngay',
      url: '/chat',
    },
    id: 'migration_completed',
    title: '✅ Cập nhật hoàn tất - Khám phá tính năng mới!',
    type: 'in_app',
  },





  // Error notification
  migration_error: {
    audience: 'affected_users',
    content: `
Chào bạn,

Chúng tôi gặp một chút vấn đề khi cập nhật settings AI models cho tài khoản của bạn.

**Tình trạng hiện tại:**
• Tài khoản của bạn vẫn hoạt động bình thường
• Một số settings có thể chưa được cập nhật hoàn toàn
• Team kỹ thuật đang xử lý vấn đề này

**Chúng tôi sẽ làm gì:**
• Khắc phục vấn đề trong 24h tới
• Gửi thông báo khi hoàn tất
• Đảm bảo không mất dữ liệu

Nếu bạn gặp bất kỳ vấn đề nào, vui lòng liên hệ support@pho.chat

Xin lỗi vì sự bất tiện này! 🙏
`,
    cta: {
      text: 'Liên hệ hỗ trợ',
      url: 'mailto:support@pho.chat',
    },
    id: 'migration_error',
    title: '⚠️ Cần hỗ trợ - Vấn đề trong quá trình cập nhật',
    type: 'email',
  },




  // Migration in progress
  migration_in_progress: {
    audience: 'affected_users',
    content: `
Chúng tôi đang cập nhật cách quản lý AI models để mang lại trải nghiệm tốt hơn cho bạn.

Quá trình này diễn ra trong nền và không ảnh hưởng đến việc sử dụng chat của bạn.

Dự kiến hoàn thành trong vài phút.
`,
    id: 'migration_in_progress',
    title: '⚡ Đang cập nhật hệ thống AI Models',
    type: 'in_app',
  },



  // Pre-migration announcement
  pre_migration_announcement: {
    audience: 'affected_users',
    content: `
Chào bạn,

Chúng tôi đang chuẩn bị một bản cập nhật quan trọng để cải thiện trải nghiệm sử dụng AI models trên pho.chat.

**Những thay đổi sắp tới:**
• Hệ thống quản lý AI models tự động theo gói subscription
• Giao diện lựa chọn model được cải tiến với tier badges
• Loại bỏ việc tự cấu hình API keys để đảm bảo bảo mật

**Lợi ích cho bạn:**
✅ Trải nghiệm đơn giản hơn - không cần tự quản lý API keys
✅ Bảo mật cao hơn - hệ thống quản lý keys tập trung
✅ Hiệu suất ổn định - infrastructure được tối ưu
✅ Hỗ trợ tốt hơn - team có thể debug issues dễ dàng

**Timeline:**
• Ngày mai: Bắt đầu migration (không ảnh hưởng đến sử dụng)
• Tuần tới: Hoàn thành migration cho toàn bộ users

Bạn không cần làm gì cả. Hệ thống sẽ tự động migrate settings của bạn.

Cảm ơn bạn đã tin tưởng pho.chat! 🙏
`,
    cta: {
      text: 'Xem chi tiết',
      url: 'https://pho.chat/blog/subscription-model-migration',
    },
    id: 'pre_migration_announcement',
    title: '🚀 Cải tiến trải nghiệm AI Models - Thông báo quan trọng',
    type: 'email',
  },


  // Upgrade prompt for restricted models
  upgrade_prompt_notification: {
    audience: 'free',
    content: `
Bạn đang cố gắng sử dụng model ${'{model_name}'} - một model Tier ${'{tier}'} cao cấp.

Gói hiện tại của bạn (${'{current_plan}'}) chỉ hỗ trợ models Tier ${'{max_tier}'}.

Nâng cấp lên gói ${'{recommended_plan}'} để:
• Sử dụng tất cả models Tier ${'{tier}'}
• Tăng quota Phở Points hàng tháng
• Ưu tiên hỗ trợ khách hàng
`,
    cta: {
      text: 'Nâng cấp ngay',
      url: '/settings?active=subscription',
    },
    id: 'upgrade_prompt_notification',
    title: '🚀 Nâng cấp để sử dụng model cao cấp',
    type: 'in_app',
  },
};

export class MigrationNotificationService {
  /**
   * Send notification to users
   */
  public async sendNotification(
    templateId: string,
    userIds: string[],
    variables?: Record<string, string>
  ): Promise<void> {
    const template = MIGRATION_NOTIFICATION_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    console.log(`Sending notification "${template.title}" to ${userIds.length} users`);

    for (const userId of userIds) {
      try {
        await this.sendToUser(template, userId, variables);
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
      }
    }
  }

  /**
   * Send notification to specific user
   */
  private async sendToUser(
    template: NotificationTemplate,
    userId: string,
    variables?: Record<string, string>
  ): Promise<void> {
    // Replace variables in content
    let content = template.content;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replaceAll(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      });
    }

    const notification = {
      ...template,
      content,
      timestamp: new Date(),
      userId,
    };

    switch (template.type) {
      case 'email': {
        await this.sendEmail(notification);
        break;
      }
      case 'in_app': {
        await this.sendInAppNotification(notification);
        break;
      }
      case 'push': {
        await this.sendPushNotification(notification);
        break;
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: any): Promise<void> {
    // Mock implementation - would integrate with email service
    console.log(`📧 Email sent to user ${notification.userId}: ${notification.title}`);

    // In production, would use:
    // - SendGrid, Mailgun, or AWS SES
    // - Email templates with proper styling
    // - Unsubscribe links
    // - Tracking pixels for open rates
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(notification: any): Promise<void> {
    // Mock implementation - would store in database
    console.log(`🔔 In-app notification for user ${notification.userId}: ${notification.title}`);

    // In production, would:
    // - Store in notifications table
    // - Send via WebSocket for real-time delivery
    // - Show in notification center
    // - Mark as read/unread
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: any): Promise<void> {
    // Mock implementation - would use push service
    console.log(`📱 Push notification for user ${notification.userId}: ${notification.title}`);

    // In production, would use:
    // - Firebase Cloud Messaging
    // - Apple Push Notification Service
    // - Web Push API
  }

  /**
   * Get notification templates for audience
   */
  public getTemplatesForAudience(audience: string): NotificationTemplate[] {
    return Object.values(MIGRATION_NOTIFICATION_TEMPLATES)
      .filter(template => template.audience === audience || template.audience === 'all');
  }

  /**
   * Schedule notification campaign
   */
  public scheduleNotificationCampaign(
    templateId: string,
    audience: string,
    scheduleDate: Date,
    variables?: Record<string, string>
  ): void {
    console.log(`Scheduling notification campaign:`);
    console.log(`  Template: ${templateId}`);
    console.log(`  Audience: ${audience}`);
    console.log(`  Schedule: ${scheduleDate.toISOString()}`);
    console.log(`  Variables: ${JSON.stringify(variables || {})}`);

    // In production, would use job scheduler like:
    // - Bull Queue with Redis
    // - AWS EventBridge
    // - Cron jobs
    // - Database-based job queue
  }
}

// Singleton instance
export const migrationNotificationService = new MigrationNotificationService();
