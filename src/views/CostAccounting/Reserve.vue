<template>
  <div>
    <el-card class="rule-note" shadow="never">
      <div class="rule-content">
        <strong>备用金管理（0424 喻静原话：应急走安技部备用金）</strong>：覆盖车辆抛锚救援 / 医疗应急 / 罚款先行 / 其他 4 类场景。审批级别按金额自动判定（VR-134-002）：≤¥500 单签 = 安全主管；>¥500 双签 = 生产队长 + 安全主管。已核销不可作废（VR-134-007）。月底不滚存。
      </div>
    </el-card>

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
        <el-form-item label="场景">
          <el-select v-model="query.scenario" placeholder="全部" clearable style="width: 160px;">
            <el-option label="车辆抛锚救援" value="breakdown" />
            <el-option label="医疗应急" value="medical" />
            <el-option label="罚款先行" value="fine" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体">
          <el-select v-model="query.subject" placeholder="全部" clearable style="width: 130px;">
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
          </el-select>
        </el-form-item>
        <el-form-item label="核销状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px;">
            <el-option label="待核销" value="pending" />
            <el-option label="已核销" value="cleared" />
            <el-option label="逾期未核销" value="overdue" />
            <el-option label="已作废" value="cancelled" />
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
        <div class="kpi-label">本月额度</div>
        <div class="kpi-value">¥ {{ formatMoney(stats.quota) }}</div>
        <div class="kpi-meta">月末不滚存 · 🔴 额度待业主回填</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">已申领</div>
        <div class="kpi-value">¥ {{ formatMoney(stats.used) }}</div>
        <div class="kpi-meta">{{ stats.usedRate }}%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">剩余可申领</div>
        <div class="kpi-value">¥ {{ formatMoney(stats.remaining) }}</div>
        <div class="kpi-meta">{{ stats.remainingRate }}%</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">使用率状态</div>
        <div class="kpi-value">
          <el-tag :type="usageTag" size="medium">{{ usageLabel }}</el-tag>
        </div>
        <div class="kpi-meta">目标 40-80%</div>
      </el-card>
    </div>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>备用金申领记录</span>
        <div>
          <el-button type="primary" icon="el-icon-plus" size="small" @click="openApply">申领</el-button>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small">
        <el-table-column prop="applyTime" label="申领时间" width="150" />
        <el-table-column prop="scenario" label="场景" width="120" />
        <el-table-column prop="driverOrFleet" label="司机/车队" width="200" align="left" />
        <el-table-column prop="subject" label="主体" width="90" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.subject === '红树林'" size="mini" type="danger" effect="plain">红树林</el-tag>
            <el-tag v-else-if="scope.row.subject === '新鹏运'" size="mini" type="primary" effect="plain">新鹏运</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="申领金额" width="110" align="right">
          <template slot-scope="scope">¥ {{ formatMoney(scope.row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="申领事由" min-width="240" />
        <el-table-column prop="approver" label="审批人" width="170" align="center" />
        <el-table-column label="核销状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="核销截止" width="120" align="center">
          <template slot-scope="scope">
            <span :class="{ 'warning-text': scope.row.status === 'overdue' }">{{ scope.row.dueDate }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" @click="clearOff(scope.row)" v-if="scope.row.status === 'pending'">核销</el-button>
            <el-button type="text" size="mini" class="danger-text" @click="cancel(scope.row)" v-if="scope.row.status === 'pending'">作废</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="tableData.length" :page-size="20" />
      </div>
    </el-card>

    <el-dialog title="申领备用金" :visible.sync="showApply" width="560px">
      <el-form :model="applyForm" :rules="rules" ref="applyForm" label-width="100px" size="small">
        <el-form-item label="场景" prop="scenario">
          <el-select v-model="applyForm.scenario" placeholder="请选择" style="width: 100%;">
            <el-option label="车辆抛锚救援" value="breakdown" />
            <el-option label="医疗应急" value="medical" />
            <el-option label="罚款先行" value="fine" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体" prop="subject">
          <el-select v-model="applyForm.subject" placeholder="请选择" style="width: 100%;">
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
          </el-select>
        </el-form-item>
        <el-form-item label="司机/车队" prop="target">
          <el-input v-model="applyForm.target" placeholder="如：张永刚 D0023 / 车队 · 新鹏运" />
        </el-form-item>
        <el-form-item label="申领金额" prop="amount">
          <el-input-number v-model="applyForm.amount" :min="100" :step="100" @change="onAmountChange" />
          <span style="margin-left: 8px; color: #606266;">元</span>
        </el-form-item>
        <el-form-item label="申领事由" prop="reason">
          <el-input v-model="applyForm.reason" type="textarea" :rows="3" placeholder="必填" />
        </el-form-item>
        <el-form-item label="审批级别">
          <el-tag :type="applyForm.amount > 500 ? 'warning' : 'info'" size="medium">
            {{ applyForm.amount > 500 ? '双签（车队长 + 安技部主任）' : '单签（安技部主任）' }}
          </el-tag>
          <span class="muted" style="margin-left: 8px;">按 VR-134-002 自动判定</span>
        </el-form-item>
      </el-form>
      <div class="dialog-note">
        额度规则按《核算处理-财务信息收集表》表 4 业主回填后定（🔴 待业主回填月度额度 + 各场景上限）。已核销不可作废（VR-134-007）。
      </div>
      <span slot="footer">
        <el-button @click="showApply = false">取消</el-button>
        <el-button type="primary" @click="submitApply">提交</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="`备用金详情 - ${currentRow.scenario}`" :visible.sync="showDetail" width="680px">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="场景">{{ currentRow.scenario }}</el-descriptions-item>
        <el-descriptions-item label="申领时间">{{ currentRow.applyTime }}</el-descriptions-item>
        <el-descriptions-item label="对象">{{ currentRow.driverOrFleet }}</el-descriptions-item>
        <el-descriptions-item label="主体">{{ currentRow.subject || '—' }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥ {{ formatMoney(currentRow.amount) }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ currentRow.approver }}</el-descriptions-item>
        <el-descriptions-item label="核销截止">{{ currentRow.dueDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(currentRow.status)" size="mini">{{ statusLabel(currentRow.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申领事由" :span="2">{{ currentRow.reason }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">处理流程</el-divider>
      <el-table :data="processFlow" border size="small">
        <el-table-column prop="time" label="时间" width="150" />
        <el-table-column prop="actor" label="操作人" width="140" align="center" />
        <el-table-column prop="action" label="动作" width="120" align="center" />
        <el-table-column prop="note" label="说明" min-width="200" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CostReserve',
  data() {
    return {
      query: { month: '2026-04', scenario: '', subject: '', status: '' },
      showApply: false,
      showDetail: false,
      currentRow: {},
      stats: {
        quota: 50000,
        used: 31600,
        usedRate: 63.2,
        remaining: 18400,
        remainingRate: 36.8
      },
      applyForm: { scenario: '', subject: '', target: '', amount: 1000, reason: '' },
      rules: {
        scenario: [{ required: true, message: '场景必选', trigger: 'change' }],
        subject: [{ required: true, message: '主体必选', trigger: 'change' }],
        target: [{ required: true, message: '司机/车队必填', trigger: 'blur' }],
        amount: [{ required: true, message: '金额必填（VR-134-001）', trigger: 'blur' }],
        reason: [{ required: true, message: '申领事由必填', trigger: 'blur' }]
      },
      processFlow: [
        { time: '2026-04-08 22:30', actor: '张永刚', action: '提交申领', note: '车辆抛锚现场拍照上传' },
        { time: '2026-04-08 22:42', actor: '生产队长（红树林）', action: '一级签字', note: '同意，紧急情况' },
        { time: '2026-04-08 23:05', actor: '安全主管（王海政）', action: '二级签字', note: '同意拨款 5000 元' },
        { time: '2026-04-15 16:30', actor: '马伶俐（公司财务）', action: '核销', note: '维修发票 + 拖车票据齐全，金额一致' }
      ],
      tableData: [
        { applyTime: '2026-04-08 22:30', scenario: '车辆抛锚救援', driverOrFleet: '张永刚 D0023 / 车队', subject: '红树林', amount: 5000, reason: '京新高速 K3580 处车辆故障，现场维修+拖车', approver: '生产队长 + 安全主管', status: 'cleared', dueDate: '2026-04-15' },
        { applyTime: '2026-04-15 14:20', scenario: '医疗应急', driverOrFleet: '李建华 D0041 / 车队', subject: '红树林', amount: 2000, reason: '司机高温作业脱水送医', approver: '安全主管', status: 'cleared', dueDate: '2026-04-18' },
        { applyTime: '2026-04-20 09:15', scenario: '罚款先行', driverOrFleet: '陈志国 D0067 / 车队', subject: '红树林', amount: 1500, reason: '未走 ETC 通道罚款（司机责任，需追回）', approver: '生产队长 + 安全主管', status: 'pending', dueDate: '2026-04-30' },
        { applyTime: '2026-04-25 16:40', scenario: '其他', driverOrFleet: '车队 · 新鹏运调度', subject: '新鹏运', amount: 3000, reason: 'LNG 加气站现场设备故障，临时充值', approver: '生产队长 + 安全主管', status: 'pending', dueDate: '2026-05-02' },
        { applyTime: '2026-04-26 11:00', scenario: '罚款先行', driverOrFleet: '王志远 D0058 / 车队', subject: '新鹏运', amount: 400, reason: '违停罚款（已追回）', approver: '安全主管', status: 'cleared', dueDate: '2026-05-03' },
        { applyTime: '2026-03-28 10:00', scenario: '罚款先行', driverOrFleet: '刘海滨 D0072 / 车队', subject: '新鹏运', amount: 800, reason: '超速罚款（司机责任）', approver: '生产队长 + 安全主管', status: 'overdue', dueDate: '2026-04-04' }
      ]
    }
  },
  computed: {
    usageTag() {
      if (this.stats.usedRate < 40) return 'info'
      if (this.stats.usedRate <= 80) return 'success'
      return 'danger'
    },
    usageLabel() {
      if (this.stats.usedRate < 40) return '偏低'
      if (this.stats.usedRate <= 80) return '正常'
      return '紧张'
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { month: '2026-04', scenario: '', subject: '', status: '' } },
    openApply() {
      this.applyForm = { scenario: '', subject: '', target: '', amount: 1000, reason: '' }
      this.showApply = true
    },
    onAmountChange() {
      // 触发审批级别计算（自动展示）
    },
    submitApply() {
      this.$refs.applyForm.validate(valid => {
        if (!valid) return
        const dual = this.applyForm.amount > 500
        this.$message.success(`已提交申领（演示）—— ${dual ? '触发双签流程' : '走单签流程'}`)
        this.showApply = false
      })
    },
    viewDetail(row) {
      this.currentRow = row
      this.showDetail = true
    },
    clearOff(row) {
      this.$prompt('核销说明（凭据上传由后端实现）', `核销备用金 - ${row.scenario}`, {
        confirmButtonText: '核销',
        cancelButtonText: '取消',
        inputPlaceholder: '如：维修发票编号 / 实际花费'
      }).then(() => {
        this.$message.success(`已核销 ${row.scenario}（演示）`)
      }).catch(() => {})
    },
    cancel(row) {
      this.$confirm(
        `确认作废 ${row.scenario} 的申领（¥${this.formatMoney(row.amount)}）？作废后不可恢复。已核销不可作废（VR-134-007）。`,
        '作废确认',
        { confirmButtonText: '确认作废', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        this.$message.success('已作废（演示）')
      }).catch(() => {})
    },
    formatMoney(v) { return Number(v).toLocaleString('zh-CN') },
    statusLabel(s) {
      if (s === 'pending') return '待核销'
      if (s === 'cleared') return '已核销'
      if (s === 'overdue') return '逾期未核销'
      if (s === 'cancelled') return '已作废'
      return s
    },
    statusTag(s) {
      if (s === 'pending') return 'warning'
      if (s === 'cleared') return 'success'
      if (s === 'overdue') return 'danger'
      if (s === 'cancelled') return 'info'
      return ''
    }
  }
}
</script>

<style scoped>
.search-card,
.kpi-card,
.rule-note,
.table-card {
  border: 1px solid #DCDFE6;
}

.rule-note {
  background: #FAFBFC;
  margin-bottom: 12px;
}

.rule-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.7;
}

.rule-content strong {
  color: #303133;
  margin-right: 6px;
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

.warning-text {
  color: #F56C6C;
  font-weight: 500;
}

.danger-text {
  color: #F56C6C;
}

.muted {
  font-size: 12px;
  color: #909399;
}

.pagination {
  margin-top: 12px;
  text-align: right;
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
</style>
