<template>
  <div class="page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
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
        <el-form-item label="年度">
          <el-select v-model="query.year" style="width: 100px;">
            <el-option label="2026" value="2026" />
            <el-option label="2027" value="2027" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px;">
            <el-option label="草稿" value="draft" />
            <el-option label="审批中" value="reviewing" />
            <el-option label="已生效" value="effective" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>预算编制 — {{ query.year }} 年度</span>
        <div>
          <el-button type="primary" icon="el-icon-plus" size="small" @click="openCreate">新增预算</el-button>
          <el-button icon="el-icon-upload2" size="small" plain @click="openImport">Excel 导入</el-button>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small">
        <el-table-column prop="unit" label="业务单元" width="140" align="center" />
        <el-table-column prop="subject" label="主体" width="90" align="center">
          <template slot-scope="scope">{{ scope.row.subject || '—' }}</template>
        </el-table-column>
        <el-table-column prop="period" label="周期" width="120" align="center" />
        <el-table-column prop="totalBudget" label="预算总额" width="130" align="right">
          <template slot-scope="scope">¥ {{ formatMoney(scope.row.totalBudget) }}</template>
        </el-table-column>
        <el-table-column prop="version" label="当前版本" width="110" align="center" />
        <el-table-column prop="status" label="审批状态" width="110" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewLevel" label="审批进度" width="140" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.status === 'reviewing'">{{ scope.row.reviewLevel }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="editor" label="编制人" width="100" align="center" />
        <el-table-column prop="updatedAt" label="最近更新" width="150" />
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" @click="edit(scope.row)" v-if="scope.row.status === 'draft'">编辑</el-button>
            <el-button type="text" size="mini" @click="viewVersion(scope.row)">版本</el-button>
            <el-button type="text" size="mini" @click="submitReview(scope.row)" v-if="scope.row.status === 'draft'">提交审批</el-button>
            <el-button type="text" size="mini" class="danger-text" @click="confirmDelete(scope.row)" v-if="scope.row.status === 'draft'">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="tableData.length" :page-size="20" />
      </div>
    </el-card>

    <el-dialog :title="dialogTitle" :visible.sync="showCreate" width="980px">
      <el-form :model="form" label-width="100px" size="small">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="业务单元">
              <el-select v-model="form.unit" placeholder="请选择" style="width: 100%;" :disabled="isViewOnly">
                <el-option label="车队" value="fleet" />
                <el-option label="廊道（建设期）" value="corridor" />
                <el-option label="加气站（天山乡站等）" value="gas-tsx" />
                <el-option label="制氢工厂" value="h2-plant" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="主体" v-if="form.unit === 'fleet'">
              <el-select v-model="form.subject" placeholder="车队需选主体" style="width: 100%;" :disabled="isViewOnly">
                <el-option label="红树林" value="hsl" />
                <el-option label="新鹏运" value="xpy" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="周期">
              <el-select v-model="form.period" placeholder="请选择" style="width: 100%;" :disabled="isViewOnly">
                <el-option label="2026 全年" value="2026" />
                <el-option label="2026 Q3" value="2026-Q3" />
                <el-option label="2026 Q4" value="2026-Q4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="版本">
              <el-input v-model="form.version" placeholder="如 v1.0 草案" :disabled="isViewOnly" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">月度预算明细 — 按费用科目（业主 ERP 编码 + 趟结/杂费拆开）</el-divider>
        <el-table :data="form.details" border size="small">
          <el-table-column prop="account" label="费用科目" min-width="160" fixed="left" />
          <el-table-column prop="accountCode" label="ERP 编码" width="160" align="center" fixed="left" />
          <el-table-column v-for="m in months" :key="m" :label="m" width="100" align="right">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row[m]"
                size="mini"
                :controls="false"
                :step="1000"
                :disabled="isViewOnly"
                style="width: 90px;"
              />
            </template>
          </el-table-column>
          <el-table-column label="合计" width="120" align="right" fixed="right">
            <template slot-scope="scope">
              <strong>¥ {{ formatMoney(rowTotal(scope.row)) }}</strong>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <span slot="footer">
        <el-button @click="showCreate = false">{{ isViewOnly ? '关闭' : '取消' }}</el-button>
        <el-button v-if="!isViewOnly" @click="saveDraft">保存草稿</el-button>
        <el-button v-if="!isViewOnly" type="primary" @click="submitDirect">保存并提交审批</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="`${currentRow.unit || ''}${currentRow.subject ? ' · ' + currentRow.subject : ''} ${currentRow.period || ''} - 版本历史`" :visible.sync="showVersion" width="720px">
      <el-table :data="versionHistory" border size="small">
        <el-table-column prop="version" label="版本号" width="110" align="center" />
        <el-table-column prop="totalBudget" label="预算总额" width="130" align="right">
          <template slot-scope="scope">¥ {{ formatMoney(scope.row.totalBudget) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="editor" label="编制人" width="100" align="center" />
        <el-table-column prop="reviewedBy" label="审批人" width="120" align="center" />
        <el-table-column prop="changeLog" label="变更说明" min-width="200" />
        <el-table-column prop="updatedAt" label="时间" width="150" />
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="diffVersion(scope.row)">对比</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog title="Excel 导入" :visible.sync="showImport" width="520px">
      <div class="import-area">
        <el-upload
          drag
          action=""
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls"
          :on-change="onImportFile"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div slot="tip" class="el-upload__tip">仅支持 xlsx 格式，单个文件不超过 5MB</div>
        </el-upload>
        <div class="template-tip">
          <a href="#">下载预算导入模板</a>（待业主确认列结构后正式发布）
        </div>
      </div>
      <span slot="footer">
        <el-button @click="showImport = false">取消</el-button>
        <el-button type="primary" @click="doImport">导入并预览</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function zeros() {
  const obj = {}
  MONTHS.forEach(m => obj[m] = 0)
  return obj
}

export default {
  name: 'BudgetEdit',
  data() {
    return {
      query: { unit: '', subject: '', year: '2026', status: '' },
      months: MONTHS,
      showCreate: false,
      showImport: false,
      showVersion: false,
      isEdit: false,
      isViewOnly: false,
      currentRow: { unit: '', period: '' },
      versionHistory: [
        { version: 'v2.0 终版', totalBudget: 8500000, status: 'effective', editor: '马伶俐', reviewedBy: '财务总监', changeLog: '一级审批反馈：燃料预算上调 3%', updatedAt: '2026-04-28 16:00' },
        { version: 'v1.2', totalBudget: 8245000, status: 'rejected', editor: '马伶俐', reviewedBy: '车队长', changeLog: '财务总监驳回，要求燃料预算上调', updatedAt: '2026-04-22 11:30' },
        { version: 'v1.1', totalBudget: 8120000, status: 'rejected', editor: '马伶俐', reviewedBy: '车队长', changeLog: '车队长驳回，要求重新评估趟结工资基准', updatedAt: '2026-04-18 09:45' },
        { version: 'v1.0 草案', totalBudget: 8050000, status: 'rejected', editor: '马伶俐', reviewedBy: '—', changeLog: '初稿', updatedAt: '2026-04-15 17:20' }
      ],
      form: {
        unit: '',
        subject: '',
        period: '2026',
        version: 'v1.0 草案',
        details: [
          { account: 'LNG 加气费', accountCode: '业主自定义', ...zeros() },
          { account: 'ETC 路桥费', accountCode: '业主自定义', ...zeros() },
          { account: '司机趟结工资', accountCode: '660209-司机', ...zeros() },
          { account: '司机基本工资', accountCode: '660209-司机', ...zeros() },
          { account: '管理人员工资', accountCode: '660209-管理', ...zeros() },
          { account: '车辆维修费', accountCode: '660214 车辆使用费', ...zeros() },
          { account: '车辆折旧费', accountCode: '660225 折旧费', ...zeros() },
          { account: '车辆保险费', accountCode: '660219 保险费', ...zeros() },
          { account: '车辆杂费（5/12 拆开）', accountCode: '业主自定义', ...zeros() },
          { account: '低值易耗品', accountCode: '业主自定义', ...zeros() }
        ]
      },
      dialogTitle: '新增预算',
      tableData: [
        { unit: '车队', subject: '红树林', period: '2026 全年', totalBudget: 135000000, version: 'v2.0 终版', status: 'effective', reviewLevel: '', editor: '马伶俐', updatedAt: '2026-05-12 16:00' },
        { unit: '车队', subject: '新鹏运', period: '2026 全年', totalBudget: 112000000, version: 'v1.2', status: 'reviewing', reviewLevel: '2/3 财务总监', editor: '车队财务', updatedAt: '2026-05-12 09:30' },
        { unit: '廊道（建设期）', subject: '', period: '2026 全年', totalBudget: 4800000000, version: 'v1.0', status: 'reviewing', reviewLevel: '1/3 车队长', editor: '马伶俐', updatedAt: '2026-05-12 13:45' },
        { unit: '加气站（天山乡站等）', subject: '', period: '2026 9-12 月', totalBudget: 7400000, version: 'v1.0 草案', status: 'draft', reviewLevel: '', editor: '马伶俐', updatedAt: '2026-05-12 14:20' },
        { unit: '制氢工厂', subject: '', period: '2026 全年', totalBudget: 120000000, version: 'v1.0 草案', status: 'draft', reviewLevel: '', editor: '马伶俐', updatedAt: '2026-05-12 15:00' },
        { unit: '车队', subject: '红树林', period: '2026 Q3', totalBudget: 33750000, version: 'v1.1', status: 'rejected', reviewLevel: '', editor: '车队财务', updatedAt: '2026-05-09 11:15' }
      ]
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { unit: '', subject: '', year: '2026', status: '' } },
    openCreate() {
      this.isEdit = false
      this.isViewOnly = false
      this.dialogTitle = '新增预算'
      this.form = {
        unit: '',
        subject: '',
        period: '2026',
        version: 'v1.0 草案',
        details: [
          { account: 'LNG 燃料费', ...zeros() },
          { account: '路桥费', ...zeros() },
          { account: '司机趟结工资', ...zeros() },
          { account: '司机基本工资', ...zeros() },
          { account: '车辆维保费', ...zeros() },
          { account: '车辆折旧', ...zeros() },
          { account: '车辆保险', ...zeros() }
        ]
      }
      this.showCreate = true
    },
    openImport() { this.showImport = true },
    onImportFile() { this.$message.info('文件已选择') },
    doImport() {
      this.$message.success('已导入并预览（演示）')
      this.showImport = false
    },
    saveDraft() {
      this.$message.success('已保存草稿（演示）')
      this.showCreate = false
    },
    submitDirect() {
      this.$message.success('已提交审批，进入一级（车队长）审批环节（演示）')
      this.showCreate = false
    },
    rowLabel(row) {
      return row.unit + (row.subject ? ' · ' + row.subject : '')
    },
    mapUnitCode(name) {
      const map = { '车队': 'fleet', '廊道（建设期）': 'corridor', '加气站（天山乡站等）': 'gas-tsx', '制氢工厂': 'h2-plant' }
      return map[name] || ''
    },
    mapSubjectCode(name) {
      const map = { '红树林': 'hsl', '新鹏运': 'xpy' }
      return map[name] || ''
    },
    viewDetail(row) {
      this.isEdit = false
      this.isViewOnly = true
      this.currentRow = row
      this.dialogTitle = `${this.rowLabel(row)} ${row.period} ${row.version} - 详情`
      const detailRows = [
        { account: 'LNG 燃料费', ...this.distributeMonthly(row.totalBudget * 0.32) },
        { account: '路桥费', ...this.distributeMonthly(row.totalBudget * 0.18) },
        { account: '司机趟结工资', ...this.distributeMonthly(row.totalBudget * 0.22) },
        { account: '司机基本工资', ...this.distributeMonthly(row.totalBudget * 0.06) },
        { account: '车辆维保费', ...this.distributeMonthly(row.totalBudget * 0.08) },
        { account: '车辆折旧', ...this.distributeMonthly(row.totalBudget * 0.12) },
        { account: '车辆保险', ...this.distributeMonthly(row.totalBudget * 0.02) }
      ]
      this.form = {
        unit: this.mapUnitCode(row.unit),
        subject: this.mapSubjectCode(row.subject),
        period: row.period.includes('全年') ? '2026' : row.period,
        version: row.version,
        details: detailRows
      }
      this.showCreate = true
    },
    edit(row) {
      this.isEdit = true
      this.isViewOnly = false
      this.dialogTitle = '编辑预算'
      this.currentRow = row
      const detailRows = [
        { account: 'LNG 燃料费', ...this.distributeMonthly(row.totalBudget * 0.32) },
        { account: '路桥费', ...this.distributeMonthly(row.totalBudget * 0.18) },
        { account: '司机趟结工资', ...this.distributeMonthly(row.totalBudget * 0.22) },
        { account: '司机基本工资', ...this.distributeMonthly(row.totalBudget * 0.06) },
        { account: '车辆维保费', ...this.distributeMonthly(row.totalBudget * 0.08) },
        { account: '车辆折旧', ...this.distributeMonthly(row.totalBudget * 0.12) },
        { account: '车辆保险', ...this.distributeMonthly(row.totalBudget * 0.02) }
      ]
      this.form = {
        unit: this.mapUnitCode(row.unit),
        subject: this.mapSubjectCode(row.subject),
        period: row.period.includes('全年') ? '2026' : row.period,
        version: row.version,
        details: detailRows
      }
      this.showCreate = true
    },
    distributeMonthly(total) {
      const obj = {}
      const perMonth = Math.round(total / 12)
      MONTHS.forEach(m => obj[m] = perMonth)
      return obj
    },
    viewVersion(row) {
      this.currentRow = row
      this.showVersion = true
    },
    diffVersion(row) {
      this.$message.info(`对比版本 ${row.version} 与当前版本（演示，由后端实现差异对比）`)
    },
    submitReview(row) {
      this.$confirm(`确认将 ${this.rowLabel(row)} ${row.period} ${row.version} 提交审批？`, '提交确认', {
        confirmButtonText: '提交',
        cancelButtonText: '取消'
      }).then(() => this.$message.success('已提交')).catch(() => {})
    },
    confirmDelete(row) {
      this.$confirm(
        `确认删除 ${this.rowLabel(row)} ${row.period} 的预算草稿（${row.version}）？删除后无法恢复。`,
        '删除确认',
        { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
      ).then(() => this.$message.success('已删除（演示）')).catch(() => {})
    },
    rowTotal(row) {
      return this.months.reduce((sum, m) => sum + (row[m] || 0), 0)
    },
    formatMoney(v) { return Number(v).toLocaleString('zh-CN') },
    statusLabel(s) {
      const map = { draft: '草稿', reviewing: '审批中', effective: '已生效', rejected: '已驳回' }
      return map[s] || s
    },
    statusTag(s) {
      const map = { draft: 'info', reviewing: 'warning', effective: 'success', rejected: 'danger' }
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

.search-card,
.table-card {
  border: 1px solid #DCDFE6;
}

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.muted {
  font-size: 12px;
  color: #C0C4CC;
}

.danger-text {
  color: #F56C6C;
}

.pagination {
  margin-top: 12px;
  text-align: right;
}

.import-area {
  text-align: center;
}

.template-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #606266;
}

.template-tip a {
  color: #409EFF;
}
</style>
