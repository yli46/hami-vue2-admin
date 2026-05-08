<template>
  <el-container class="app-layout">
    <el-aside class="sidebar" width="220px">
      <div class="brand">
        <div class="brand-title">哈密煤运廊道一体管控平台</div>
        <div class="brand-subtitle">汽运详设</div>
      </div>
      <el-menu
        :default-active="activeMenu"
        :default-openeds="['budget', 'stats']"
        class="menu"
        :router="true"
        background-color="#1F3A5F"
        text-color="#D4DEEC"
        active-text-color="#FFFFFF"
      >
        <el-menu-item index="/home">
          <i class="el-icon-s-home"></i>
          <span>首页</span>
        </el-menu-item>

        <el-submenu index="budget">
          <template slot="title">
            <i class="el-icon-money"></i>
            <span>全面预算</span>
          </template>
          <el-menu-item index="/budget/overview">132 概算管理</el-menu-item>
          <el-menu-item index="/budget/edit">133 预算编制</el-menu-item>
          <el-menu-item index="/cost-accounting">134 核算处理</el-menu-item>
          <el-menu-item index="/decision-analysis">135 决算分析</el-menu-item>
          <el-menu-item index="/budget/coordination">136 预算目标协同</el-menu-item>
        </el-submenu>

        <el-submenu index="stats">
          <template slot="title">
            <i class="el-icon-data-line"></i>
            <span>统计分析</span>
          </template>
          <el-menu-item index="/stats/fleet">140 车辆运营统计</el-menu-item>
          <el-menu-item index="/stats/ops">141 运营统计</el-menu-item>
          <el-menu-item index="/stats/driver">142 司机绩效统计</el-menu-item>
        </el-submenu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="page-header" height="50px">
        <div class="breadcrumb">
          <span>{{ moduleLabel }}</span>
          <span class="divider">/</span>
          <span class="current">{{ pageTitle }}</span>
        </div>
        <div class="user-info">
          <span class="user-name">李扬</span>
        </div>
      </el-header>
      <el-main class="page-main">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: 'AppLayout',
  computed: {
    activeMenu() {
      return this.$route.path
    },
    pageTitle() {
      return this.$route.meta?.title || '首页'
    },
    moduleLabel() {
      const m = this.$route.meta?.module
      if (!m) return '首页'
      if (m >= '132' && m <= '136') return '全面预算'
      if (m >= '140' && m <= '142') return '统计分析'
      return '其他'
    }
  }
}
</script>

<style scoped>
.app-layout {
  height: 100vh;
}

.sidebar {
  background: #1F3A5F;
  display: flex;
  flex-direction: column;
}

.brand {
  padding: 16px 20px;
  border-bottom: 1px solid #2C4A75;
}

.brand-title {
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.brand-subtitle {
  color: #8FA8C5;
  font-size: 12px;
  margin-top: 4px;
}

.menu {
  flex: 1;
  border-right: 0;
}

.page-header {
  background: #FFFFFF;
  border-bottom: 1px solid #E4E7ED;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.breadcrumb {
  font-size: 13px;
  color: #606266;
}

.breadcrumb .divider {
  margin: 0 8px;
  color: #C0C4CC;
}

.breadcrumb .current {
  color: #303133;
  font-weight: 500;
}

.user-info {
  font-size: 13px;
  color: #606266;
}

.page-main {
  background: #F0F2F5;
  padding: 16px;
  overflow-y: auto;
}
</style>
