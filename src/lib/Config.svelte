<script lang="ts">
  import {
    getShowNumbers,
    setShowNumbers,
    getShowTimer,
    setShowTimer,
  } from './stores/config.svelte';
</script>

<div class="config">
  <label>
    <input
      type="checkbox"
      checked={getShowNumbers()}
      onchange={(e) => setShowNumbers(e.currentTarget.checked)}
    />
    <span>Show Numbers</span>
  </label>
  <label>
    <input
      type="checkbox"
      checked={getShowTimer()}
      onchange={(e) => setShowTimer(e.currentTarget.checked)}
    />
    <span>Show Timer</span>
  </label>
</div>

<style>
  .config {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .config label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
  }

  .config input[type='checkbox'] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  .config span {
    font-size: 1rem;
  }

  @media (min-width: 768px) {
    .config {
      flex-direction: row;
    }
  }
</style>
