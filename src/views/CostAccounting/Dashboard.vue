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
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 200px;" @change="onUnitChange">
            <el-option label="车队" value="fleet" />
            <el-option label="廊道（建设期）" value="corridor" />
            <el-option label="加气站（业主自有 · 天山乡站等）" value="gas-tsx" />
            <el-option label="制氢工厂" value="h2-plant" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体">
          <el-select
            v-model="query.subject"
            placeholder="仅车队适用"
            clearable
            :disabled="query.unit !== 'fleet' && query.unit !== ''"
            style="width: 140px;"
          >
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
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
        <div class="kpi-meta">本月累计 · 实际归集</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">业主官方基线（含税）</div>
        <div class="kpi-value">¥ {{ stats.budgetUnit }}</div>
        <div class="kpi-meta">2026 经营计划测算</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">偏差</div>
        <div class="kpi-value" :class="{ 'warning-text': stats.varianceLevel !== 'normal' }">
          {{ stats.variance > 0 ? '+' : '' }}{{ stats.variance }}%
        </div>
        <div class="kpi-meta">阈值 ±{{ stats.threshold }}%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">利润率（含税）</div>
        <div class="kpi-value" :class="{ 'warning-text': stats.profitRate < 7 }">{{ stats.profitRate }}%</div>
        <div class="kpi-meta">业主目标 7.6%</div>
      </el-card>
    </div>

    <el-card class="entity-note" shadow="never">
      <div class="entity-content">
        <strong>双主体归集规则（5/12 业主原话）</strong>：加气 / ETC → 红树林账；司机工资 / 杂费 / 维修 → 新鹏运账；折旧 / 保险 → 看车辆归属（vehicle.entityOwner）。氢车 → 新鹏运；LNG 车 → 看上牌地。
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>吨公里成本构成 — 业主官方 11 项细分（实际 vs 基线）</span>
        <div>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small" :row-class-name="rowClass">
        <el-table-column prop="category" label="成本细项" min-width="180" />
        <el-table-column prop="accountCode" label="ERP 科目" width="110" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.accountCode">{{ scope.row.accountCode }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="entityOwner" label="归集主体" width="110" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.entityOwner === '红树林'" size="mini" type="danger" effect="plain">红树林</el-tag>
            <el-tag v-else-if="scope.row.entityOwner === '新鹏运'" size="mini" type="primary" effect="plain">新鹏运</el-tag>
            <el-tag v-else-if="scope.row.entityOwner === '看车辆归属'" size="mini" effect="plain">看车辆归属</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实际（元/吨公里）" width="150" align="right">
          <template slot-scope="scope">
            <span v-if="scope.row.actualAmount !== null">{{ scope.row.actualAmount.toFixed(5) }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="actualPct" label="实际占收入比" width="120" align="right">
          <template slot-scope="scope">{{ scope.row.actualPct }}%</template>
        </el-table-column>
        <el-table-column prop="budgetPct" label="业主官方占比" width="120" align="right">
          <template slot-scope="scope">{{ scope.row.budgetPct }}%</template>
        </el-table-column>
        <el-table-column label="偏差" width="100" align="right">
          <template slot-scope="scope">
            <span :class="varianceClass(scope.row)">{{ varianceText(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="threshold" label="阈值" width="80" align="right">
          <template slot-scope="scope">
            <span v-if="scope.row.threshold !== null">±{{ scope.row.threshold }} pp</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row)" size="mini">{{ statusLabel(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataSource" label="数据源" min-width="200" />
      </el-table>
    </el-card>

    <el-card class="trend-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>最近 6 个月趋势</span>
        <span class="muted">单位：元/吨公里 · 业主官方基线 0.18020 元</span>
      </div>
      <el-table :data="trendData" border size="small">
        <el-table-column prop="month" label="月份" width="110" align="center" />
        <el-table-column prop="actual" label="实际" width="120" align="right" />
        <el-table-column prop="budget" label="基线" width="120" align="right" />
        <el-table-column label="偏差" width="120" align="right">
          <template slot-scope="scope">
            <span :class="trendVarianceClass(scope.row)">{{ trendVarianceText(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="说明" min-width="220" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'CostDashboard',
  data() {
    return {
      query: { month: '2026-04', unit: '', subject: '' },
      stats: {
        actualUnit: '0.18332',
        budgetUnit: '0.18020',
        variance: 1.7,
        threshold: 5,
        varianceLevel: 'normal',
        profitRate: 6.3
      },
      tableData: [
        { category: '吨公里加气', accountCode: '660214', entityOwner: '红树林', actualAmount: 0.06950, actualPct: 35.6, budgetPct: 34.6, threshold: 3, dataSource: '中石化加气站结算（替代广汇 / 桥湾，本期目标）' },
        { category: '吨公里司机工资', accountCode: '660209', entityOwner: '新鹏运', actualAmount: 0.03323, actualPct: 17.0, budgetPct: 17.0, threshold: 2, dataSource: '内部趟结台账 + 工资系统' },
        { category: '吨公里 ETC 费用', accountCode: '660214', entityOwner: '红树林', actualAmount: 0.03200, actualPct: 16.4, budgetPct: 16.1, threshold: 2, dataSource: '山东高速 ETC 文件（信联科技直连）' },
        { category: '吨公里折旧（11 个月）', accountCode: '660225', entityOwner: '看车辆归属', actualAmount: 0.02780, actualPct: 14.2, budgetPct: 14.2, threshold: 2, dataSource: '资产台账' },
        { category: '吨公里保险', accountCode: '660219', entityOwner: '看车辆归属', actualAmount: 0.00771, actualPct: 3.9, budgetPct: 4.0, threshold: 1, dataSource: '保险台账' },
        { category: '吨公里杂费', accountCode: '660299', entityOwner: '新鹏运', actualAmount: 0.00609, actualPct: 3.1, budgetPct: 3.1, threshold: 1, dataSource: '内部杂费台账' },
        { category: '吨公里维修费', accountCode: '660214', entityOwner: '新鹏运', actualAmount: 0.00380, actualPct: 1.9, budgetPct: 1.9, threshold: 0.5, dataSource: '维保单据 + 手动录入' },
        { category: '吨公里管理人员工资', accountCode: '660209', entityOwner: '新鹏运', actualAmount: 0.00240, actualPct: 1.2, budgetPct: 1.2, threshold: 1, dataSource: '人事系统（管理层）' },
        { category: '吨公里低值易耗', accountCode: '660299', entityOwner: '新鹏运', actualAmount: 0.00038, actualPct: 0.2, budgetPct: 0.2, threshold: 0.5, dataSource: '内部物料台账' },
        { category: '——成本合计', accountCode: '', entityOwner: '', actualAmount: 0.18291, actualPct: 93.7, budgetPct: 92.4, threshold: 2, dataSource: '小计（含税）', isSummary: true },
        { category: '吨公里利润', accountCode: '', entityOwner: '', actualAmount: 0.01176, actualPct: 6.3, budgetPct: 7.6, threshold: null, dataSource: '收入 − 成本', isProfit: true },
        { category: '吨公里收入（基准）', accountCode: '', entityOwner: '', actualAmount: 0.19508, actualPct: 100.0, budgetPct: 100.0, threshold: null, dataSource: '来源 [M002] 经营计划测算', isBaseline: true }
      ],
      trendData: [
        { month: '2025-11', actual: '0.17980', budget: '0.18020', note: '达标' },
        { month: '2025-12', actual: '0.18250', budget: '0.18020', note: '冬季气价小幅上涨' },
        { month: '2026-01', actual: '0.18400', budget: '0.18020', note: '冬季气价持续' },
        { month: '2026-02', actual: '0.18100', budget: '0.18020', note: '达标' },
        { month: '2026-03', actual: '0.18260', budget: '0.18020', note: '春节运量略低' },
        { month: '2026-04', actual: '0.18332', budget: '0.18020', note: '气耗略偏高（接近阈值）' }
      ]
    }
  },
  methods: {
    search() {
      this.$message.info('查询逻辑由后端实现（演示）')
    },
    reset() {
      this.query = { month: '2026-04', unit: '', subject: '' }
    },
    onUnitChange(v) {
      if (v !== 'fleet' && v !== '') {
        this.query.subject = ''
        this.$message.info('主体筛选仅在车队板块下生效（5/12 业主官方）')
      }
    },
    variance(row) {
      return row.actualPct - row.budgetPct
    },
    varianceText(row) {
      if (row.threshold === null) return '—'
      const v = this.variance(row)
      return `${v > 0 ? '+' : ''}${v.toFixed(1)} pp`
    },
    varianceClass(row) {
      if (row.threshold === null) return ''
      const v = Math.abs(this.variance(row))
      if (v > row.threshold) return 'warning-text'
      return ''
    },
    statusLabel(row) {
      if (row.threshold === null) return '—'
      const v = Math.abs(this.variance(row))
      if (v > row.threshold) return '超阈值'
      if (v > row.threshold * 0.7) return '接近阈值'
      return '正常'
    },
    statusTag(row) {
      if (row.threshold === null) return 'info'
      const v = Math.abs(this.variance(row))
      if (v > row.threshold) return 'danger'
      if (v > row.threshold * 0.7) return 'warning'
      return 'success'
    },
    rowClass({ row }) {
      if (row.isSummary) return 'row-summary'
      if (row.isProfit) return 'row-profit'
      if (row.isBaseline) return 'row-baseline'
      return ''
    },
    trendVarianceText(row) {
      const v = (parseFloat(row.actual) - parseFloat(row.budget)).toFixed(5)
      return `${v > 0 ? '+' : ''}${v}`
    },
    trendVarianceClass(row) {
      const v = parseFloat(row.actual) - parseFloat(row.budget)
      if (Math.abs(v) > 0.004) return 'warning-text'
      return ''
    }
  }
}
</script>

<style scoped>
.search-card,
.kpi-card,
.entity-note,
.table-card,
.trend-card {
  border: 1px solid #DCDFE6;
}

.search-card {
  margin-bottom: 12px;
}

.kpi-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.kpi-card {
  flex: 1;
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

.kpi-meta {
  font-size: 12px;
  color: #C0C4CC;
}

.entity-note {
  background: #FAFBFC;
  margin-bottom: 12px;
}

.entity-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.7;
}

.entity-content strong {
  color: #303133;
  margin-right: 6px;
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

.trend-card {
  margin-top: 12px;
}
</style>

<style>
.row-summary {
  background: #F1F4F6;
  font-weight: 500;
}

.row-profit {
  background: #FAFBFC;
  font-weight: 500;
}

.row-baseline {
  background: #FAFBFC;
  color: #909399;
}
</style>
