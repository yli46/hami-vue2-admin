<template>
  <div class="page">
    <!-- 角色切换（演示用，便于查看不同角色的权限差异）-->
    <el-card class="role-card" shadow="never">
      <div class="role-row">
        <span class="role-label">当前角色（演示）</span>
        <el-radio-group v-model="currentRole" size="small">
          <el-radio-button label="group-admin">红树林集团管理层</el-radio-button>
          <el-radio-button label="company-finance">公司财务（马伶俐）</el-radio-button>
          <el-radio-button label="subsidiary-finance">子公司新鹏运财务</el-radio-button>
        </el-radio-group>
        <span class="role-tip">{{ roleTip }}</span>
      </div>
    </el-card>

    <!-- 顶部 KPI 卡 -->
    <div class="kpi-row">
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">2026 年度资源总盘合计</div>
        <div class="kpi-value">¥ {{ formatMoney(kpiTotal) }} 万</div>
        <div class="kpi-meta">4 板块累加</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">已分配合计</div>
        <div class="kpi-value">¥ {{ formatMoney(kpiAllocated) }} 万</div>
        <div class="kpi-meta">来源 133 已生效预算</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">待分配合计</div>
        <div class="kpi-value" :class="{ warning: kpiBalance < 0 }">¥ {{ formatMoney(kpiBalance) }} 万</div>
        <div class="kpi-meta">= 总盘 − 已分配</div>
      </el-card>
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">超额板块数</div>
        <div class="kpi-value" :class="{ warning: kpiOverCount > 0 }">{{ kpiOverCount }}</div>
        <div class="kpi-meta">已分配 &gt; 总盘</div>
      </el-card>
    </div>

    <!-- 查询区 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="业务单元">
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 180px;">
            <el-option label="车队" value="fleet" />
            <el-option label="廊道（建设期）" value="corridor" />
            <el-option label="加气站（天山乡站等）" value="gas-tsx" />
            <el-option label="制氢工厂" value="h2-plant" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体">
          <el-select v-model="query.subject" placeholder="全部" clearable style="width: 140px;">
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
          </el-select>
        </el-form-item>
        <el-form-item label="年度">
          <el-select v-model="query.year" style="width: 120px;">
            <el-option label="2026" value="2026" />
            <el-option label="2027" value="2027" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <div>
          <span>业务单元年度资源池</span>
          <span class="muted">每条记录 = 业务单元 × 主体 × 年度</span>
        </div>
        <div>
          <el-button v-if="canCreate" type="primary" icon="el-icon-plus" size="small" @click="openCreate">新增</el-button>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="filteredData" border stripe size="small">
        <el-table-column prop="unitName" label="业务单元" min-width="120" />
        <el-table-column prop="subject" label="主体" width="100" align="center">
          <template slot-scope="scope">{{ scope.row.subject || '—' }}</template>
        </el-table-column>
        <el-table-column prop="year" label="年度" width="80" align="center" />
        <el-table-column prop="totalAmount" label="资源总盘（万元）" width="160" align="right">
          <template slot-scope="scope">
            <span v-if="scope.row.totalAmount === null" class="pending">🔴 待业主提供</span>
            <span v-else>{{ formatMoney(scope.row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="allocated" label="已分配（万元）" width="140" align="right">
          <template slot-scope="scope">{{ formatMoney(scope.row.allocated) }}</template>
        </el-table-column>
        <el-table-column prop="balance" label="待分配（万元）" width="140" align="right">
          <template slot-scope="scope">
            <span v-if="scope.row.totalAmount === null">—</span>
            <span v-else :class="{ warning: scope.row.balance < 0 }">{{ formatMoney(scope.row.balance) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataSource" label="数据来源" min-width="160" />
        <el-table-column prop="creator" label="创建人" width="100" align="center" />
        <el-table-column prop="updatedAt" label="最近更新" width="150" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="openDetail(scope.row)">详情</el-button>
            <el-button v-if="canEdit(scope.row)" type="text" size="mini" @click="openEdit(scope.row)">编辑</el-button>
            <el-button v-if="canDelete" type="text" size="mini" class="danger-text" @click="confirmDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="filteredData.length" :page-size="20" />
      </div>
    </el-card>

    <!-- 新增 / 编辑 弹窗 -->
    <el-dialog :title="isEdit ? '编辑资源池' : '新增资源池'" :visible.sync="showForm" width="640px">
      <el-form :model="form" label-width="140px" size="small" :rules="formRules" ref="formRef">
        <el-form-item label="业务单元" prop="unit">
          <el-select v-model="form.unit" placeholder="请选择" style="width: 100%;" :disabled="isEdit" @change="onUnitChange">
            <el-option label="车队" value="fleet" />
            <el-option label="廊道（建设期）" value="corridor" />
            <el-option label="加气站（天山乡站等）" value="gas-tsx" />
            <el-option label="制氢工厂" value="h2-plant" />
          </el-select>
        </el-form-item>
        <el-form-item label="主体" prop="subject" v-if="form.unit === 'fleet'">
          <el-select v-model="form.subject" placeholder="车队板块下必填" style="width: 100%;" :disabled="isEdit">
            <el-option label="红树林" value="hsl" />
            <el-option label="新鹏运" value="xpy" />
          </el-select>
        </el-form-item>
        <el-form-item label="年度" prop="year">
          <el-select v-model="form.year" style="width: 100%;" :disabled="isEdit">
            <el-option label="2026" :value="2026" />
            <el-option label="2027" :value="2027" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源总盘（万元）" prop="totalAmount">
          <el-input-number v-model="form.totalAmount" :min="0" :step="100" style="width: 100%;" />
          <div class="preset-tip" v-if="presetTip">{{ presetTip }}</div>
        </el-form-item>
        <el-form-item :label="isEdit ? '编辑原因' : '备注'" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="2"
            :placeholder="isEdit ? '编辑原因必填（写入历史变更日志）' : '可选'"
          />
        </el-form-item>
      </el-form>
      <div class="dialog-note">
        <strong>预填规则（来自 inputs/ 业主原件）</strong>：
        <ul>
          <li>车队（运输板块）：营收 24,700 万 / 利润 450 万（M001 §6.1）。红树林、新鹏运两主体分别按合同比例分摊</li>
          <li>廊道：总投资 48 亿 = 480,000 万元（M001 §6.1）</li>
          <li>加气站（天山乡站）：投资 0.74 亿 = 7,400 万元（M001 §6.1）</li>
          <li>制氢工厂：业主"另行提报"（M001 §6.1），🔴 待业主提供具体金额</li>
        </ul>
        <strong>系统自动维护字段</strong>：已分配额（来自 133 已生效预算实时累加）/ 待分配（实时计算）/ 状态（自动判定）
      </div>
      <span slot="footer">
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">{{ isEdit ? '保存' : '确认拍板' }}</el-button>
      </span>
    </el-dialog>

    <!-- 详情 弹窗 -->
    <el-dialog :title="`${currentRow.unitName || ''}${currentRow.subject ? ' · ' + currentRow.subject : ''} ${currentRow.year || ''} 年度资源池详情`" :visible.sync="showDetail" width="820px">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="业务单元">{{ currentRow.unitName }}</el-descriptions-item>
        <el-descriptions-item label="主体">{{ currentRow.subject || '—' }}</el-descriptions-item>
        <el-descriptions-item label="年度">{{ currentRow.year }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(currentRow.status)" size="mini">{{ currentRow.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资源总盘">
          <span v-if="currentRow.totalAmount === null" class="pending">🔴 待业主提供</span>
          <span v-else>¥ {{ formatMoney(currentRow.totalAmount) }} 万元</span>
        </el-descriptions-item>
        <el-descriptions-item label="已分配">¥ {{ formatMoney(currentRow.allocated) }} 万元</el-descriptions-item>
        <el-descriptions-item label="待分配">
          <span v-if="currentRow.totalAmount === null">—</span>
          <span v-else :class="{ warning: currentRow.balance < 0 }">¥ {{ formatMoney(currentRow.balance) }} 万元</span>
        </el-descriptions-item>
        <el-descriptions-item label="数据来源">{{ currentRow.dataSource }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentRow.creator }}</el-descriptions-item>
        <el-descriptions-item label="最近更新">{{ currentRow.updatedAt }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">月度执行情况（数据来自 133 已生效预算 + 134 实际归集）</el-divider>
      <el-table :data="monthlyAllocation" border size="small">
        <el-table-column prop="month" label="月份" width="80" align="center" />
        <el-table-column prop="planned" label="计划分配（万）" width="140" align="right" />
        <el-table-column prop="actual" label="实际累计（万）" width="140" align="right" />
        <el-table-column prop="execRate" label="执行率" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.execRate }}%</template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="200" />
      </el-table>

      <el-divider content-position="left">历史变更日志</el-divider>
      <el-table :data="historyLog" border size="small">
        <el-table-column prop="time" label="时点" width="150" />
        <el-table-column prop="actor" label="操作人" width="120" align="center" />
        <el-table-column prop="action" label="动作" width="100" align="center" />
        <el-table-column prop="change" label="变更" min-width="200" />
        <el-table-column prop="reason" label="原因" min-width="200" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
const PRESET = {
  fleet_hsl: { amount: 13500, source: '基于 M001 §6.1 运输板块 24,700 万 + M006 双主体分摊' },
  fleet_xpy: { amount: 11200, source: '基于 M001 §6.1 运输板块 24,700 万 + M006 双主体分摊' },
  corridor: { amount: 480000, source: 'M001 §6.1 廊道总投资 48 亿' },
  'gas-tsx': { amount: 7400, source: 'M001 §6.1 天山乡站投资 0.74 亿' },
  'h2-plant': { amount: null, source: 'M001 §6.1 "具体投资计划按最终方案另行提报" 🔴 待业主提供' }
}

export default {
  name: 'BudgetOverview',
  data() {
    return {
      currentRole: 'group-admin',
      query: { unit: '', subject: '', year: '2026' },
      form: { unit: '', subject: '', year: 2026, totalAmount: null, reason: '' },
      formRules: {
        unit: [{ required: true, message: '请选择业务单元', trigger: 'change' }],
        year: [{ required: true, message: '请选择年度', trigger: 'change' }],
        totalAmount: [{ required: true, message: '请输入资源总盘', trigger: 'blur' }]
      },
      showForm: false,
      showDetail: false,
      isEdit: false,
      currentRow: {},
      monthlyAllocation: [
        { month: '1月', planned: 1125, actual: 1080, execRate: 96.0, note: '正常' },
        { month: '2月', planned: 1125, actual: 980, execRate: 87.1, note: '春节运量略降' },
        { month: '3月', planned: 1125, actual: 1180, execRate: 104.9, note: '业务恢复' },
        { month: '4月', planned: 1125, actual: 1220, execRate: 108.4, note: 'LNG 燃料超支' }
      ],
      historyLog: [
        { time: '2025-12-15 10:00', actor: '红树林集团管理层', action: '拍板', change: '总盘 13,500 万', reason: '基于 M001 §6.1 测算' },
        { time: '2026-01-10 14:30', actor: '马伶俐（公司财务）', action: '编辑', change: '备注调整', reason: '补充板块描述' },
        { time: '2026-03-26 09:00', actor: '系统自动', action: '状态变更', change: '草稿 → 已生效', reason: '集团管理层拍板生效' }
      ],
      tableData: [
        { id: 1, unit: 'fleet', unitName: '车队', subject: '红树林', year: 2026, totalAmount: 13500, allocated: 9600, balance: 3900, status: '已生效', dataSource: 'M001 §6.1 + 主体分摊', creator: '红树林集团管理层', updatedAt: '2025-12-15 10:00' },
        { id: 2, unit: 'fleet', unitName: '车队', subject: '新鹏运', year: 2026, totalAmount: 11200, allocated: 11280, balance: -80, status: '超额预警', dataSource: 'M001 §6.1 + 主体分摊', creator: '红树林集团管理层', updatedAt: '2025-12-15 10:00' },
        { id: 3, unit: 'corridor', unitName: '廊道（建设期）', subject: '', year: 2026, totalAmount: 480000, allocated: 384000, balance: 96000, status: '已生效', dataSource: 'M001 §6.1 廊道总投资 48 亿', creator: '红树林集团管理层', updatedAt: '2025-12-15 10:00' },
        { id: 4, unit: 'gas-tsx', unitName: '加气站（天山乡站）', subject: '', year: 2026, totalAmount: 7400, allocated: 3200, balance: 4200, status: '已生效', dataSource: 'M001 §6.1 天山乡站 0.74 亿', creator: '红树林集团管理层', updatedAt: '2025-12-15 10:00' },
        { id: 5, unit: 'h2-plant', unitName: '制氢工厂', subject: '', year: 2026, totalAmount: null, allocated: 0, balance: 0, status: '草稿', dataSource: 'M001 §6.1 "另行提报" · 🔴 待业主', creator: '马伶俐（公司财务）', updatedAt: '2026-05-15 09:00' }
      ]
    }
  },
  computed: {
    roleTip() {
      const map = {
        'group-admin': '拥有拍板 / 关账权；可新增 / 编辑 / 删除任意板块',
        'company-finance': '组织编制；可编辑录入但无拍板权；不能删除',
        'subsidiary-finance': '仅可编辑本主体（新鹏运）范围；不能新增 / 删除'
      }
      return map[this.currentRole] || ''
    },
    canCreate() {
      return this.currentRole === 'group-admin'
    },
    canDelete() {
      return this.currentRole === 'group-admin'
    },
    presetTip() {
      if (!this.form.unit) return ''
      let key = this.form.unit
      if (this.form.unit === 'fleet' && this.form.subject) {
        key = `fleet_${this.form.subject}`
      }
      const preset = PRESET[key]
      if (!preset) return ''
      if (preset.amount === null) {
        return `🔴 ${preset.source}`
      }
      return `预填值 ${preset.amount} 万元 · 出处：${preset.source}`
    },
    filteredData() {
      return this.tableData.filter(row => {
        if (this.query.unit && row.unit !== this.query.unit) return false
        if (this.query.subject) {
          const subjMap = { hsl: '红树林', xpy: '新鹏运' }
          if (row.subject !== subjMap[this.query.subject]) return false
        }
        if (this.query.year && String(row.year) !== this.query.year) return false
        if (this.currentRole === 'subsidiary-finance' && row.subject && row.subject !== '新鹏运') return false
        return true
      })
    },
    kpiTotal() {
      return this.filteredData.reduce((s, r) => s + (r.totalAmount || 0), 0)
    },
    kpiAllocated() {
      return this.filteredData.reduce((s, r) => s + (r.allocated || 0), 0)
    },
    kpiBalance() {
      return this.kpiTotal - this.kpiAllocated
    },
    kpiOverCount() {
      return this.filteredData.filter(r => r.balance < 0).length
    }
  },
  methods: {
    canEdit(row) {
      if (this.currentRole === 'group-admin') return true
      if (this.currentRole === 'company-finance') return true
      if (this.currentRole === 'subsidiary-finance') return row.subject === '新鹏运'
      return false
    },
    search() {
      this.$message.info('查询已生效（前端筛选）')
    },
    reset() {
      this.query = { unit: '', subject: '', year: '2026' }
    },
    onUnitChange() {
      if (this.form.unit !== 'fleet') {
        this.form.subject = ''
      }
      let key = this.form.unit
      if (this.form.unit === 'fleet' && this.form.subject) {
        key = `fleet_${this.form.subject}`
      }
      const preset = PRESET[key]
      if (preset && preset.amount !== null) {
        this.form.totalAmount = preset.amount
      }
    },
    openCreate() {
      this.isEdit = false
      this.form = { unit: '', subject: '', year: 2026, totalAmount: null, reason: '' }
      this.showForm = true
    },
    openEdit(row) {
      this.isEdit = true
      const unitMap = { '车队': 'fleet', '廊道（建设期）': 'corridor', '加气站（天山乡站）': 'gas-tsx', '制氢工厂': 'h2-plant' }
      const subjMap = { '红树林': 'hsl', '新鹏运': 'xpy' }
      this.form = {
        unit: unitMap[row.unitName] || '',
        subject: subjMap[row.subject] || '',
        year: row.year,
        totalAmount: row.totalAmount,
        reason: ''
      }
      this.currentRow = row
      this.showForm = true
    },
    openDetail(row) {
      this.currentRow = row
      this.showDetail = true
    },
    handleSubmit() {
      if (this.isEdit && !this.form.reason) {
        this.$message.warning('编辑原因必填')
        return
      }
      const action = this.isEdit ? '已保存修改' : '已确认拍板（演示，未实际写入）'
      this.$message.success(action)
      this.showForm = false
    },
    confirmDelete(row) {
      const label = row.unitName + (row.subject ? ' · ' + row.subject : '')
      this.$prompt(
        `确认删除 ${label} 的 ${row.year} 年度资源池？删除后关联的 133 已分配数据将一并清理。请填写删除原因：`,
        '删除确认',
        { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning', inputType: 'textarea', inputPlaceholder: '删除原因必填' }
      ).then(({ value }) => {
        if (!value) {
          this.$message.warning('删除原因必填')
          return
        }
        this.$message.success(`已删除 ${label}（演示）`)
      }).catch(() => {})
    },
    formatMoney(v) {
      if (v == null || isNaN(Number(v))) return '0'
      return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 0 })
    },
    statusTag(s) {
      const map = { '草稿': 'info', '已生效': 'success', '超额预警': 'danger', '关账': '' }
      return map[s] || ''
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

.role-card,
.search-card,
.table-card {
  border: 1px solid #DCDFE6;
}

.role-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.role-label {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.role-tip {
  font-size: 12px;
  color: #909399;
}

.kpi-row {
  display: flex;
  gap: 12px;
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
  font-size: 22px;
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
  margin-left: 8px;
  font-weight: normal;
}

.warning {
  color: #F56C6C;
  font-weight: 600;
}

.pending {
  color: #E6A23C;
  font-size: 12px;
}

.danger-text {
  color: #F56C6C;
}

.pagination {
  margin-top: 12px;
  text-align: right;
}

.preset-tip {
  font-size: 11px;
  color: #2F80ED;
  margin-top: 4px;
}

.dialog-note {
  margin-top: 12px;
  font-size: 12px;
  color: #606266;
  background: #FAFBFC;
  padding: 10px 14px;
  border-radius: 2px;
  border: 1px solid #E4E7ED;
  line-height: 1.8;
}

.dialog-note strong {
  color: #303133;
  display: block;
  margin: 6px 0 4px;
}

.dialog-note ul {
  margin: 0;
  padding-left: 20px;
}
</style>
