<template>
  <div class="page">
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
        <el-form-item label="切分维度">
          <el-radio-group v-model="query.dim" size="small">
            <el-radio-button label="unit">业务单元</el-radio-button>
            <el-radio-button label="account">费用科目</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="业务单元">
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 140px;">
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
        <div class="kpi-label">2026 年度预算总额</div>
        <div class="kpi-value">¥ 15,700 万</div>
        <div class="kpi-meta">全公司</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">截至本月实际累计</div>
        <div class="kpi-value">¥ 6,015 万</div>
        <div class="kpi-meta">2026-04 末</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">预算执行率</div>
        <div class="kpi-value">38.3%</div>
        <div class="kpi-meta">同期目标 33.3%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">剩余预算</div>
        <div class="kpi-value">¥ 9,685 万</div>
        <div class="kpi-meta">本年度剩余 8 个月</div>
      </el-card>
    </div>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>预算分解 vs 实际归集 — 按{{ query.dim === 'unit' ? '业务单元' : '费用科目' }}</span>
        <div>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="currentData" border size="small">
        <el-table-column :label="query.dim === 'unit' ? '业务单元' : '费用科目'" min-width="140">
          <template slot-scope="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="预算（万元）" width="130" align="right">
          <template slot-scope="scope">{{ scope.row.budget }}</template>
        </el-table-column>
        <el-table-column label="本月实际" width="120" align="right">
          <template slot-scope="scope">{{ scope.row.actualMonth }}</template>
        </el-table-column>
        <el-table-column label="累计实际" width="130" align="right">
          <template slot-scope="scope">
            <strong>{{ scope.row.actualYTD }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="执行率" width="200">
          <template slot-scope="scope">
            <div class="exec-cell">
              <el-progress
                :percentage="scope.row.execPct"
                :status="execStatus(scope.row.execPct)"
                :format="() => scope.row.execPct + '%'"
                :stroke-width="14"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="同期目标" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.targetPct }}%</template>
        </el-table-column>
        <el-table-column label="偏差" width="100" align="right">
          <template slot-scope="scope">
            <span :class="varianceClass(scope.row)">
              {{ scope.row.execPct - scope.row.targetPct > 0 ? '+' : '' }}{{ (scope.row.execPct - scope.row.targetPct).toFixed(1) }} pp
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row)" size="mini">{{ statusLabel(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="drillDown(scope.row)">下钻明细</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="data-flow" shadow="never">
      <div slot="header">
        <span>数据来源说明</span>
      </div>
      <ul class="flow-list">
        <li><strong>预算数据</strong>：来自 132 概算管理（年度大盘）+ 133 预算编制（月度细化），已生效版本</li>
        <li><strong>实际数据</strong>：来自 134 核算处理实时归集——磅单收入 / 加气结算 / ETC / 趟结工资 / 维保单 / 备用金核销 / 手动录入复核通过</li>
        <li><strong>更新频率</strong>：实际数据日终更新，预算执行率本月内实时刷新</li>
        <li><strong>本看板不重新建模</strong>，仅做汇总展示。任何调整在源模块（132 / 133 / 134）操作</li>
      </ul>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'BudgetCoordination',
  data() {
    return {
      query: { month: '2026-04', dim: 'unit', unit: '' },
      unitData: [
        { name: '车队 1', budget: 8500, actualMonth: 850, actualYTD: 3360, execPct: 39.5, targetPct: 33.3 },
        { name: '车队 2', budget: 7200, actualMonth: 706, actualYTD: 2655, execPct: 36.9, targetPct: 33.3 }
      ],
      accountData: [
        { name: 'LNG 燃料费', budget: 4710, actualMonth: 502, actualYTD: 1928, execPct: 40.9, targetPct: 33.3 },
        { name: '路桥费', budget: 2826, actualMonth: 273, actualYTD: 1083, execPct: 38.3, targetPct: 33.3 },
        { name: '司机趟结工资', budget: 3454, actualMonth: 326, actualYTD: 1281, execPct: 37.1, targetPct: 33.3 },
        { name: '司机基本工资', budget: 942, actualMonth: 82, actualYTD: 320, execPct: 34.0, targetPct: 33.3 },
        { name: '车辆维保费', budget: 1256, actualMonth: 142, actualYTD: 522, execPct: 41.6, targetPct: 33.3 },
        { name: '车辆折旧', budget: 1884, actualMonth: 157, actualYTD: 628, execPct: 33.3, targetPct: 33.3 },
        { name: '车辆保险', budget: 471, actualMonth: 0, actualYTD: 0, execPct: 0.0, targetPct: 33.3 },
        { name: '其他直接成本', budget: 157, actualMonth: 14, actualYTD: 53, execPct: 33.8, targetPct: 33.3 }
      ]
    }
  },
  computed: {
    currentData() {
      return this.query.dim === 'unit' ? this.unitData : this.accountData
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { month: '2026-04', dim: 'unit', unit: '' } },
    drillDown(row) { this.$message.info(`下钻 ${row.name} 明细数据`) },
    execStatus(pct) {
      if (pct > 40) return 'warning'
      if (pct < 25) return 'exception'
      return 'success'
    },
    varianceClass(row) {
      const v = Math.abs(row.execPct - row.targetPct)
      if (v > 5) return 'warning-text'
      return ''
    },
    statusLabel(row) {
      const v = row.execPct - row.targetPct
      if (v > 5) return '执行偏快'
      if (v < -5) return '执行偏慢'
      return '正常'
    },
    statusTag(row) {
      const v = Math.abs(row.execPct - row.targetPct)
      if (v > 5) return 'warning'
      return 'success'
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

.search-card,
.kpi-card,
.table-card,
.data-flow {
  border: 1px solid #DCDFE6;
}

.kpi-row {
  display: flex;
  gap: 12px;
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

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exec-cell {
  padding: 4px 0;
}

.warning-text {
  color: #F56C6C;
  font-weight: 500;
}

.flow-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  font-size: 13px;
  line-height: 2;
}

.flow-list strong {
  color: #303133;
}
</style>
