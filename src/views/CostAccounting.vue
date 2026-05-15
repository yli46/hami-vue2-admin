<template>
  <div class="page">
    <el-card class="scope-note" shadow="never">
      <div class="scope-content">
        <strong>本期范围（5/15 用户裁决）</strong>：聚焦汽运主营业务直接成本 11 项细分（加气 / 司机工资 / ETC / 折旧 / 保险 / 杂费 / 维修 / 管理工资 / 低值易耗），按业主官方权重（来源经营计划测算 + 5/12 马伶俐调研）日终跑批归集，偏差超阈值进入 P003 预警处置。综合费用 / 办公分摊 / 行政分摊不纳入主流程；手动录入仅作边缘场景兜底。
      </div>
    </el-card>

    <el-card class="role-note" shadow="never">
      <div class="role-content">
        <strong>财务角色</strong>：红树林集团管理层（拍板权 · 红色预警终审 · 关账拍板）／ 公司财务（哈密普发 · 马伶俐分管 · 组织归集核算）／ 子公司新鹏运财务（新鹏运主体核算）。车队板块下分红树林 / 新鹏运双主体，按 5/12 业主规则自动分账。
      </div>
    </el-card>

    <el-tabs v-model="activeTab" type="card" class="cost-tabs">
      <el-tab-pane label="吨公里成本看板" name="dashboard">
        <cost-dashboard v-if="activeTab === 'dashboard'" />
      </el-tab-pane>
      <el-tab-pane label="司机趟结工资明细" name="tang-jie">
        <cost-tang-jie v-if="activeTab === 'tang-jie'" />
      </el-tab-pane>
      <el-tab-pane label="超阈值预警工作台" name="alerts">
        <cost-alerts v-if="activeTab === 'alerts'" />
      </el-tab-pane>
      <el-tab-pane label="备用金管理" name="reserve">
        <cost-reserve v-if="activeTab === 'reserve'" />
      </el-tab-pane>
      <el-tab-pane name="manual">
        <span slot="label"><i class="el-icon-edit-outline"></i> 手动录入兜底</span>
        <cost-manual v-if="activeTab === 'manual'" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import CostDashboard from './CostAccounting/Dashboard.vue'
import CostTangJie from './CostAccounting/TangJie.vue'
import CostAlerts from './CostAccounting/Alerts.vue'
import CostReserve from './CostAccounting/Reserve.vue'
import CostManual from './CostAccounting/Manual.vue'

export default {
  name: 'CostAccounting',
  components: { CostDashboard, CostTangJie, CostAlerts, CostReserve, CostManual },
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

.scope-note,
.role-note {
  border: 1px solid #DCDFE6;
  background: #FAFBFC;
}

.scope-content,
.role-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.7;
}

.scope-content strong,
.role-content strong {
  color: #303133;
  margin-right: 6px;
}
</style>
