import { createRouter, createWebHistory } from 'vue-router'
import { auth,authStateListener, onAuthStateChanged } from "@/auth";
import {db, doc, getDoc} from "@/firebase";
import Rankings from '../components/Rankings.vue'
import Games from '../components/Games.vue'
import Players from '../components/Players.vue'
import Seasons from '../components/Seasons.vue'
import Login from '../components/Login.vue'
import MatchDay from '@/components/MatchDay.vue';
import Teams from '@/components/Teams.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Rankings',
      component: Rankings,
    },
    {
      path: '/games',
      name: 'About',
      component: Games,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/players',
      name: 'Player',
      component: Players,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/seasons',
      name: 'Season',
      component: Seasons,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/matchdays',
      name: 'MatchDay',
      component: MatchDay,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/teams',
      name: 'Team',
      component: Teams,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
    }
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],
})

async function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = authStateListener((user) => {
      unsubscribe(); // Stop listening after the first result
      resolve(user);
    });
  });
}


router.beforeEach(async (to, from, next) => {
  

  if(!to.meta.requiresAuth) {
    next();
    return;
  }

  const user = await getCurrentUser();

  if (to.meta.requiresAuth && !user) {
    next("/login");
  } else if (to.meta.requiresAdmin && user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();


    if (userData?.role === "admin") {
      next();
    } else {
      next("/");
    }
  } else {
    next();
  }
  
});

export default router
