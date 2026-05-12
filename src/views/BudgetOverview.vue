<template>
  <div class="page">
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="业务单元">
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 200px;">
            <el-option label="车队 / 红树林" value="fleet-hsl" />
            <el-option label="车队 / 新鹏运" value="fleet-xpy" />
            <el-option label="加气站（天山乡站等）" value="gas-tsx" />
            <el-option label="制氢工厂" value="h2-plant" />
            <el-option label="廊道（建设期）" value="corridor" />
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

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>业务单元年度资源池</span>
        <div>
          <el-button type="primary" icon="el-icon-plus" size="small" @click="openCreate">新增</el-button>
          <el-button icon="el-icon-download" size="small" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border stripe size="small">
        <el-table-column prop="unitName" label="业务单元" min-width="120" />
        <el-table-column prop="year" label="年度" width="80" align="center" />
        <el-table-column prop="totalAmount" label="资源总盘（万元）" width="160" align="right">
          <template slot-scope="scope">{{ formatMoney(scope.row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column prop="allocated" label="已分配（万元）" width="140" align="right">
          <template slot-scope="scope">{{ formatMoney(scope.row.allocated) }}</template>
        </el-table-column>
        <el-table-column prop="balance" label="待分配（万元）" width="140" align="right">
          <template slot-scope="scope">
            <span :class="{ warning: scope.row.balance < 0 }">{{ formatMoney(scope.row.balance) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="最近更新" width="150" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="openDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" @click="openEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="mini" class="danger-text" @click="confirmDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="tableData.length" :page-size="20" />
      </div>
    </el-card>

    <el-dialog :title="isEdit ? '编辑业务单元资源池' : '新增业务单元资源池'" :visible.sync="showForm" width="560px">
      <el-form :model="form" label-width="120px" size="small">
        <el-form-item label="业务单元">
          <el-select v-model="form.unit" placeholder="请选择" style="width: 100%;" :disabled="isEdit">
            <el-option label="车队 / 红树林" value="fleet-hsl" />
            <el-option label="车队 / 新鹏运" value="fleet-xpy" />
            <el-option label="加气站（天山乡站等）" value="gas-tsx" />
            <el-option label="制氢工厂" value="h2-plant" />
          </el-select>
        </el-form-item>
        <el-form-item label="年度">
          <el-select v-model="form.year" style="width: 100%;" :disabled="isEdit">
            <el-option label="2026" :value="2026" />
            <el-option label="2027" :value="2027" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源总盘">
          <el-input-number v-model="form.totalAmount" :min="0" :step="100" />
          <span style="margin-left: 8px; color: #606266;">万元</span>
        </el-form-item>
        <el-form-item label="备注" v-if="isEdit">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="编辑原因（可选）" />
        </el-form-item>
      </el-form>
      <div class="auto-fields-note">
        <strong>系统自动维护字段（无需录入）：</strong>
        <ul>
          <li><b>已分配额</b>：从 133 预算编制"已生效"状态的预算自动累加</li>
          <li><b>待分配额</b>：= 资源总盘 − 已分配额（实时计算）</li>
          <li><b>状态</b>：草稿 → 执行中 → 超额预警（待分配 &lt; 0 自动判定）→ 关账</li>
        </ul>
      </div>
      <span slot="footer">
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">{{ isEdit ? '保存' : '确认' }}</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="`${currentRow.unitName} - 年度资源池详情`" :visible.sync="showDetail" width="720px">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="业务单元">{{ currentRow.unitName }}</el-descriptions-item>
        <el-descriptions-item label="年度">{{ currentRow.year }}</el-descriptions-item>
        <el-descriptions-item label="资源总盘">¥ {{ formatMoney(currentRow.totalAmount) }} 万元</el-descriptions-item>
        <el-descriptions-item label="已分配">¥ {{ formatMoney(currentRow.allocated) }} 万元</el-descriptions-item>
        <el-descriptions-item label="待分配">
          <span :class="{ warning: currentRow.balance < 0 }">¥ {{ formatMoney(currentRow.balance) }} 万元</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(currentRow.status)" size="mini">{{ currentRow.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentRow.creator || '马伶俐' }}</el-descriptions-item>
        <el-descriptions-item label="最近更新">{{ currentRow.updatedAt }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">月度分配情况</el-divider>
      <el-table :data="monthlyAllocation" border size="small">
        <el-table-column prop="month" label="月份" width="80" align="center" />
        <el-table-column prop="planned" label="计划分配" width="120" align="right">
          <template slot-scope="scope">¥ {{ scope.row.planned }} 万</template>
        </el-table-column>
        <el-table-column prop="actual" label="实际累计" width="120" align="right">
          <template slot-scope="scope">¥ {{ scope.row.actual }} 万</template>
        </el-table-column>
        <el-table-column prop="execRate" label="执行率" width="100" align="right">
          <template slot-scope="scope">{{ scope.row.execRate }}%</template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="180" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'BudgetOverview',
  data() {
    return {
      query: { unit: '', year: '2026' },
      form: { unit: '', year: 2026, totalAmount: 1000, remark: '' },
      showForm: false,
      showDetail: false,
      isEdit: false,
      currentRow: {},
      monthlyAllocation: [
        { month: '1月', planned: 708, actual: 685, execRate: 96.8, note: '正常' },
        { month: '2月', planned: 708, actual: 632, execRate: 89.3, note: '春节运量略降' },
        { month: '3月', planned: 708, actual: 720, execRate: 101.7, note: '业务恢复' },
        { month: '4月', planned: 708, actual: 745, execRate: 105.2, note: 'LNG 燃料超支' }
      ],
      tableData: [
        { unitName: '车队 / 红树林', year: 2026, totalAmount: 13500, allocated: 9600, balance: 3900, status: '执行中', updatedAt: '2026-05-12 10:30', creator: '马伶俐' },
        { unitName: '车队 / 新鹏运', year: 2026, totalAmount: 11200, allocated: 11280, balance: -80, status: '超额预警', updatedAt: '2026-05-11 16:42', creator: '车队财务' },
        { unitName: '加气站（天山乡站等）', year: 2026, totalAmount: 7400, allocated: 3200, balance: 4200, status: '执行中', updatedAt: '2026-05-10 09:15', creator: '马伶俐' },
        { unitName: '廊道（建设期）', year: 2026, totalAmount: 480000, allocated: 384000, balance: 96000, status: '执行中', updatedAt: '2026-05-12 11:20', creator: '马伶俐' },
        { unitName: '制氢工厂', year: 2026, totalAmount: 12000, allocated: 0, balance: 12000, status: '草稿', updatedAt: '2026-05-12 15:00', creator: '马伶俐' }
      ]
    }
  },
  methods: {
    search() {
      this.$message.info('查询逻辑由后端实现（演示）')
    },
    reset() {
      this.query = { unit: '', year: '2026' }
    },
    openCreate() {
      this.isEdit = false
      this.form = { unit: '', year: 2026, totalAmount: 1000, remark: '' }
      this.showForm = true
    },
    openEdit(row) {
      this.isEdit = true
      this.form = {
        unit: row.unitName === '车队 1' ? 'fleet1' : 'fleet2',
        year: row.year,
        totalAmount: row.totalAmount,
        remark: ''
      }
      this.currentRow = row
      this.showForm = true
    },
    openDetail(row) {
      this.currentRow = row
      this.showDetail = true
    },
    handleSubmit() {
      const action = this.isEdit ? '已保存修改' : '已创建'
      this.$message.success(`${action}（演示，未实际写入）`)
      this.showForm = false
    },
    confirmDelete(row) {
      this.$confirm(
        `确认删除 ${row.unitName} 的 ${row.year} 年度资源池？删除后已分配数据将一并清理，操作不可恢复。`,
        '删除确认',
        { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
      ).then(() => {
        this.$message.success(`已删除 ${row.unitName}（演示）`)
      }).catch(() => {})
    },
    formatMoney(v) {
      if (v == null || isNaN(Number(v))) return '0'
      return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 0 })
    },
    statusTag(s) {
      if (s === '执行中') return 'success'
      if (s === '超额预警') return 'danger'
      if (s === '草稿') return 'info'
      return ''
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

.warning {
  color: #F56C6C;
  font-weight: 600;
}

.danger-text {
  color: #F56C6C;
}

.pagination {
  margin-top: 12px;
  text-align: right;
}

.auto-fields-note {
  margin-top: 12px;
  font-size: 12px;
  color: #606266;
  background: #FAFBFC;
  padding: 10px 14px;
  border-radius: 2px;
  border: 1px solid #E4E7ED;
  line-height: 1.8;
}

.auto-fields-note strong {
  color: #303133;
  display: block;
  margin-bottom: 4px;
}

.auto-fields-note ul {
  margin: 0;
  padding-left: 20px;
}

.auto-fields-note b {
  color: #409EFF;
}
</style>
