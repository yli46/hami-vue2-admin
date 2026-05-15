<template>
  <div>
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="月份">
          <el-date-picker
            v-model="query.month"
            type="month"
            placeholder="选择月份"
            value-format="yyyy-MM"
            style="width: 160px;"
          />
        </el-form-item>
        <el-form-item label="业务单元">
          <el-select v-model="query.unit" placeholder="车队" clearable disabled style="width: 120px;">
            <el-option label="车队" value="fleet" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体">
          <el-select v-model="query.subject" placeholder="全部" clearable style="width: 130px;">
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
          </el-select>
        </el-form-item>
        <el-form-item label="司机">
          <el-input v-model="query.driver" placeholder="姓名 / 工号" clearable style="width: 160px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="kpi-row">
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">本月应发总额</div>
        <div class="kpi-value">¥ {{ formatMoney(stats.totalPayable) }}</div>
        <div class="kpi-meta">{{ query.month }} · 含考核 + 杂费 + 调整</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">司机数</div>
        <div class="kpi-value">{{ stats.driverCount }}</div>
        <div class="kpi-meta">在岗 · 车队全部</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">人均应发</div>
        <div class="kpi-value">¥ {{ formatMoney(stats.avgPayable) }}</div>
        <div class="kpi-meta">本月平均</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">杂费归口完整率</div>
        <div class="kpi-value">{{ stats.miscRate }}%</div>
        <div class="kpi-meta">目标 100%</div>
      </el-card>
    </div>

    <el-card class="kpi-note" shadow="never">
      <div class="kpi-note-content">
        <strong>司机考核 11 项细则（业主官方，月度合计 1700 元）</strong>：
        基础工资 500 + 气耗 300 + 时效 200 + 安全 200 + 煤损 200 + 随车工具 80 + 路线偏离 50 + 单趟杂费 50 + 应急维修 50 + 低值易耗 50 + 放空 20。
        来源：《车队绩效考核思路（初稿1）》Sheet 司机考核（M004）。趟结工资和杂费按 5/12 马伶俐口径拆开记录、合并支付。
      </div>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>司机趟结明细 — {{ query.month }}</span>
        <div>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small" style="width: 100%;">
        <el-table-column prop="driverName" label="司机姓名" width="100" fixed="left" />
        <el-table-column prop="driverNo" label="工号" width="90" fixed="left" />
        <el-table-column prop="subject" label="主体" width="90" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.subject === '红树林' ? 'danger' : 'primary'" effect="plain">
              {{ scope.row.subject }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tripCount" label="趟次" width="70" align="right" />
        <el-table-column label="基础500" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.k01 }}</template>
        </el-table-column>
        <el-table-column label="气耗300" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.k02 }}</template>
        </el-table-column>
        <el-table-column label="时效200" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.k03 }}</template>
        </el-table-column>
        <el-table-column label="安全200" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.k04 }}</template>
        </el-table-column>
        <el-table-column label="煤损200" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.k05 }}</template>
        </el-table-column>
        <el-table-column label="随车工具80" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.k06 }}</template>
        </el-table-column>
        <el-table-column label="路线偏离50" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.k07 }}</template>
        </el-table-column>
        <el-table-column label="单趟杂费50" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.k08 }}</template>
        </el-table-column>
        <el-table-column label="应急维修50" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.k09 }}</template>
        </el-table-column>
        <el-table-column label="低值易耗50" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.k10 }}</template>
        </el-table-column>
        <el-table-column label="放空20" width="80" align="right">
          <template slot-scope="scope">{{ scope.row.k11 }}</template>
        </el-table-column>
        <el-table-column label="考核合计" width="110" align="right">
          <template slot-scope="scope">
            <strong>¥ {{ formatMoney(kpiTotal(scope.row)) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="杂费（独立科目）" width="170" align="right">
          <template slot-scope="scope">
            ¥ {{ formatMoney(scope.row.miscFee) }}
            <span class="muted">/ {{ scope.row.miscItemCount }} 项</span>
            <el-button type="text" size="mini" @click="viewDetail(scope.row)" style="margin-left: 4px;">明细</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="bonusOrPenalty" label="奖惩调整" width="110" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.bonusOrPenalty < 0 }">
              {{ scope.row.bonusOrPenalty >= 0 ? '+' : '' }}{{ formatMoney(scope.row.bonusOrPenalty) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="应发金额" width="130" align="right">
          <template slot-scope="scope">
            <strong>¥ {{ formatMoney(payable(scope.row)) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="adjust(scope.row)" v-if="scope.row.status !== 'paid'">调整</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="tableData.length" :page-size="20" />
      </div>
    </el-card>

    <el-dialog :title="`调整 ${current.driverName} 趟结`" :visible.sync="showAdjust" width="540px">
      <el-form :model="adjustForm" label-width="100px" size="small">
        <el-form-item label="司机">
          <span>{{ current.driverName }}（{{ current.driverNo }} · {{ current.subject }}）</span>
        </el-form-item>
        <el-form-item label="原应发金额">
          <span>¥ {{ formatMoney(payable(current)) }}</span>
        </el-form-item>
        <el-form-item label="调整类型">
          <el-radio-group v-model="adjustForm.type">
            <el-radio label="bonus">奖励</el-radio>
            <el-radio label="penalty">扣减</el-radio>
            <el-radio label="correction">数据更正</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整金额">
          <el-input-number v-model="adjustForm.amount" :step="100" />
          <span style="margin-left: 8px; color: #606266;">元（正数=增 / 负数=减）</span>
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="3" placeholder="必填，详细说明" />
        </el-form-item>
      </el-form>
      <div class="dialog-note">
        调整后回到待审核，生产队长审核 + 财务复核生效。调整金额超 ¥500 自动触发审批工作流。
      </div>
      <span slot="footer">
        <el-button @click="showAdjust = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">提交</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="`${current.driverName} - 杂费归口明细`" :visible.sync="showDetail" width="640px">
      <el-table :data="miscDetailData" border size="small">
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column prop="type" label="杂费类型" min-width="120" />
        <el-table-column prop="amount" label="金额" width="100" align="right">
          <template slot-scope="scope">¥ {{ scope.row.amount }}</template>
        </el-table-column>
        <el-table-column prop="note" label="说明" min-width="200" />
        <el-table-column label="归口" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.normalized ? 'success' : 'info'" size="mini">
              {{ scope.row.normalized ? '已归口' : '未归口' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="dialog-note">
        杂费归口规则按《核算处理-财务信息收集表》表 3 业主回填后定。杂费与趟结按 5/12 马伶俐口径在预算科目上拆开记录、合并支付。
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CostTangJie',
  data() {
    return {
      query: { month: '2026-04', unit: 'fleet', subject: '', driver: '' },
      stats: {
        totalPayable: 488260,
        driverCount: 112,
        avgPayable: 4359,
        miscRate: 98.7
      },
      showDetail: false,
      showAdjust: false,
      current: { driverName: '', driverNo: '', subject: '', miscFee: 0, bonusOrPenalty: 0 },
      adjustForm: { type: 'bonus', amount: 0, reason: '' },
      miscDetailData: [
        { date: '2026-04-03', type: '停车费', amount: 30, note: '哈密-淖毛湖线途中停车', normalized: true },
        { date: '2026-04-08', type: '临时加水', amount: 20, note: '夏季高温补水', normalized: true },
        { date: '2026-04-12', type: '过路过桥', amount: 0, note: '由 ETC 集中代扣，不入趟结', normalized: false },
        { date: '2026-04-18', type: '罚款先行', amount: 200, note: '未走 ETC 通道', normalized: false }
      ],
      tableData: [
        { driverName: '张永刚', driverNo: 'D0023', subject: '红树林', tripCount: 28,
          k01: 500, k02: 280, k03: 200, k04: 200, k05: 200, k06: 80, k07: 50, k08: 50, k09: 50, k10: 50, k11: 20,
          miscFee: 410, miscItemCount: 8, bonusOrPenalty: 200, status: 'pending' },
        { driverName: '李建华', driverNo: 'D0041', subject: '红树林', tripCount: 32,
          k01: 500, k02: 300, k03: 200, k04: 200, k05: 180, k06: 80, k07: 50, k08: 50, k09: 50, k10: 50, k11: 20,
          miscFee: 280, miscItemCount: 5, bonusOrPenalty: -150, status: 'pending' },
        { driverName: '王志远', driverNo: 'D0058', subject: '新鹏运', tripCount: 26,
          k01: 500, k02: 260, k03: 180, k04: 200, k05: 200, k06: 80, k07: 30, k08: 50, k09: 50, k10: 50, k11: 20,
          miscFee: 360, miscItemCount: 6, bonusOrPenalty: 100, status: 'reviewing' },
        { driverName: '陈志国', driverNo: 'D0067', subject: '红树林', tripCount: 30,
          k01: 500, k02: 300, k03: 200, k04: 200, k05: 200, k06: 80, k07: 50, k08: 50, k09: 50, k10: 50, k11: 20,
          miscFee: 320, miscItemCount: 7, bonusOrPenalty: 0, status: 'paid' },
        { driverName: '刘海滨', driverNo: 'D0072', subject: '新鹏运', tripCount: 29,
          k01: 500, k02: 220, k03: 200, k04: 150, k05: 200, k06: 80, k07: 0, k08: 50, k09: 50, k10: 50, k11: 20,
          miscFee: 290, miscItemCount: 4, bonusOrPenalty: -300, status: 'pending' },
        { driverName: '马云飞', driverNo: 'D0085', subject: '新鹏运', tripCount: 31,
          k01: 500, k02: 300, k03: 200, k04: 200, k05: 200, k06: 80, k07: 50, k08: 50, k09: 50, k10: 50, k11: 20,
          miscFee: 380, miscItemCount: 8, bonusOrPenalty: 150, status: 'reviewing' }
      ]
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { month: '2026-04', unit: 'fleet', subject: '', driver: '' } },
    kpiTotal(row) {
      return row.k01 + row.k02 + row.k03 + row.k04 + row.k05 + row.k06 + row.k07 + row.k08 + row.k09 + row.k10 + row.k11
    },
    payable(row) {
      return this.kpiTotal(row) + row.miscFee + row.bonusOrPenalty
    },
    viewDetail(row) {
      this.current = row
      this.showDetail = true
    },
    adjust(row) {
      this.current = row
      this.adjustForm = { type: 'bonus', amount: 0, reason: '' }
      this.showAdjust = true
    },
    submitAdjust() {
      if (!this.adjustForm.reason) {
        this.$message.warning('请填写调整原因')
        return
      }
      const overThreshold = Math.abs(this.adjustForm.amount) > 500
      this.$message.success(`已提交（演示）—— ${overThreshold ? '调整 >¥500，已触发审批工作流' : '生产队长 + 财务双签生效'}`)
      this.showAdjust = false
    },
    formatMoney(v) { return Number(v).toLocaleString('zh-CN') },
    statusLabel(s) { return s === 'pending' ? '待审核' : s === 'reviewing' ? '审核中' : '已发放' },
    statusTag(s) { return s === 'pending' ? '' : s === 'reviewing' ? 'warning' : 'success' }
  }
}
</script>

<style scoped>
.search-card,
.kpi-card,
.kpi-note,
.table-card {
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

.kpi-note {
  background: #FAFBFC;
  margin-bottom: 12px;
}

.kpi-note-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.7;
}

.kpi-note-content strong {
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
}

.warning-text {
  color: #F56C6C;
  font-weight: 500;
}

.pagination {
  margin-top: 12px;
  text-align: right;
}

.dialog-note {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
  background: #FAFBFC;
  padding: 8px 12px;
  border-radius: 2px;
  border: 1px solid #E4E7ED;
}
</style>
