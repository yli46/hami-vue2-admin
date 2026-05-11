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
        <div class="kpi-label">当期吨公里成本</div>
        <div class="kpi-value">¥ {{ stats.actualUnit }}</div>
        <div class="kpi-meta">本月累计</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">预算吨公里成本</div>
        <div class="kpi-value">¥ {{ stats.budgetUnit }}</div>
        <div class="kpi-meta">2026 年度</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">偏差</div>
        <div class="kpi-value" :class="{ warning: stats.varianceLevel === 'high' }">
          {{ stats.variance > 0 ? '+' : '' }}{{ stats.variance }}%
        </div>
        <div class="kpi-meta">阈值 ±{{ stats.threshold }}%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">累计运量</div>
        <div class="kpi-value">{{ stats.totalTonKm }}</div>
        <div class="kpi-meta">万吨公里</div>
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
        <el-table-column prop="category" label="成本细项" min-width="140" />
        <el-table-column prop="actualAmount" label="实际金额（元/吨公里）" width="170" align="right">
          <template slot-scope="scope">{{ scope.row.actualAmount.toFixed(4) }}</template>
        </el-table-column>
        <el-table-column prop="actualPct" label="实际占比" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.actualPct }}%</template>
        </el-table-column>
        <el-table-column prop="budgetPct" label="预算占比" width="100" align="right">
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
        actualUnit: '1.382',
        budgetUnit: '1.310',
        variance: 5.5,
        threshold: 5,
        varianceLevel: 'high',
        totalTonKm: '128.4'
      },
      tableData: [
        { category: 'LNG 燃料费', actualAmount: 0.4423, actualPct: 32.0, budgetPct: 30.0, threshold: 5, dataSource: '中石化加气站结算（待对接）' },
        { category: '路桥费', actualAmount: 0.2487, actualPct: 18.0, budgetPct: 18.0, threshold: 3, dataSource: '山东高速 ETC' },
        { category: '司机趟结工资', actualAmount: 0.3042, actualPct: 22.0, budgetPct: 22.0, threshold: 3, dataSource: '内部趟结台账' },
        { category: '车辆维保费', actualAmount: 0.1244, actualPct: 9.0, budgetPct: 8.0, threshold: 5, dataSource: '维保单据 + 手动录入' },
        { category: '车辆折旧', actualAmount: 0.1382, actualPct: 10.0, budgetPct: 12.0, threshold: 3, dataSource: '资产台账' },
        { category: '车辆保险', actualAmount: 0.0414, actualPct: 3.0, budgetPct: 3.0, threshold: 2, dataSource: '保险台账' },
        { category: '司机基本工资（非趟结）', actualAmount: 0.0691, actualPct: 5.0, budgetPct: 6.0, threshold: 3, dataSource: '人事系统' },
        { category: '其他直接成本', actualAmount: 0.0138, actualPct: 1.0, budgetPct: 1.0, threshold: 5, dataSource: '手动录入' }
      ],
      trendData: [
        { month: '2025-11', actual: '1.298', budget: '1.310', note: '正常' },
        { month: '2025-12', actual: '1.325', budget: '1.310', note: '冬季气价小幅上涨' },
        { month: '2026-01', actual: '1.340', budget: '1.310', note: '冬季气价持续' },
        { month: '2026-02', actual: '1.305', budget: '1.310', note: '正常' },
        { month: '2026-03', actual: '1.353', budget: '1.310', note: '春节后人员调整' },
        { month: '2026-04', actual: '1.382', budget: '1.310', note: '燃料超阈值，已发预警' }
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
