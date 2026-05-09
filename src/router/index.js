import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, isAdmin } from '@/auth'
import Rankings from '../components/Rankings.vue'
import Games from '../components/Games.vue'
import Players from '../components/Players.vue'
import BulkAddPlayers from '../components/BulkAddPlayers.vue'
import Seasons from '../components/Seasons.vue'
import Login from '../components/Login.vue'
import MatchDay from '@/components/MatchDay.vue'
import Teams from '@/components/Teams.vue'
import Randomize from '@/components/Randomize.vue'
import Admins from '@/components/Admins.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Rankings',
      component: Rankings,
      meta: { requiresAuth: true },
    },
    {
      path: '/games',
      name: 'Games',
      component: Games,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/players',
      name: 'Players',
      component: Players,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/players/bulk',
      name: 'BulkAddPlayers',
      component: BulkAddPlayers,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/seasons',
      name: 'Seasons',
      component: Seasons,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/matchdays',
      name: 'MatchDay',
      component: MatchDay,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/randomize',
      name: 'Randomize',
      component: Randomize,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admins',
      name: 'Admins',
      component: Admins,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/teams',
      name: 'Teams',
      component: Teams,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { path: '/' }
  }
  if (to.name === 'Login' && isAuthenticated.value) {
    return { path: '/' }
  }
  return true
})

export default router
