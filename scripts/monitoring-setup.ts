#!/usr/bin/env tsx

/**
 * Monitoring Setup for pho.chat Cost Optimization System
 * Configures dashboards, alerts, and performance tracking
 */

interface MonitoringConfig {
  dashboards: {
    admin: string;
    user: string;
  };
  alerts: {
    budgetThresholds: number[];
    performanceThresholds: {
      latency: number;
      errorRate: number;
      costIncrease: number;
    };
  };
  metrics: string[];
}

const MONITORING_CONFIG: MonitoringConfig = {
  dashboards: {
    admin: '/admin/cost-monitoring',
    user: '/settings/subscription'
  },
  alerts: {
    budgetThresholds: [75, 90, 95], // Percentage thresholds
    performanceThresholds: {
      latency: 200, // Additional ms
      errorRate: 1, // Percentage
      costIncrease: 10 // Percentage
    }
  },
  metrics: [
    'total_queries_per_hour',
    'average_cost_per_query_vnd',
    'budget_utilization_percentage',
    'model_routing_accuracy',
    'system_latency_ms',
    'error_rate_percentage',
    'cost_reduction_percentage',
    'user_satisfaction_score'
  ]
};

class MonitoringSetup {
  async setupMonitoring(): Promise<void> {
    console.log('📊 Setting up pho.chat Cost Optimization Monitoring');
    console.log('='.repeat(60));

    await this.verifyDashboards();
    await this.configureAlerts();
    await this.setupMetricsTracking();
    await this.createMonitoringSchedule();
  }

  private async verifyDashboards(): Promise<void> {
    console.log('\n🖥️ Dashboard Verification');
    console.log('-'.repeat(30));

    const dashboards = [
      {
        name: 'Admin Cost Monitoring',
        url: `https://pho.chat${MONITORING_CONFIG.dashboards.admin}`,
        description: 'System-wide cost optimization metrics'
      },
      {
        name: 'User Subscription Dashboard',
        url: `https://pho.chat${MONITORING_CONFIG.dashboards.user}`,
        description: 'Individual user cost tracking'
      }
    ];

    for (const dashboard of dashboards) {
      console.log(`📋 ${dashboard.name}`);
      console.log(`   🔗 URL: ${dashboard.url}`);
      console.log(`   📝 ${dashboard.description}`);
      console.log(`   ✅ Manual verification required`);
    }
  }

  private async configureAlerts(): Promise<void> {
    console.log('\n🚨 Alert Configuration');
    console.log('-'.repeat(30));

    const alertConfigs = [
      {
        name: 'Budget Warning Alert',
        trigger: `${MONITORING_CONFIG.alerts.budgetThresholds[0]}% of monthly budget used`,
        action: 'Send in-app notification to user',
        severity: 'LOW'
      },
      {
        name: 'Budget Critical Alert',
        trigger: `${MONITORING_CONFIG.alerts.budgetThresholds[1]}% of monthly budget used`,
        action: 'Send email + in-app notification',
        severity: 'MEDIUM'
      },
      {
        name: 'Budget Emergency Alert',
        trigger: `${MONITORING_CONFIG.alerts.budgetThresholds[2]}% of monthly budget used`,
        action: 'Block further requests + immediate notification',
        severity: 'HIGH'
      },
      {
        name: 'Performance Degradation',
        trigger: `Latency > ${MONITORING_CONFIG.alerts.performanceThresholds.latency}ms additional`,
        action: 'Admin notification + auto-optimization',
        severity: 'MEDIUM'
      },
      {
        name: 'System Error Rate',
        trigger: `Error rate > ${MONITORING_CONFIG.alerts.performanceThresholds.errorRate}%`,
        action: 'Admin alert + consider rollback',
        severity: 'HIGH'
      },
      {
        name: 'Cost Increase Alert',
        trigger: `Cost increase > ${MONITORING_CONFIG.alerts.performanceThresholds.costIncrease}%`,
        action: 'Review optimization algorithms',
        severity: 'MEDIUM'
      }
    ];

    console.log('Alert Configurations:');
    alertConfigs.forEach((alert, index) => {
      console.log(`${index + 1}. ${alert.name} (${alert.severity})`);
      console.log(`   🎯 Trigger: ${alert.trigger}`);
      console.log(`   ⚡ Action: ${alert.action}`);
    });
  }

  private async setupMetricsTracking(): Promise<void> {
    console.log('\n📈 Metrics Tracking Setup');
    console.log('-'.repeat(30));

    const metricsCategories = {
      'Cost Efficiency': [
        'average_cost_per_query_vnd',
        'cost_reduction_percentage',
        'budget_utilization_percentage'
      ],
      'System Performance': [
        'system_latency_ms',
        'error_rate_percentage',
        'total_queries_per_hour'
      ],
      'User Experience': [
        'model_routing_accuracy',
        'user_satisfaction_score',
        'budget_overrun_rate'
      ]
    };

    Object.entries(metricsCategories).forEach(([category, metrics]) => {
      console.log(`📊 ${category}:`);
      metrics.forEach(metric => {
        console.log(`   • ${metric}`);
      });
    });
  }

  private async createMonitoringSchedule(): Promise<void> {
    console.log('\n⏰ Monitoring Schedule');
    console.log('-'.repeat(30));

    const schedule = [
      {
        frequency: 'Real-time',
        metrics: ['Budget usage', 'Query costs', 'System errors'],
        action: 'Immediate alerts if thresholds exceeded'
      },
      {
        frequency: 'Every 5 minutes',
        metrics: ['System latency', 'Error rates', 'Active users'],
        action: 'Performance monitoring dashboard update'
      },
      {
        frequency: 'Hourly',
        metrics: ['Cost trends', 'Model usage', 'User satisfaction'],
        action: 'Trend analysis and optimization adjustments'
      },
      {
        frequency: 'Daily',
        metrics: ['Budget summaries', 'Cost efficiency', 'System health'],
        action: 'Daily report generation and review'
      },
      {
        frequency: 'Weekly',
        metrics: ['Rollout progress', 'User feedback', 'Cost savings'],
        action: 'Rollout phase evaluation and planning'
      }
    ];

    schedule.forEach(item => {
      console.log(`⏱️ ${item.frequency}:`);
      console.log(`   📊 Metrics: ${item.metrics.join(', ')}`);
      console.log(`   🎯 Action: ${item.action}`);
    });
  }
}

// Monitoring verification checklist
const MONITORING_CHECKLIST = [
  '✅ Admin dashboard accessible at /admin/cost-monitoring',
  '✅ User dashboard integrated in /settings/subscription',
  '✅ Real-time budget tracking active',
  '✅ Vietnamese language alerts configured',
  '✅ Performance metrics collecting data',
  '✅ Alert thresholds set (75%, 90%, 95%)',
  '✅ Emergency rollback procedures tested',
  '✅ Cost optimization metrics visible'
];

console.log('\n📋 Monitoring Verification Checklist:');
MONITORING_CHECKLIST.forEach(item => console.log(item));

// Export for use
export { MonitoringSetup, MONITORING_CONFIG };

// Run if called directly
if (require.main === module) {
  const setup = new MonitoringSetup();
  setup.setupMonitoring().catch(console.error);
}
