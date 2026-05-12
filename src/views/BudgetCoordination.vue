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
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 160px;">
            <el-option label="车队" value="fleet" />
            <el-option label="廊道（建设期）" value="corridor" />
            <el-option label="加气站（天山乡站等）" value="gas-tsx" />
            <el-option label="制氢工厂" value="h2-plant" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体">
          <el-select v-model="query.subject" placeholder="全部" clearable style="width: 130px;">
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
        <el-table-column v-if="query.dim === 'unit'" label="主体" width="90" align="center">
          <template slot-scope="scope">{{ scope.row.subject || '—' }}</template>
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

    <el-dialog :title="`${currentRow.name}${currentRow.subject ? ' · ' + currentRow.subject : ''} - 下钻明细`" :visible.sync="showDrill" width="900px" top="6vh">
      <el-descriptions :column="3" size="small" border>
        <el-descriptions-item :label="query.dim === 'unit' ? '业务单元' : '费用科目'">{{ currentRow.name }}{{ currentRow.subject ? ' · ' + currentRow.subject : '' }}</el-descriptions-item>
        <el-descriptions-item label="预算">¥ {{ currentRow.budget }} 万</el-descriptions-item>
        <el-descriptions-item label="累计实际">¥ {{ currentRow.actualYTD }} 万</el-descriptions-item>
        <el-descriptions-item label="执行率">{{ currentRow.execPct }}%</el-descriptions-item>
        <el-descriptions-item label="同期目标">{{ currentRow.targetPct }}%</el-descriptions-item>
        <el-descriptions-item label="偏差">{{ (currentRow.execPct - currentRow.targetPct).toFixed(1) }} pp</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">按月度细化（2026 年）</el-divider>
      <el-table :data="drillMonthly" border size="small">
        <el-table-column prop="month" label="月份" width="80" align="center" />
        <el-table-column prop="budget" label="月度预算" width="120" align="right">
          <template slot-scope="scope">¥ {{ scope.row.budget }} 万</template>
        </el-table-column>
        <el-table-column prop="actual" label="月度实际" width="120" align="right">
          <template slot-scope="scope">¥ {{ scope.row.actual }} 万</template>
        </el-table-column>
        <el-table-column prop="execPct" label="执行率" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.execPct }}%</template>
        </el-table-column>
        <el-table-column prop="variance" label="偏差（万元）" width="120" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': Math.abs(scope.row.variance) > 30 }">{{ scope.row.variance > 0 ? '+' : '' }}{{ scope.row.variance }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="200" />
      </el-table>

      <el-divider content-position="left">数据来源拆解</el-divider>
      <el-table :data="drillSources" border size="small">
        <el-table-column prop="source" label="数据源" min-width="160" />
        <el-table-column prop="module" label="所属模块" width="120" align="center" />
        <el-table-column prop="amount" label="本期金额（万元）" width="150" align="right" />
        <el-table-column prop="share" label="占比" width="80" align="right">
          <template slot-scope="scope">{{ scope.row.share }}%</template>
        </el-table-column>
      </el-table>
    </el-dialog>

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
      query: { month: '2026-04', dim: 'unit', unit: '', subject: '' },
      showDrill: false,
      currentRow: {},
      drillMonthly: [
        { month: '1月', budget: '708', actual: '685', execPct: 96.8, variance: -23, note: '正常' },
        { month: '2月', budget: '708', actual: '632', execPct: 89.3, variance: -76, note: '春节运量略降' },
        { month: '3月', budget: '708', actual: '720', execPct: 101.7, variance: 12, note: '业务恢复' },
        { month: '4月', budget: '708', actual: '745', execPct: 105.2, variance: 37, note: 'LNG 燃料超支' }
      ],
      drillSources: [
        { source: '陇能磅单收入', module: '134 核算', amount: '1,856', share: 55.3 },
        { source: '中石化加气结算', module: '134 核算', amount: '648', share: 19.3 },
        { source: 'ETC 路桥费', module: '134 核算', amount: '342', share: 10.2 },
        { source: '司机趟结工资台账', module: '134 核算', amount: '410', share: 12.2 },
        { source: '手动录入（已复核）', module: '134 核算', amount: '104', share: 3.1 }
      ],
      unitData: [
        { name: '车队', subject: '红树林', budget: 13500, actualMonth: 1320, actualYTD: 5232, execPct: 38.8, targetPct: 33.3 },
        { name: '车队', subject: '新鹏运', budget: 11200, actualMonth: 1180, actualYTD: 4685, execPct: 41.8, targetPct: 33.3 },
        { name: '廊道（建设期）', subject: '', budget: 480000, actualMonth: 32000, actualYTD: 156000, execPct: 32.5, targetPct: 33.3 },
        { name: '加气站（天山乡站等）', subject: '', budget: 7400, actualMonth: 0, actualYTD: 0, execPct: 0.0, targetPct: 33.3 },
        { name: '制氢工厂', subject: '', budget: 12000, actualMonth: 0, actualYTD: 0, execPct: 0.0, targetPct: 33.3 }
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
    reset() { this.query = { month: '2026-04', dim: 'unit', unit: '', subject: '' } },
    drillDown(row) {
      this.currentRow = row
      this.showDrill = true
    },
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
