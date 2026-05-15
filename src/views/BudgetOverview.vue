<template>
  <div class="page">
    <!-- 顶部说明 -->
    <el-card class="rule-note" shadow="never">
      <div class="rule-content">
        <strong>132 概算管理 · 数据模型</strong>：一个年度 = 一条概算数据，含业主官方 4 板块（车队 / 廊道 / 加气站 / 制氢工厂）的资源总盘。红树林集团管理层在当年第四季度拍板下一年度概算。主体维度（红树林 / 新鹏运）由 133 预算编制 / 134 核算处理细化。
      </div>
    </el-card>

    <!-- 顶部 KPI 卡 -->
    <div class="kpi-row">
      <el-card class="kpi-card" shadow="never">
        <div class="kpi-label">当前年度资源总盘合计</div>
        <div class="kpi-value">¥ {{ formatMoney(kpiTotal) }} 万</div>
        <div class="kpi-meta">{{ activeYearLabel }} · 4 板块累加</div>
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
        <el-form-item label="年度">
          <el-select v-model="query.year" placeholder="全部" clearable style="width: 140px;">
            <el-option label="2026" value="2026" />
            <el-option label="2027" value="2027" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px;">
            <el-option label="草稿" value="草稿" />
            <el-option label="已生效" value="已生效" />
            <el-option label="超额预警" value="超额预警" />
            <el-option label="关账" value="关账" />
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
          <span>年度概算列表</span>
          <span class="muted">一行 = 一个年度的概算（含 4 板块）</span>
        </div>
        <div>
          <el-button type="primary" icon="el-icon-plus" size="small" @click="openCreate">新增年度概算</el-button>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table
        :data="filteredData"
        border
        stripe
        size="small"
        @expand-change="onExpandChange"
        @row-click="onRowClick"
        :row-key="row => row.id"
      >
        <el-table-column type="expand">
          <template slot-scope="props">
            <div class="expand-pane">
              <div class="expand-title">{{ props.row.year }} 年度 · 4 板块明细</div>
              <el-table :data="props.row.sections" border size="mini" class="expand-table">
                <el-table-column prop="unitName" label="业务板块" width="180" />
                <el-table-column label="资源总盘（万元）" width="180" align="right">
                  <template slot-scope="s">
                    <span v-if="s.row.totalAmount === null" class="pending">🔴 待业主提供</span>
                    <span v-else>{{ formatMoney(s.row.totalAmount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="已分配（万元）" width="160" align="right">
                  <template slot-scope="s">{{ formatMoney(s.row.allocated) }}</template>
                </el-table-column>
                <el-table-column label="待分配（万元）" width="160" align="right">
                  <template slot-scope="s">
                    <span v-if="s.row.totalAmount === null">—</span>
                    <span v-else :class="{ warning: s.row.balance < 0 }">{{ formatMoney(s.row.balance) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="dataSource" label="数据来源" min-width="320" />
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="year" label="年度" width="90" align="center" />
        <el-table-column label="状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="4 板块总盘合计（万元）" width="200" align="right">
          <template slot-scope="scope">
            <strong>{{ formatMoney(sumTotal(scope.row)) }}</strong>
            <span v-if="hasPending(scope.row)" class="pending"> +🔴</span>
          </template>
        </el-table-column>
        <el-table-column label="已分配合计（万元）" width="170" align="right">
          <template slot-scope="scope">{{ formatMoney(sumAllocated(scope.row)) }}</template>
        </el-table-column>
        <el-table-column label="待分配合计（万元）" width="170" align="right">
          <template slot-scope="scope">
            <span :class="{ warning: sumBalance(scope.row) < 0 }">{{ formatMoney(sumBalance(scope.row)) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="decisionTime" label="拍板时点" width="160" />
        <el-table-column prop="decisionMaker" label="拍板人" width="160" align="center" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click.stop="openDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" @click.stop="openEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="mini" class="danger-text" @click.stop="confirmDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="filteredData.length" :page-size="20" />
      </div>
    </el-card>

    <!-- 新建 / 编辑 弹窗：一次性录入 4 板块 -->
    <el-dialog :title="isEdit ? '编辑年度概算' : '新增年度概算'" :visible.sync="showForm" width="780px">
      <el-form :model="form" label-width="120px" size="small">
        <el-form-item label="年度" required>
          <el-select v-model="form.year" :disabled="isEdit" style="width: 200px;">
            <el-option label="2026" :value="2026" />
            <el-option label="2027" :value="2027" />
          </el-select>
          <span class="hint">数据模型：一个年度只允许一条概算记录</span>
        </el-form-item>

        <el-divider content-position="left">4 板块资源总盘（来源：M001 §6.1 + M002 经营计划测算）</el-divider>

        <div class="section-grid">
          <div v-for="s in form.sections" :key="s.unit" class="section-row">
            <div class="section-label">
              <div class="section-name">{{ s.unitName }}</div>
              <div class="section-source">{{ s.dataSource }}</div>
            </div>
            <div class="section-input">
              <el-input-number
                v-model="s.totalAmount"
                :min="0"
                :step="1000"
                :placeholder="s.placeholder || '请输入金额'"
                style="width: 240px;"
              />
              <span class="unit-tag">万元</span>
            </div>
          </div>
        </div>

        <el-form-item :label="isEdit ? '编辑原因' : '备注'" style="margin-top: 16px;">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="2"
            :placeholder="isEdit ? '编辑原因必填（写入历史变更日志）' : '可选'"
          />
        </el-form-item>
      </el-form>

      <div class="dialog-note">
        <strong>4 板块预填值出处（业主原件）</strong>
        <ul>
          <li>车队（运输板块）24,700 万：M001 §6.1 "运输版块：营收 24700 万元，利润总额 450 万元"</li>
          <li>廊道 480,000 万 = 48 亿：M001 §6.1 "廊道版块：计划总投资 48 亿元"</li>
          <li>加气站（天山乡站）7,400 万 = 0.74 亿：M001 §6.1 "天山乡站：2026 年计划投资 0.74 亿元"</li>
          <li>制氢工厂 🔴：M001 §6.1 "具体投资计划按最终方案另行提报"，待业主提供</li>
        </ul>
      </div>

      <span slot="footer">
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">{{ isEdit ? '保存' : '集团管理层确认拍板' }}</el-button>
      </span>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog :title="`${currentRow.year || ''} 年度概算详情`" :visible.sync="showDetail" width="900px">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="年度">{{ currentRow.year }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(currentRow.status)" size="mini">{{ currentRow.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="拍板时点">{{ currentRow.decisionTime }}</el-descriptions-item>
        <el-descriptions-item label="拍板人">{{ currentRow.decisionMaker }}</el-descriptions-item>
        <el-descriptions-item label="4 板块总盘合计">¥ {{ formatMoney(sumTotal(currentRow)) }} 万元</el-descriptions-item>
        <el-descriptions-item label="已分配合计">¥ {{ formatMoney(sumAllocated(currentRow)) }} 万元</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRow.note || '—' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">4 板块明细</el-divider>
      <el-table :data="currentRow.sections || []" border size="small">
        <el-table-column prop="unitName" label="业务板块" width="180" />
        <el-table-column label="资源总盘（万元）" width="170" align="right">
          <template slot-scope="s">
            <span v-if="s.row.totalAmount === null" class="pending">🔴 待业主提供</span>
            <span v-else>{{ formatMoney(s.row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已分配（万元）" width="150" align="right">
          <template slot-scope="s">{{ formatMoney(s.row.allocated) }}</template>
        </el-table-column>
        <el-table-column label="待分配（万元）" width="150" align="right">
          <template slot-scope="s">
            <span v-if="s.row.totalAmount === null">—</span>
            <span v-else :class="{ warning: s.row.balance < 0 }">{{ formatMoney(s.row.balance) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dataSource" label="数据来源" min-width="300" />
      </el-table>

      <el-divider content-position="left">历史变更日志</el-divider>
      <el-table :data="currentRow.history || []" border size="small">
        <el-table-column prop="time" label="时点" width="160" />
        <el-table-column prop="actor" label="操作人" width="150" align="center" />
        <el-table-column prop="action" label="动作" width="120" align="center" />
        <el-table-column prop="change" label="变更" min-width="240" />
        <el-table-column prop="reason" label="原因" min-width="200" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
const SECTION_PRESET = [
  { unit: 'fleet', unitName: '车队（运输板块）', totalAmount: 24700, placeholder: '24700', dataSource: 'M001 §6.1 运输板块年度营收 24,700 万 · M002 LNG 营收测算' },
  { unit: 'corridor', unitName: '廊道（建设期）', totalAmount: 480000, placeholder: '480000', dataSource: 'M001 §6.1 廊道总投资 48 亿' },
  { unit: 'gas-tsx', unitName: '加气站（天山乡站等）', totalAmount: 7400, placeholder: '7400', dataSource: 'M001 §6.1 天山乡站投资 0.74 亿' },
  { unit: 'h2-plant', unitName: '制氢工厂', totalAmount: null, placeholder: '🔴 待业主提供', dataSource: 'M001 §6.1 "具体投资计划按最终方案另行提报"' }
]

function blankSections() {
  return SECTION_PRESET.map(s => ({
    unit: s.unit,
    unitName: s.unitName,
    totalAmount: s.totalAmount,
    allocated: 0,
    balance: s.totalAmount === null ? 0 : s.totalAmount,
    dataSource: s.dataSource,
    placeholder: s.placeholder
  }))
}

export default {
  name: 'BudgetOverview',
  data() {
    return {
      query: { year: '2026', status: '' },
      form: { year: 2026, sections: blankSections(), reason: '' },
      showForm: false,
      showDetail: false,
      isEdit: false,
      currentRow: {},
      tableData: [
        {
          id: 1,
          year: 2026,
          status: '已生效',
          decisionTime: '2025-12-15 10:00',
          decisionMaker: '红树林集团管理层',
          note: '基于业主官方 2026 年度经营计划测算',
          sections: [
            { unit: 'fleet', unitName: '车队（运输板块）', totalAmount: 24700, allocated: 18000, balance: 6700, dataSource: 'M001 §6.1 + M002 LNG 营收测算' },
            { unit: 'corridor', unitName: '廊道（建设期）', totalAmount: 480000, allocated: 384000, balance: 96000, dataSource: 'M001 §6.1 廊道总投资 48 亿' },
            { unit: 'gas-tsx', unitName: '加气站（天山乡站等）', totalAmount: 7400, allocated: 3200, balance: 4200, dataSource: 'M001 §6.1 天山乡站 0.74 亿' },
            { unit: 'h2-plant', unitName: '制氢工厂', totalAmount: null, allocated: 0, balance: 0, dataSource: 'M001 §6.1 "另行提报" · 🔴 待业主' }
          ],
          history: [
            { time: '2025-10-15 14:00', actor: '红树林集团管理层', action: '创建草稿', change: '初版录入', reason: 'Q4 启动 2026 年度概算决策' },
            { time: '2025-12-15 10:00', actor: '红树林集团管理层', action: '拍板生效', change: '草稿 → 已生效', reason: '集团管理层拍板通过' },
            { time: '2026-03-26 09:00', actor: '马伶俐（公司财务）', action: '编辑', change: '车队已分配 17,200 → 18,000', reason: '133 已生效预算回写' }
          ]
        },
        {
          id: 2,
          year: 2027,
          status: '草稿',
          decisionTime: '—',
          decisionMaker: '—',
          note: '2026 Q4 启动编制 · 待集团管理层拍板',
          sections: blankSections(),
          history: [
            { time: '2026-10-10 09:00', actor: '马伶俐（公司财务）', action: '创建草稿', change: '初版（4 板块均未填）', reason: '提前启动 2027 年度概算编制' }
          ]
        }
      ]
    }
  },
  computed: {
    activeYearLabel() {
      const yearRow = this.tableData.find(r => String(r.year) === String(this.query.year)) || this.tableData[0]
      return yearRow ? `${yearRow.year} 年度` : '—'
    },
    filteredData() {
      return this.tableData.filter(row => {
        if (this.query.year && String(row.year) !== this.query.year) return false
        if (this.query.status && row.status !== this.query.status) return false
        return true
      })
    },
    kpiRow() {
      return this.tableData.find(r => String(r.year) === String(this.query.year)) || this.tableData[0]
    },
    kpiTotal() {
      return this.kpiRow ? this.sumTotal(this.kpiRow) : 0
    },
    kpiAllocated() {
      return this.kpiRow ? this.sumAllocated(this.kpiRow) : 0
    },
    kpiBalance() {
      return this.kpiTotal - this.kpiAllocated
    },
    kpiOverCount() {
      if (!this.kpiRow) return 0
      return this.kpiRow.sections.filter(s => s.totalAmount !== null && s.balance < 0).length
    }
  },
  methods: {
    sumTotal(row) {
      if (!row || !row.sections) return 0
      return row.sections.reduce((s, x) => s + (x.totalAmount || 0), 0)
    },
    sumAllocated(row) {
      if (!row || !row.sections) return 0
      return row.sections.reduce((s, x) => s + (x.allocated || 0), 0)
    },
    sumBalance(row) {
      return this.sumTotal(row) - this.sumAllocated(row)
    },
    hasPending(row) {
      if (!row || !row.sections) return false
      return row.sections.some(s => s.totalAmount === null)
    },
    onRowClick(row, col) {
      // 点击行（非操作列）不动作；展开由 expand 列控制
    },
    onExpandChange() {},
    search() {
      this.$message.info('查询已生效（前端筛选）')
    },
    reset() {
      this.query = { year: '2026', status: '' }
    },
    openCreate() {
      this.isEdit = false
      this.form = { year: 2027, sections: blankSections(), reason: '' }
      this.showForm = true
    },
    openEdit(row) {
      this.isEdit = true
      this.currentRow = row
      this.form = {
        year: row.year,
        sections: JSON.parse(JSON.stringify(row.sections)),
        reason: ''
      }
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
      this.$message.success(this.isEdit ? '已保存（演示）' : '集团管理层已拍板（演示）')
      this.showForm = false
    },
    confirmDelete(row) {
      this.$prompt(
        `确认删除 ${row.year} 年度的概算记录？该年度所有 4 板块明细 + 关联的 133 已分配数据将一并清理。请填写删除原因：`,
        '删除确认',
        { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning', inputType: 'textarea', inputPlaceholder: '删除原因必填' }
      ).then(({ value }) => {
        if (!value) {
          this.$message.warning('删除原因必填')
          return
        }
        this.$message.success(`已删除 ${row.year} 年度概算（演示）`)
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

.rule-note,
.search-card,
.table-card {
  border: 1px solid #DCDFE6;
}

.rule-note {
  background: #FAFBFC;
}

.rule-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.8;
}

.rule-content strong {
  color: #303133;
  margin-right: 6px;
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

.expand-pane {
  padding: 12px 16px 16px 56px;
  background: #FAFBFC;
}

.expand-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.section-row {
  border: 1px solid #E4E7ED;
  border-radius: 4px;
  padding: 12px 14px;
  background: #FAFBFC;
}

.section-label .section-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.section-label .section-source {
  font-size: 11px;
  color: #909399;
  line-height: 1.5;
  margin-bottom: 8px;
}

.section-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit-tag {
  font-size: 12px;
  color: #606266;
}

.hint {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
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
