<template>
    <div class="tag-input">
      <div class="tags">
        <span 
          v-for="(player, index) in selectedPlayers" 
          :key="index" 
          class="tag"
        >
          {{ player.name }}
          <button @click="removePlayer(index)" class="remove-btn">×</button>
        </span>
      </div>
      <input
        v-model="inputValue"
        @input="filterSuggestions"
        @keydown.enter.prevent="addPlayer"
        @keydown.backspace="removeLastPlayer"
        placeholder="Type and press Enter"
        class="input"
      />
      <ul v-if="filteredSuggestions.length && showSuggestions" class="suggestions">
        <li 
          v-for="(suggestion, index) in filteredSuggestions" 
          :key="index" 
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion.name }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import { ref, watch } from "vue";
  
  export default {
    props: {
      modelValue: Array, // Selected players
      suggestions: Array, // Players list [{ id, name }]
    },
    emits: ["update:modelValue"],
    setup(props, { emit }) {
      const selectedPlayers = ref([...props.modelValue]); // Store selected players
      const inputValue = ref("");
      const showSuggestions = ref(false);
      const filteredSuggestions = ref([]);
  
      // Watch for changes in modelValue
      watch(
        () => props.modelValue,
        (newVal) => {
          selectedPlayers.value = newVal;
        }
      );
  
      // Watch for new suggestions
      watch(
        () => props.suggestions,
        (newVal) => {
          filteredSuggestions.value = newVal || [];
        }
      );
  
      // Filter suggestions based on input value
      const filterSuggestions = () => {
        if (!inputValue.value) {
          showSuggestions.value = false;
          return;
        }
        filteredSuggestions.value = props.suggestions
          ?.filter((p) =>
            p.name.toLowerCase().includes(inputValue.value.toLowerCase())
          )
          .slice(0, 5);
        showSuggestions.value = filteredSuggestions.value.length > 0;
      };
  
      // Add player when pressing enter
      const addPlayer = () => {
        const newName = inputValue.value.trim();
        const player = props.suggestions.find(p => p.name.toLowerCase() === newName.toLowerCase());
  
        if (player && !selectedPlayers.value.some(p => p.id === player.id)) {
          selectedPlayers.value.push(player);
          emit("update:modelValue", selectedPlayers.value);
        }
        inputValue.value = "";
        showSuggestions.value = false;
      };
  
      // Remove player
      const removePlayer = (index) => {
        selectedPlayers.value.splice(index, 1);
        emit("update:modelValue", selectedPlayers.value);
      };
  
      // Select suggestion
      const selectSuggestion = (player) => {
        if (!selectedPlayers.value.some(p => p.id === player.id)) {
          selectedPlayers.value.push(player);
          emit("update:modelValue", selectedPlayers.value);
        }
        inputValue.value = "";
        showSuggestions.value = false;
      };
  
      // Remove last player when pressing backspace
      const removeLastPlayer = (event) => {
        if (!inputValue.value && selectedPlayers.value.length && event.key === "Backspace") {
          selectedPlayers.value.pop();
          emit("update:modelValue", selectedPlayers.value);
        }
      };
  
      return {
        inputValue,
        selectedPlayers,
        filteredSuggestions,
        filterSuggestions,
        addPlayer,
        removePlayer,
        selectSuggestion,
        removeLastPlayer,
        showSuggestions,
      };
    },
  };
  </script>
  
  <style scoped>
  .tag-input {
    position: relative;
    border: 1px solid #ddd;
    padding: 8px;
    border-radius: 5px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    background: #fff;
  }
  
  .tags {
    display: flex;
    flex-wrap: wrap;
  }
  
  .tag {
    background: #007bff;
    color: white;
    padding: 4px 8px;
    margin: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
  
  .remove-btn {
    background: transparent;
    border: none;
    color: white;
    margin-left: 5px;
    cursor: pointer;
  }
  
  .input {
    flex-grow: 1;
    border: none;
    outline: none;
    padding: 5px;
  }
  
  .suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    max-height: 150px;
    overflow-y: auto;
    z-index: 10;
  }
  
  .suggestions li {
    padding: 8px;
    cursor: pointer;
  }
  
  .suggestions li:hover {
    background: #f0f0f0;
  }
  </style>
  