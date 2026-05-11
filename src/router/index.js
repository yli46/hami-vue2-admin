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
    path: '/cost-accounting',
    name: 'cost-accounting',
    component: () => import('../views/CostAccounting.vue'),
    meta: { title: '核算处理', module: '134' }
  },
  {
    path: '/decision-analysis',
    name: 'decision-analysis',
    component: () => import('../views/DecisionAnalysis.vue'),
    meta: { title: '决算分析', module: '135' }
  },
  {
    path: '/budget/coordination',
    name: 'budget-coordination',
    component: () => import('../views/BudgetCoordination.vue'),
    meta: { title: '预算目标协同', module: '136' }
  },
  {
    path: '/stats/fleet',
    name: 'stats-fleet',
    component: () => import('../views/FleetStats.vue'),
    meta: { title: '车辆运营统计', module: '140' }
  },
  {
    path: '/stats/ops',
    name: 'stats-ops',
    component: () => import('../views/OpsStats.vue'),
    meta: { title: '运营统计', module: '141' }
  },
  {
    path: '/stats/driver',
    name: 'stats-driver',
    component: () => import('../views/DriverPerf.vue'),
    meta: { title: '司机绩效统计', module: '142' }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '/freight/',
  routes
})

export default router
