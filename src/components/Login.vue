<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 class="text-2xl font-bold text-center text-gray-700">Welcome Back!</h2>
        <p class="text-center text-gray-500 mb-6">Sign in to access your account</p>
  
        <!-- Email Input -->
        <div class="mb-4">
          <label class="block text-gray-600 text-sm font-medium">Email</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="Enter your email"
            class="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
          />
        </div>
  
        <!-- Password Input -->
        <div class="mb-4">
          <label class="block text-gray-600 text-sm font-medium">Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="Enter your password"
            class="w-full p-3 border rounded-lg focus:ring focus:ring-blue-300"
          />
        </div>

        <p v-if="errorMessage" class="text-red-500 text-sm mb-4 text-center">
            {{ errorMessage }}
        </p>
  
        <!-- Login Button -->
        <button 
          @click="handleLogin"
          class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-300"
        >
          Sign In
        </button>
  
      </div>
    </div>
</template>
  
  <script>
  import { ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { login } from "@/auth";

  export default {
    setup() {
      const route = useRoute();
      const router = useRouter();
      const email = ref("");
      const password = ref("");
      const errorMessage = ref("");

      const handleLogin = async () => {
        errorMessage.value = "";
        try {
          await login(email.value, password.value);
          const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
          router.push(redirect);
        } catch (err) {
          errorMessage.value = "Login failed: " + (err.message || "unknown error");
        }
      };

      return { email, password, handleLogin, errorMessage };
    },
  };
  </script>
  
  <style scoped>
  .login-container {
    max-width: 400px;
    margin: auto;
    text-align: center;
  }
  </style>
  