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
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 140px;">
            <el-option label="车队 1" value="fleet1" />
            <el-option label="车队 2" value="fleet2" />
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
        <div class="kpi-label">本月趟结总额</div>
        <div class="kpi-value">¥ 482,360</div>
        <div class="kpi-meta">2026-04，含杂费归口</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">司机数</div>
        <div class="kpi-value">112</div>
        <div class="kpi-meta">在岗</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">人均应发</div>
        <div class="kpi-value">¥ 4,307</div>
        <div class="kpi-meta">本月平均</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">杂费归口完整率</div>
        <div class="kpi-value">98.7%</div>
        <div class="kpi-meta">目标 100%</div>
      </el-card>
    </div>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>司机趟结明细 — 2026-04</span>
        <div>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small">
        <el-table-column prop="driverName" label="司机姓名" width="100" />
        <el-table-column prop="driverNo" label="工号" width="90" />
        <el-table-column prop="unit" label="业务单元" width="100" align="center" />
        <el-table-column prop="tripCount" label="趟次" width="80" align="right" />
        <el-table-column prop="baseTrip" label="基础趟结" width="110" align="right">
          <template slot-scope="scope">¥ {{ formatMoney(scope.row.baseTrip) }}</template>
        </el-table-column>
        <el-table-column label="杂费归口" width="180" align="right">
          <template slot-scope="scope">
            ¥ {{ formatMoney(scope.row.miscNormalized) }}
            <span class="muted">/ {{ scope.row.miscItemCount }} 项</span>
          </template>
        </el-table-column>
        <el-table-column prop="bonusOrPenalty" label="奖惩调整" width="110" align="right">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.bonusOrPenalty < 0 }">
              {{ scope.row.bonusOrPenalty >= 0 ? '+' : '' }}{{ formatMoney(scope.row.bonusOrPenalty) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="应发金额" width="120" align="right">
          <template slot-scope="scope">
            <strong>¥ {{ formatMoney(total(scope.row)) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewDetail(scope.row)">明细</el-button>
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
          <span>{{ current.driverName }}（{{ current.driverNo }}）</span>
        </el-form-item>
        <el-form-item label="原应发金额">
          <span>¥ {{ formatMoney(currentTotal) }}</span>
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
          <el-input v-model="adjustForm.reason" type="textarea" :rows="3" placeholder="必填" />
        </el-form-item>
      </el-form>
      <div class="dialog-note">
        调整后需车队长 + 财务双签生效。调整金额超 ¥500 自动触发审批工作流。
      </div>
      <span slot="footer">
        <el-button @click="showAdjust = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">提交</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="`${current.driverName} - 杂费归口明细`" :visible.sync="showDetail" width="640px">
      <el-table :data="miscDetailData" border size="small">
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column prop="type" label="杂费类型" min-width="100" />
        <el-table-column prop="amount" label="金额" width="100" align="right">
          <template slot-scope="scope">¥ {{ scope.row.amount }}</template>
        </el-table-column>
        <el-table-column prop="note" label="说明" min-width="160" />
        <el-table-column label="归口" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.normalized ? 'success' : 'info'" size="mini">
              {{ scope.row.normalized ? '已归口' : '未归口' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="dialog-note">
        归口规则按《核算处理-财务信息收集表》表 3 业主回填后定。当前规则待马总 5/11 确认。
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CostTangJie',
  data() {
    return {
      query: { month: '2026-04', unit: '', driver: '' },
      showDetail: false,
      showAdjust: false,
      current: { driverName: '', driverNo: '', baseTrip: 0, miscNormalized: 0, bonusOrPenalty: 0 },
      adjustForm: { type: 'bonus', amount: 0, reason: '' },
      miscDetailData: [
        { date: '2026-04-03', type: '停车费', amount: 30, note: '哈密-淖毛湖线途中停车', normalized: true },
        { date: '2026-04-08', type: '临时加水', amount: 20, note: '夏季高温补水', normalized: true },
        { date: '2026-04-12', type: '过路过桥', amount: 0, note: '由 ETC 集中代扣，不入趟结', normalized: false },
        { date: '2026-04-18', type: '罚款先行', amount: 200, note: '未走 ETC 通道', normalized: false }
      ],
      tableData: [
        { driverName: '张永刚', driverNo: 'D0023', unit: '车队 1', tripCount: 28, baseTrip: 5600, miscNormalized: 410, miscItemCount: 8, bonusOrPenalty: 200, status: 'pending' },
        { driverName: '李建华', driverNo: 'D0041', unit: '车队 1', tripCount: 32, baseTrip: 6400, miscNormalized: 280, miscItemCount: 5, bonusOrPenalty: -150, status: 'pending' },
        { driverName: '王志远', driverNo: 'D0058', unit: '车队 2', tripCount: 26, baseTrip: 5200, miscNormalized: 360, miscItemCount: 6, bonusOrPenalty: 100, status: 'reviewing' },
        { driverName: '陈志国', driverNo: 'D0067', unit: '车队 1', tripCount: 30, baseTrip: 6000, miscNormalized: 320, miscItemCount: 7, bonusOrPenalty: 0, status: 'paid' },
        { driverName: '刘海滨', driverNo: 'D0072', unit: '车队 2', tripCount: 29, baseTrip: 5800, miscNormalized: 290, miscItemCount: 4, bonusOrPenalty: -300, status: 'pending' }
      ]
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { month: '2026-04', unit: '', driver: '' } },
    total(row) {
      return row.baseTrip + row.miscNormalized + row.bonusOrPenalty
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
      this.$message.success(`已提交调整（演示）—— ${this.adjustForm.amount > 500 ? '触发审批工作流' : '车队长 + 财务双签'}`)
      this.showAdjust = false
    },
    formatMoney(v) { return Number(v).toLocaleString('zh-CN') },
    currentTotal() { return (this.current.baseTrip || 0) + (this.current.miscNormalized || 0) + (this.current.bonusOrPenalty || 0) },
    statusLabel(s) { return s === 'pending' ? '待审核' : s === 'reviewing' ? '审核中' : '已发放' },
    statusTag(s) { return s === 'pending' ? '' : s === 'reviewing' ? 'warning' : 'success' }
  }
}
</script>

<style scoped>
.search-card,
.kpi-card,
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
