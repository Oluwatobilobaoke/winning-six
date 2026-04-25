<template>
    <div class="container mx-auto p-4">
      <h2 class="text-xl font-bold mb-4">Seasons</h2>
  
      <!-- Create New Season -->
      <div class="flex flex-col md:flex-row gap-4 mb-4">
        <input
          v-model="newSeason"
          type="text"
          placeholder="Enter season name"
          class="border p-2 flex-grow"
        />
        <button @click="addSeason" class="bg-blue-500 text-white px-4 py-2">
          Add Season
        </button>
      </div>
  
      <!-- List of Seasons -->
      <div v-if="seasons.length > 0">
        <div
          v-for="season in seasons"
          :key="season.id"
          class="flex justify-between items-center border p-3 mb-2 rounded shadow-sm bg-white"
        >
          <span class="font-semibold">{{ season.name }}</span>
          <div class="flex items-center gap-2">
            <button
              v-if="!season.hasGames"
              @click="deleteSeason(season)"
              class="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      <p v-else class="text-gray-500">No seasons available.</p>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import {db} from "@/firebase";
  import {collection, getDocs, addDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
  
  export default {
    setup() {
      const seasons = ref([]);
      const newSeason = ref('');
  
      // Fetch all seasons and check if they have games
      const fetchSeasons = async () => {
        const seasonSnapshot = await getDocs(collection(db, 'seasons'));
        const fetchedSeasons = await Promise.all(
          seasonSnapshot.docs.map(async (docSnap) => {
            const seasonData = { id: docSnap.id, ...docSnap.data() };
  
            // Check if the season has any games
            const gamesQuery = query(collection(db, 'games'), where('seasonId', '==', seasonData.id));
            const gamesSnapshot = await getDocs(gamesQuery);
            seasonData.hasGames = !gamesSnapshot.empty;
  
            return seasonData;
          })
        );
        seasons.value = fetchedSeasons;
      };
  
      // Add a new season
      const addSeason = async () => {
        if (!newSeason.value.trim()) {
          alert('Season name cannot be empty!');
          return;
        }
  
        await addDoc(collection(db, 'seasons'), { name: newSeason.value, createdAt: serverTimestamp() });
        newSeason.value = '';
        fetchSeasons();
      };
  
      // Delete a season with confirmation
      const deleteSeason = async (season) => {
        if (season.hasGames) {
          alert('Cannot delete a season that has games!');
          return;
        }
  
        const confirmDelete = confirm(`Are you sure you want to delete season "${season.name}"?`);
        if (confirmDelete) {
          await deleteDoc(doc(db, 'seasons', season.id));
          fetchSeasons();
        }
      };
  
      onMounted(fetchSeasons);
  
      return { seasons, newSeason, addSeason, deleteSeason };
    }
  };
  </script>
  
  <style>
  .container {
    max-width: 600px;
    margin: auto;
  }
  </style>
  