<template>
  <div class="page">
    <el-card class="scope-note" shadow="never">
      <div class="scope-content">
        <strong>本期范围（经 5/10 与卢总确认）</strong>：聚焦汽运主营业务直接成本（燃料 / 路桥 / 趟结 / 维保 / 折旧 / 保险 / 加气结算）。不含综合费用、办公分摊、跨部门行政分摊。边缘场景由手动录入兜底。
      </div>
    </el-card>

    <el-tabs v-model="activeTab" type="card" class="cost-tabs">
      <el-tab-pane label="吨公里成本看板" name="dashboard">
        <cost-dashboard v-if="activeTab === 'dashboard'" />
      </el-tab-pane>
      <el-tab-pane label="预算执行预警" name="alerts">
        <cost-alerts v-if="activeTab === 'alerts'" />
      </el-tab-pane>
      <el-tab-pane label="趟结工资台账" name="tang-jie">
        <cost-tang-jie v-if="activeTab === 'tang-jie'" />
      </el-tab-pane>
      <el-tab-pane label="安技部备用金" name="reserve">
        <cost-reserve v-if="activeTab === 'reserve'" />
      </el-tab-pane>
      <el-tab-pane name="manual">
        <span slot="label"><i class="el-icon-edit-outline"></i> 手动录入</span>
        <cost-manual v-if="activeTab === 'manual'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import CostDashboard from './CostAccounting/Dashboard.vue'
import CostAlerts from './CostAccounting/Alerts.vue'
import CostTangJie from './CostAccounting/TangJie.vue'
import CostReserve from './CostAccounting/Reserve.vue'
import CostManual from './CostAccounting/Manual.vue'

export default {
  name: 'CostAccounting',
  components: { CostDashboard, CostAlerts, CostTangJie, CostReserve, CostManual },
  data() {
    return {
      activeTab: 'dashboard'
    }
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scope-note {
  border: 1px solid #DCDFE6;
  background: #FAFBFC;
}

.scope-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.7;
}

.scope-content strong {
  color: #303133;
  margin-right: 6px;
}
</style>
