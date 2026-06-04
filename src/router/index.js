import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/home' },
  {
    path: '/home',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '首页' }
  },
  // 全面预算
  {
    path: '/budget/overview',
    name: 'budget-overview',
    component: () => import('../views/BudgetOverview.vue'),
    meta: { title: '概算管理', module: '132' }
  },
  {
    path: '/budget/edit',
    name: 'budget-edit',
    component: () => import('../views/BudgetEdit.vue'),
    meta: { title: '预算编制', module: '133' }
  },
  {
    path: '/cost/manual',
    name: 'cost-manual',
    component: () => import('../views/CostManual.vue'),
    meta: { title: '费用手动补录', module: '134' }
  },
  {
    path: '/cost/reserve',
    name: 'cost-reserve',
    component: () => import('../views/CostReserve.vue'),
    meta: { title: '备用金管理', module: '134' }
  },
  // 统计分析（QuickBI）
  {
    path: '/stats/cost',
    name: 'stats-cost',
    component: () => import('../views/StatsCost.vue'),
    meta: { title: '成本预实分析', module: '141' }
  },
  {
    path: '/stats/revenue',
    name: 'stats-revenue',
    component: () => import('../views/StatsRevenue.vue'),
    meta: { title: '收入预实分析', module: '141' }
  },
  {
    path: '/stats/ops',
    name: 'stats-ops',
    component: () => import('../views/StatsOps.vue'),
    meta: { title: '运营统计（业财贯穿）', module: '141' }
  },
  {
    path: '/stats/fleet',
    name: 'stats-fleet',
    component: () => import('../views/StatsFleet.vue'),
    meta: { title: '车辆运营统计', module: '140' }
  },
  {
    path: '/stats/driver',
    name: 'stats-driver',
    component: () => import('../views/StatsDriver.vue'),
    meta: { title: '司机绩效统计', module: '142' }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '/freight/',
  routes
})

export default router
