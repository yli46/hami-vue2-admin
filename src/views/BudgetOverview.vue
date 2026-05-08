<template>
  <div class="page">
    <!-- 查询卡 -->
    <el-card class="search-card">
      <el-form :inline="true" size="small">
        <el-form-item label="业务单元">
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 160px;">
            <el-option label="车队 1" value="fleet1" />
            <el-option label="车队 2" value="fleet2" />
            <el-option label="廊道（本期不参与）" value="corridor" disabled />
            <el-option label="加氢站（本期不参与）" value="hydrogen" disabled />
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

    <!-- 操作 + 表格 -->
    <el-card class="table-card">
      <div class="card-toolbar">
        <h3>业务单元年度资源池</h3>
        <div>
          <el-button type="primary" icon="el-icon-plus" @click="openCreate">新增</el-button>
          <el-button icon="el-icon-download">导出</el-button>
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
        <el-table-column label="操作" width="150" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="openDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" @click="openEdit(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="tableData.length"
          :page-size="20"
        />
      </div>
    </el-card>

    <!-- 新增弹窗（占位） -->
    <el-dialog title="新增业务单元资源池" :visible.sync="showCreate" width="520px">
      <el-form :model="form" label-width="120px" size="small">
        <el-form-item label="业务单元">
          <el-select v-model="form.unit" placeholder="请选择" style="width: 100%;">
            <el-option label="车队 1" value="fleet1" />
            <el-option label="车队 2" value="fleet2" />
          </el-select>
        </el-form-item>
        <el-form-item label="年度">
          <el-select v-model="form.year" style="width: 100%;">
            <el-option label="2026" value="2026" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源总盘">
          <el-input-number v-model="form.totalAmount" :min="0" :step="100" />
          <span style="margin-left: 8px; color: #606266;">万元</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'BudgetOverview',
  data() {
    return {
      query: { unit: '', year: '2026' },
      form: { unit: '', year: '2026', totalAmount: 1000 },
      showCreate: false,
      tableData: [
        { unitName: '车队 1', year: 2026, totalAmount: 8500, allocated: 6200, balance: 2300, status: '执行中', updatedAt: '2026-05-07 10:30' },
        { unitName: '车队 2', year: 2026, totalAmount: 7200, allocated: 7300, balance: -100, status: '超额预警', updatedAt: '2026-05-06 16:42' }
      ]
    }
  },
  methods: {
    search() {
      this.$message.info('查询逻辑由后端实现')
    },
    reset() {
      this.query = { unit: '', year: '2026' }
    },
    openCreate() {
      this.showCreate = true
    },
    handleCreate() {
      this.$message.success('已创建（演示，未实际写入）')
      this.showCreate = false
    },
    openDetail(row) {
      this.$message.info(`查看 ${row.unitName} 详情`)
    },
    openEdit(row) {
      this.$message.info(`编辑 ${row.unitName}`)
    },
    formatMoney(v) {
      return v.toLocaleString('zh-CN', { minimumFractionDigits: 0 })
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

.card-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-toolbar h3 {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

.warning {
  color: #F56C6C;
  font-weight: 600;
}

.pagination {
  margin-top: 12px;
  text-align: right;
}
</style>
