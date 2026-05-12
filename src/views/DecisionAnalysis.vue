<template>
  <div class="page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="周期类型">
          <el-select v-model="query.type" placeholder="全部" clearable style="width: 120px;">
            <el-option label="月度" value="monthly" />
            <el-option label="季度" value="quarterly" />
            <el-option label="年度" value="yearly" />
          </el-select>
        </el-form-item>
        <el-form-item label="期间">
          <el-date-picker
            v-model="query.dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            value-format="yyyy-MM"
            style="width: 240px;"
          />
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
        <div class="kpi-label">本期收入</div>
        <div class="kpi-value">¥ 6,824 万</div>
        <div class="kpi-meta">同比 +12.4%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">本期成本</div>
        <div class="kpi-value">¥ 5,892 万</div>
        <div class="kpi-meta">同比 +14.1%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">本期毛利</div>
        <div class="kpi-value">¥ 932 万</div>
        <div class="kpi-meta">毛利率 13.7%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">预算执行率</div>
        <div class="kpi-value">96.8%</div>
        <div class="kpi-meta">在 ±5% 阈值内</div>
      </el-card>
    </div>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>决算列表</span>
        <div>
          <el-button type="primary" icon="el-icon-plus" size="small" @click="openCreate">新建决算</el-button>
          <el-button icon="el-icon-lock" size="small" plain @click="openLock">关账操作</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small">
        <el-table-column prop="period" label="决算期间" width="140" align="center" />
        <el-table-column prop="type" label="类型" width="80" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" type="info">{{ typeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="revenue" label="收入（万元）" width="120" align="right">
          <template slot-scope="scope">{{ scope.row.revenue }}</template>
        </el-table-column>
        <el-table-column prop="cost" label="成本（万元）" width="120" align="right">
          <template slot-scope="scope">{{ scope.row.cost }}</template>
        </el-table-column>
        <el-table-column prop="profit" label="毛利（万元）" width="120" align="right">
          <template slot-scope="scope">
            <strong>{{ scope.row.profit }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="profitRate" label="毛利率" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.profitRate }}</template>
        </el-table-column>
        <el-table-column prop="budgetExec" label="预算执行率" width="110" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': isOutOfRange(scope.row.budgetExec) }">{{ scope.row.budgetExec }}</span>
          </template>
        </el-table-column>
        <el-table-column label="关账状态" width="110" align="center">
          <template slot-scope="scope">
            <el-tag :type="lockTag(scope.row.lockStatus)" size="mini">{{ lockLabel(scope.row.lockStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="closedAt" label="关账时间" width="150" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewReport(scope.row)">查看报告</el-button>
            <el-button type="text" size="mini" @click="exportReport(scope.row)">导出</el-button>
            <el-button type="text" size="mini" @click="requestUnlock(scope.row)" v-if="scope.row.lockStatus === 'locked'">申请解锁</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="tableData.length" :page-size="20" />
      </div>
    </el-card>

    <el-card class="report-preview" shadow="never">
      <div slot="header">
        <span>决算报告模板预览（待业主确认）</span>
      </div>
      <div class="report-skeleton">
        <div class="section">
          <h4>① 收支总览</h4>
          <ul>
            <li>总收入 / 总成本 / 毛利 / 同比</li>
            <li>按业务单元（4 板块）+ 主体（红树林 / 新鹏运，仅车队适用）拆分</li>
          </ul>
        </div>
        <div class="section">
          <h4>② 业务单元利润分析</h4>
          <ul>
            <li>各业务单元收入构成（车队按主体拆分；廊道暂只跟踪投资；加气站 / 制氢工厂按试产期处理）</li>
            <li>各业务单元成本构成（吨公里成本细项，仅车队全考核）</li>
          </ul>
        </div>
        <div class="section">
          <h4>③ 异常项排查</h4>
          <ul>
            <li>超阈值预警明细 + 处置闭环情况</li>
            <li>手动录入条目 + 复核记录</li>
          </ul>
        </div>
        <div class="section">
          <h4>④ 预算执行偏差分析</h4>
          <ul>
            <li>按科目对比预算 vs 实际</li>
            <li>偏差原因归因 + 下期建议</li>
          </ul>
        </div>
        <div class="hint">
          报告模板的具体章节结构、字段定义、排版风格 → 待业主回填《核算处理-财务信息收集表》表 6 后定稿。
        </div>
      </div>
    </el-card>

    <el-dialog :title="`${currentRow.period} 决算报告 — 完整版`" :visible.sync="showReport" width="900px" top="5vh">
      <div class="report-doc">
        <div class="report-header">
          <h2>{{ currentRow.period }} {{ typeLabel(currentRow.type) }}决算报告</h2>
          <div class="report-meta">
            <span>编制单位：哈密普发新能源</span>
            <span>编制日期：{{ currentRow.closedAt || '编制中' }}</span>
            <span>编制人：马伶俐</span>
          </div>
        </div>

        <h3>① 收支总览</h3>
        <el-descriptions :column="3" size="small" border>
          <el-descriptions-item label="本期收入">{{ currentRow.revenue }} 万元</el-descriptions-item>
          <el-descriptions-item label="本期成本">{{ currentRow.cost }} 万元</el-descriptions-item>
          <el-descriptions-item label="本期毛利"><strong>{{ currentRow.profit }} 万元</strong></el-descriptions-item>
          <el-descriptions-item label="毛利率">{{ currentRow.profitRate }}</el-descriptions-item>
          <el-descriptions-item label="预算执行率">{{ currentRow.budgetExec }}</el-descriptions-item>
          <el-descriptions-item label="同比">+12.4%</el-descriptions-item>
        </el-descriptions>

        <h3>② 业务单元利润分析</h3>
        <el-table :data="reportUnitData" border size="small">
          <el-table-column prop="unit" label="业务单元" min-width="100" />
          <el-table-column prop="subject" label="主体" width="90" align="center">
            <template slot-scope="scope">{{ scope.row.subject || '—' }}</template>
          </el-table-column>
          <el-table-column prop="revenue" label="收入（万元）" width="110" align="right" />
          <el-table-column prop="cost" label="成本（万元）" width="110" align="right" />
          <el-table-column prop="profit" label="毛利（万元）" width="110" align="right" />
          <el-table-column prop="profitRate" label="毛利率" width="90" align="right" />
          <el-table-column prop="contribution" label="毛利贡献占比" width="120" align="right" />
        </el-table>

        <h3>③ 异常项排查</h3>
        <el-table :data="reportAnomalies" border size="small">
          <el-table-column prop="item" label="异常项" min-width="180" />
          <el-table-column prop="impact" label="财务影响（万元）" width="150" align="right" />
          <el-table-column prop="closed" label="处置闭环" width="100" align="center">
            <template slot-scope="scope">
              <el-tag size="mini" :type="scope.row.closed ? 'success' : 'warning'">
                {{ scope.row.closed ? '已闭环' : '处置中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="owner" label="责任人" width="100" align="center" />
        </el-table>

        <h3>④ 预算执行偏差分析</h3>
        <el-table :data="reportBudgetVariance" border size="small">
          <el-table-column prop="account" label="科目" min-width="120" />
          <el-table-column prop="budget" label="预算（万元）" width="110" align="right" />
          <el-table-column prop="actual" label="实际（万元）" width="110" align="right" />
          <el-table-column prop="variance" label="偏差（万元）" width="110" align="right" />
          <el-table-column prop="variancePct" label="偏差率" width="90" align="right" />
          <el-table-column prop="cause" label="原因" min-width="160" />
        </el-table>

        <h3>⑤ 下期建议</h3>
        <ul class="report-suggestions">
          <li>LNG 燃料费偏高，建议下期与中石化重新议价或调整路线优先级</li>
          <li>车辆维保费突增车辆需重点核查（车队 · 新鹏运主体部分车辆）</li>
          <li>司机趟结归口规则待细化（待马总回填表 3 后）</li>
        </ul>

        <div class="report-footnote">
          说明：本报告为决算系统自动生成模板。具体章节结构、字段定义、排版风格 → 待业主回填《核算处理-财务信息收集表》表 6 后定稿。
        </div>
      </div>
      <span slot="footer">
        <el-button @click="showReport = false">关闭</el-button>
        <el-button type="primary" icon="el-icon-download" @click="downloadReport">下载 Word</el-button>
      </span>
    </el-dialog>

    <el-dialog title="新建决算" :visible.sync="showCreate" width="520px">
      <el-form :model="form" label-width="100px" size="small">
        <el-form-item label="周期类型">
          <el-radio-group v-model="form.type">
            <el-radio label="monthly">月度</el-radio>
            <el-radio label="quarterly">季度</el-radio>
            <el-radio label="yearly">年度</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="决算期间">
          <el-date-picker v-model="form.period" type="month" value-format="yyyy-MM" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="业务单元">
          <el-select v-model="form.unit" placeholder="请选择" style="width: 100%;">
            <el-option label="全公司（合并 4 板块）" value="all" />
            <el-option label="车队" value="fleet" />
            <el-option label="廊道（建设期）" value="corridor" />
            <el-option label="加气站（天山乡站等）" value="gas-tsx" />
            <el-option label="制氢工厂" value="h2-plant" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体" v-if="form.unit === 'fleet'">
          <el-select v-model="form.subject" placeholder="车队需选主体（合并决算可留空）" clearable style="width: 100%;">
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建</el-button>
      </span>
    </el-dialog>

    <el-dialog title="关账操作" :visible.sync="showLock" width="500px">
      <el-form :model="lockForm" label-width="100px" size="small">
        <el-form-item label="关账期间">
          <el-date-picker v-model="lockForm.period" type="month" value-format="yyyy-MM" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="关账时点">
          <el-date-picker v-model="lockForm.lockTime" type="datetime" value-format="yyyy-MM-dd HH:mm" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="lockForm.note" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <div class="dialog-note">
        关账规则（窗口期、锁定字段、解锁审批）按《核算处理-财务信息收集表》表 6 业主回填后定。
      </div>
      <span slot="footer">
        <el-button @click="showLock = false">取消</el-button>
        <el-button type="primary" @click="submitLock">关账</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'DecisionAnalysis',
  data() {
    return {
      query: { type: '', dateRange: [], unit: '', subject: '' },
      showCreate: false,
      showLock: false,
      showReport: false,
      currentRow: {},
      form: { type: 'monthly', period: '', unit: 'all', subject: '' },
      lockForm: { period: '', lockTime: '', note: '' },
      reportUnitData: [
        { unit: '车队', subject: '红树林', revenue: '932', cost: '802', profit: '130', profitRate: '13.9%', contribution: '53.3%' },
        { unit: '车队', subject: '新鹏运', revenue: '824', cost: '710', profit: '114', profitRate: '13.8%', contribution: '46.7%' },
        { unit: '廊道（建设期）', subject: '', revenue: '—', cost: '—', profit: '—', profitRate: '建设期不考核', contribution: '—' },
        { unit: '加气站（天山乡站等）', subject: '', revenue: '—', cost: '—', profit: '—', profitRate: '试产期不考核', contribution: '—' },
        { unit: '制氢工厂', subject: '', revenue: '—', cost: '—', profit: '—', profitRate: '建设期不考核', contribution: '—' }
      ],
      reportAnomalies: [
        { item: 'LNG 燃料费占比超阈值（+2.0 pp）', impact: '-32.6', closed: false, owner: '马伶俐' },
        { item: '车队 · 新鹏运维保费突增', impact: '-12.4', closed: true, owner: '新鹏运财务' },
        { item: '司机趟结环比异常（+18%）', impact: '-8.2', closed: true, owner: '马伶俐' }
      ],
      reportBudgetVariance: [
        { account: 'LNG 燃料费', budget: '530', actual: '562', variance: '+32', variancePct: '+6.0%', cause: '4 月气价上涨 8%' },
        { account: '路桥费', budget: '316', actual: '273', variance: '-43', variancePct: '-13.6%', cause: '部分线路优化' },
        { account: '司机趟结', budget: '388', actual: '326', variance: '-62', variancePct: '-16.0%', cause: '春节后部分司机调休' },
        { account: '车辆维保', budget: '141', actual: '142', variance: '+1', variancePct: '+0.7%', cause: '正常' },
        { account: '车辆折旧', budget: '212', actual: '157', variance: '-55', variancePct: '-25.9%', cause: '部分车辆未提折旧' }
      ],
      tableData: [
        { period: '2026-04', type: 'monthly', revenue: '1,756', cost: '1,512', profit: '244', profitRate: '13.9%', budgetExec: '102.3%', lockStatus: 'open', closedAt: '—' },
        { period: '2026-03', type: 'monthly', revenue: '1,684', cost: '1,453', profit: '231', profitRate: '13.7%', budgetExec: '98.4%', lockStatus: 'locked', closedAt: '2026-04-05 24:00' },
        { period: '2026-02', type: 'monthly', revenue: '1,580', cost: '1,420', profit: '160', profitRate: '10.1%', budgetExec: '94.2%', lockStatus: 'locked', closedAt: '2026-03-05 24:00' },
        { period: '2026 Q1', type: 'quarterly', revenue: '4,944', cost: '4,253', profit: '691', profitRate: '14.0%', budgetExec: '97.5%', lockStatus: 'locked', closedAt: '2026-04-15 24:00' }
      ]
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { type: '', dateRange: [], unit: '', subject: '' } },
    openCreate() { this.showCreate = true },
    openLock() { this.showLock = true },
    submitCreate() { this.$message.success('决算已创建（演示）'); this.showCreate = false },
    submitLock() {
      this.$confirm('确认关账？关账后该期数据将锁定，调整需走解锁审批流程。', '关账确认', {
        confirmButtonText: '关账',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message.success('已关账（演示）')
        this.showLock = false
      }).catch(() => {})
    },
    viewReport(row) {
      this.currentRow = row
      this.showReport = true
    },
    exportReport(row) {
      this.$message.success(`已导出 ${row.period} 决算报告（演示，由后端生成 Word/PDF）`)
    },
    downloadReport() {
      this.$message.success(`已下载 ${this.currentRow.period} 决算报告 Word 版（演示）`)
    },
    requestUnlock(row) {
      this.$prompt('解锁原因（必填）', '申请解锁', {
        confirmButtonText: '提交申请',
        cancelButtonText: '取消',
        inputType: 'textarea'
      }).then(() => {
        this.$message.success(`已提交解锁申请，等待财务总监审批`)
      }).catch(() => {})
    },
    typeLabel(t) { return t === 'monthly' ? '月度' : t === 'quarterly' ? '季度' : '年度' },
    lockLabel(s) { return s === 'open' ? '进行中' : '已关账' },
    lockTag(s) { return s === 'open' ? 'warning' : 'success' },
    isOutOfRange(v) {
      const num = parseFloat(v)
      return num > 105 || num < 95
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
.report-preview {
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

.warning-text {
  color: #F56C6C;
  font-weight: 500;
}

.pagination {
  margin-top: 12px;
  text-align: right;
}

.report-skeleton .section {
  margin-bottom: 12px;
}

.report-skeleton h4 {
  font-size: 13px;
  color: #303133;
  margin: 0 0 6px 0;
}

.report-skeleton ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  font-size: 12px;
  line-height: 2;
}

.report-skeleton .hint {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
  background: #FAFBFC;
  padding: 8px 12px;
  border-radius: 2px;
  border: 1px solid #E4E7ED;
}

.dialog-note {
  margin: 8px 0;
  font-size: 12px;
  color: #909399;
  background: #FAFBFC;
  padding: 8px 12px;
  border-radius: 2px;
  border: 1px solid #E4E7ED;
}

.report-doc {
  font-size: 13px;
  color: #303133;
  line-height: 1.7;
}

.report-doc h2 {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #24558A;
  margin: 0 0 8px 0;
}

.report-doc h3 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 16px 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #E4E7ED;
}

.report-header {
  text-align: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #DCDFE6;
}

.report-meta {
  display: flex;
  justify-content: space-around;
  font-size: 12px;
  color: #606266;
  margin-top: 8px;
}

.report-suggestions {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  line-height: 2;
}

.report-footnote {
  margin-top: 16px;
  font-size: 12px;
  color: #909399;
  background: #FAFBFC;
  padding: 8px 12px;
  border-radius: 2px;
  border: 1px solid #E4E7ED;
}
</style>
