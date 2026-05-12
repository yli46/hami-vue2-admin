<template>
  <div>
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="期间">
          <el-date-picker
            v-model="query.month"
            type="month"
            placeholder="选择月份"
            value-format="yyyy-MM"
            style="width: 160px;"
          />
        </el-form-item>
        <el-form-item label="业务单元">
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 160px;">
            <el-option label="车队 1" value="fleet1" />
            <el-option label="车队 2" value="fleet2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="kpi-row">
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">当期吨公里成本（含税）</div>
        <div class="kpi-value">¥ {{ stats.actualUnit }}</div>
        <div class="kpi-meta">本月累计</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">业主官方预算</div>
        <div class="kpi-value">¥ {{ stats.budgetUnit }}</div>
        <div class="kpi-meta">2026 经营测算</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">偏差</div>
        <div class="kpi-value" :class="{ warning: stats.varianceLevel === 'high' }">
          {{ stats.variance > 0 ? '+' : '' }}{{ stats.variance }}%
        </div>
        <div class="kpi-meta">阈值 ±{{ stats.threshold }}%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">利润率（含税）</div>
        <div class="kpi-value">6.3%</div>
        <div class="kpi-meta">业主目标 7.6%</div>
      </el-card>
    </div>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>吨公里成本构成 — 实际 vs 预算</span>
        <div>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small">
        <el-table-column prop="category" label="成本细项（11 项业主官方）" min-width="180" />
        <el-table-column prop="actualAmount" label="实际（元/吨公里）" width="160" align="right">
          <template slot-scope="scope">{{ scope.row.actualAmount.toFixed(5) }}</template>
        </el-table-column>
        <el-table-column prop="actualPct" label="实际占收入比" width="120" align="right">
          <template slot-scope="scope">{{ scope.row.actualPct }}%</template>
        </el-table-column>
        <el-table-column prop="budgetPct" label="业主官方占比" width="120" align="right">
          <template slot-scope="scope">{{ scope.row.budgetPct }}%</template>
        </el-table-column>
        <el-table-column label="偏差" width="100" align="right">
          <template slot-scope="scope">
            <span :class="varianceClass(scope.row)">
              {{ varianceText(scope.row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="threshold" label="阈值" width="80" align="right">
          <template slot-scope="scope">±{{ scope.row.threshold }}%</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row)" size="mini">{{ statusLabel(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataSource" label="数据源" min-width="160" />
      </el-table>
    </el-card>

    <el-card class="trend-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>最近 6 个月趋势</span>
        <span class="muted">单位：元/吨公里</span>
      </div>
      <el-table :data="trendData" border size="small">
        <el-table-column prop="month" label="月份" width="100" align="center" />
        <el-table-column prop="actual" label="实际" width="120" align="right" />
        <el-table-column prop="budget" label="预算" width="120" align="right" />
        <el-table-column label="偏差" width="100" align="right">
          <template slot-scope="scope">
            <span :class="trendVarianceClass(scope.row)">
              {{ trendVarianceText(scope.row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="说明" min-width="200" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'CostDashboard',
  data() {
    return {
      query: { month: '2026-04', unit: '' },
      stats: {
        actualUnit: '0.1832',
        budgetUnit: '0.1802',
        variance: 1.7,
        threshold: 5,
        varianceLevel: 'normal',
        totalTonKm: '128.4'
      },
      tableData: [
        { category: '吨公里加气', actualAmount: 0.06950, actualPct: 35.6, budgetPct: 34.6, threshold: 5, dataSource: '中石化加气站结算（替代广汇/桥湾，待对接）' },
        { category: '吨公里司机工资', actualAmount: 0.03323, actualPct: 17.0, budgetPct: 17.0, threshold: 3, dataSource: '内部趟结台账 + 工资系统' },
        { category: '吨公里 ETC 费用', actualAmount: 0.03200, actualPct: 16.4, budgetPct: 16.1, threshold: 3, dataSource: '山东高速 ETC' },
        { category: '吨公里折旧', actualAmount: 0.02780, actualPct: 14.2, budgetPct: 14.2, threshold: 3, dataSource: '资产台账（11 个月）' },
        { category: '吨公里保险', actualAmount: 0.00771, actualPct: 3.9, budgetPct: 4.0, threshold: 2, dataSource: '保险台账' },
        { category: '吨公里杂费', actualAmount: 0.00650, actualPct: 3.3, budgetPct: 3.1, threshold: 3, dataSource: '内部杂费台账' },
        { category: '吨公里维修费', actualAmount: 0.00380, actualPct: 1.9, budgetPct: 1.9, threshold: 5, dataSource: '维保单据 + 手动录入' },
        { category: '吨公里管理人员工资', actualAmount: 0.00240, actualPct: 1.2, budgetPct: 1.2, threshold: 3, dataSource: '人事系统（管理层）' },
        { category: '吨公里低值易耗', actualAmount: 0.00038, actualPct: 0.2, budgetPct: 0.2, threshold: 5, dataSource: '内部物料台账' },
        { category: '——成本合计', actualAmount: 0.18332, actualPct: 93.7, budgetPct: 92.4, threshold: 3, dataSource: '小计（含税）' },
        { category: '吨公里利润', actualAmount: 0.01176, actualPct: 6.3, budgetPct: 7.6, threshold: 2, dataSource: '收入 − 成本' }
      ],
      trendData: [
        { month: '2025-11', actual: '0.1798', budget: '0.1802', note: '达标' },
        { month: '2025-12', actual: '0.1825', budget: '0.1802', note: '冬季气价小幅上涨' },
        { month: '2026-01', actual: '0.1840', budget: '0.1802', note: '冬季气价持续' },
        { month: '2026-02', actual: '0.1810', budget: '0.1802', note: '达标' },
        { month: '2026-03', actual: '0.1826', budget: '0.1802', note: '春节运量略低' },
        { month: '2026-04', actual: '0.1832', budget: '0.1802', note: '气耗略偏高（接近阈值）' }
      ]
    }
  },
  methods: {
    search() {
      this.$message.info('查询逻辑由后端实现（演示）')
    },
    reset() {
      this.query = { month: '2026-04', unit: '' }
    },
    variance(row) {
      return row.actualPct - row.budgetPct
    },
    varianceText(row) {
      const v = this.variance(row)
      return `${v > 0 ? '+' : ''}${v.toFixed(1)} pp`
    },
    varianceClass(row) {
      const v = Math.abs(this.variance(row))
      if (v > row.threshold) return 'warning-text'
      return ''
    },
    statusLabel(row) {
      const v = Math.abs(this.variance(row))
      if (v > row.threshold) return '超阈值'
      if (v > row.threshold * 0.7) return '接近阈值'
      return '正常'
    },
    statusTag(row) {
      const v = Math.abs(this.variance(row))
      if (v > row.threshold) return 'danger'
      if (v > row.threshold * 0.7) return 'warning'
      return 'success'
    },
    trendVarianceText(row) {
      const v = (parseFloat(row.actual) - parseFloat(row.budget)).toFixed(3)
      return `${v > 0 ? '+' : ''}${v}`
    },
    trendVarianceClass(row) {
      const v = parseFloat(row.actual) - parseFloat(row.budget)
      if (Math.abs(v) > 0.04) return 'warning-text'
      return ''
    }
  }
}
</script>

<style scoped>
.kpi-row {
  display: flex;
  gap: 12px;
  margin: 12px 0;
}

.kpi-card {
  flex: 1;
  border: 1px solid #DCDFE6;
}

.kpi-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.kpi-value.warning {
  color: #F56C6C;
}

.kpi-meta {
  font-size: 12px;
  color: #C0C4CC;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.muted {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.warning-text {
  color: #F56C6C;
  font-weight: 500;
}

.table-card,
.trend-card,
.search-card {
  border: 1px solid #DCDFE6;
}

.trend-card {
  margin-top: 12px;
}
</style>
