<template>
    <div class="container mx-auto p-4">
      <h2 class="text-xl font-bold mb-4">Create Player</h2>
  
      <!-- Player Input -->
      <div class="mb-4 flex gap-2">
        <input 
          v-model="playerName" 
          type="text" 
          placeholder="Enter player name" 
          class="p-2 border rounded w-full"
        />
        <button 
          @click="savePlayer" 
          class="p-2 bg-blue-500 text-white rounded"
          :disabled="!playerName.trim()"
        >
          Save Player
        </button>
      </div>
  
      <!-- Error Message -->
      <p v-if="errorMessage" class="text-red-500">{{ errorMessage }}</p>
  
      <!-- Players List -->
      <div>
        <h3 class="font-semibold mb-2">Players</h3>
        <ul class="border p-2 min-h-[100px]">
          <li v-for="player in players" :key="player.id" class="p-2 border-b">
            {{ player.name }}
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  import { db } from "@/firebase";
  import { collection, addDoc, getDocs } from "firebase/firestore";
  
  export default {
    setup() {
      const playerName = ref("");
      const players = ref([]);
      const errorMessage = ref("");
  
      // Fetch players from Firestore
      const fetchPlayers = async () => {
        const querySnapshot = await getDocs(collection(db, "players"));
        players.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      };
  
      // Save player to Firestore with validation
      const savePlayer = async () => {
        errorMessage.value = ""; // Clear previous errors
        const newName = playerName.value.trim().toLowerCase();
  
        // Check if name already exists (case-insensitive)
        const nameExists = players.value.some(player => player.name.toLowerCase() === newName);
        if (nameExists) {
          errorMessage.value = "Player already exists!";
          return;
        }
  
        // Save to Firestore
        const docRef = await addDoc(collection(db, "players"), {
          name: playerName.value.trim(),
        });
  
        // Add new player to the list locally
        players.value.push({ id: docRef.id, name: playerName.value.trim() });
  
        // Clear input field
        playerName.value = "";
      };
  
      onMounted(fetchPlayers);
  
      return { playerName, players, savePlayer, errorMessage };
    },
  };
  </script>
  
  <style>
  /* Add any additional styling here */
  </style>
  