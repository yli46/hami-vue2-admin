<template>
  <div>
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" size="small">
        <el-form-item label="预警级别">
          <el-select v-model="query.level" placeholder="全部" clearable style="width: 120px;">
            <el-option label="红色" value="red" />
            <el-option label="黄色" value="yellow" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务单元">
          <el-select v-model="query.unit" placeholder="全部" clearable style="width: 160px;">
            <el-option label="车队 1" value="fleet1" />
            <el-option label="车队 2" value="fleet2" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px;">
            <el-option label="待处置" value="pending" />
            <el-option label="处置中" value="handling" />
            <el-option label="已闭环" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="query.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="yyyy-MM-dd"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div slot="header" class="card-toolbar">
        <span>预算执行预警 — 共 {{ tableData.length }} 条</span>
        <div>
          <el-button size="small" plain @click="batchAck">批量标记已读</el-button>
          <el-button size="small" icon="el-icon-download" plain>导出</el-button>
        </div>
      </div>
      <el-table :data="tableData" border size="small" @selection-change="onSelect">
        <el-table-column type="selection" width="44" />
        <el-table-column prop="triggerTime" label="预警时间" width="150" />
        <el-table-column prop="item" label="预警项" min-width="180" />
        <el-table-column prop="unit" label="业务单元" width="110" align="center" />
        <el-table-column prop="actualValue" label="实际值" width="100" align="right" />
        <el-table-column prop="budgetValue" label="预算值" width="100" align="right" />
        <el-table-column label="偏差" width="100" align="right">
          <template slot-scope="scope">
            <span class="warning-text">{{ scope.row.variance }}</span>
          </template>
        </el-table-column>
        <el-table-column label="级别" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === 'red' ? 'danger' : 'warning'" size="mini">
              {{ scope.row.level === 'red' ? '红色' : '黄色' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.status)" size="mini">
              {{ statusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="处置人" width="100" align="center" />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="viewDetail(scope.row)">详情</el-button>
            <el-button type="text" size="mini" @click="handle(scope.row)" v-if="scope.row.status !== 'closed'">处置</el-button>
            <el-button type="text" size="mini" @click="addNote(scope.row)">说明</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="tableData.length" :page-size="20" />
      </div>
    </el-card>

    <el-dialog title="预警处置" :visible.sync="showHandle" width="560px">
      <el-form :model="handleForm" label-width="90px" size="small">
        <el-form-item label="预警项">
          <span>{{ handleForm.item }}</span>
        </el-form-item>
        <el-form-item label="偏差原因">
          <el-input
            v-model="handleForm.reason"
            type="textarea"
            :rows="3"
            placeholder="如：4 月气价上涨 8%，已超过预算时未考虑"
          />
        </el-form-item>
        <el-form-item label="处置动作">
          <el-radio-group v-model="handleForm.action">
            <el-radio label="continue">继续监控</el-radio>
            <el-radio label="adjust">申请调整预算</el-radio>
            <el-radio label="escalate">上报领导</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showHandle = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">提交</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CostAlerts',
  data() {
    return {
      query: { level: '', unit: '', status: '', dateRange: [] },
      selected: [],
      showHandle: false,
      handleForm: { item: '', reason: '', action: 'continue' },
      tableData: [
        { triggerTime: '2026-04-30 24:00', item: 'LNG 燃料费占比超阈值', unit: '车队 1', actualValue: '32.0%', budgetValue: '30.0%', variance: '+2.0 pp', level: 'yellow', status: 'pending', owner: '—' },
        { triggerTime: '2026-04-30 24:00', item: '车辆维保费占比超阈值', unit: '车队 1', actualValue: '9.0%', budgetValue: '8.0%', variance: '+1.0 pp', level: 'yellow', status: 'pending', owner: '—' },
        { triggerTime: '2026-04-15 24:00', item: '吨公里成本超阈值', unit: '车队 2', actualValue: '¥1.45', budgetValue: '¥1.31', variance: '+10.7%', level: 'red', status: 'handling', owner: '马伶俐' },
        { triggerTime: '2026-04-10 24:00', item: '司机趟结工资环比异常', unit: '车队 1', actualValue: '+18%', budgetValue: '基准', variance: '+18%', level: 'yellow', status: 'closed', owner: '马伶俐' },
        { triggerTime: '2026-04-03 24:00', item: 'LNG 燃料费占比偏低', unit: '车队 2', actualValue: '26.0%', budgetValue: '30.0%', variance: '-4.0 pp', level: 'yellow', status: 'closed', owner: '王江江' }
      ]
    }
  },
  methods: {
    search() { this.$message.info('查询逻辑由后端实现（演示）') },
    reset() { this.query = { level: '', unit: '', status: '', dateRange: [] } },
    onSelect(v) { this.selected = v },
    batchAck() {
      if (!this.selected.length) {
        this.$message.warning('请先勾选记录')
        return
      }
      this.$message.success(`已标记 ${this.selected.length} 条为已读`)
    },
    viewDetail(row) { this.$message.info(`查看 ${row.item} 详情`) },
    handle(row) {
      this.handleForm = { item: row.item, reason: '', action: 'continue' }
      this.showHandle = true
    },
    addNote(row) { this.$message.info(`为 ${row.item} 添加说明`) },
    submitHandle() {
      this.$message.success('处置已提交（演示）')
      this.showHandle = false
    },
    statusLabel(s) {
      return s === 'pending' ? '待处置' : s === 'handling' ? '处置中' : '已闭环'
    },
    statusTag(s) {
      return s === 'pending' ? 'danger' : s === 'handling' ? 'warning' : 'success'
    }
  }
}
</script>

<style scoped>
.search-card,
.table-card {
  border: 1px solid #DCDFE6;
}

.search-card {
  margin-bottom: 12px;
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
</style>
