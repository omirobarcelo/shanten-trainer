<script lang="ts">
  import {
    getShowNumbers,
    setShowNumbers,
    getShowTimer,
    setShowTimer,
  } from './lib/stores/config.svelte';
  import { generateHand, getHand } from './lib/stores/game.svelte';
  import { parseTenhou } from './lib/mahjong/tenhou';
  import Hand from './lib/Hand.svelte';

  let showNumbers = $state(getShowNumbers());
  let showTimer = $state(getShowTimer());
  let hand = $state(getHand());
  let visible = $state(true);

  $effect(() => {
    showNumbers = getShowNumbers();
  });

  $effect(() => {
    showTimer = getShowTimer();
  });

  $effect(() => {
    hand = getHand();
  });

  // Generate a test hand on mount
  $effect(() => {
    if (!hand) {
      generateHand();
    }
  });
</script>

<main>
  <h1>Config Store Test</h1>

  <div class="card">
    <h2>Configuration</h2>
    <div class="checkbox-group">
      <label>
        <input
          type="checkbox"
          checked={showNumbers}
          onchange={(e) => setShowNumbers(e.currentTarget.checked)}
        />
        Show Numbers
      </label>
      <label>
        <input
          type="checkbox"
          checked={showTimer}
          onchange={(e) => setShowTimer(e.currentTarget.checked)}
        />
        Show Timer
      </label>
      <label>
        <input
          type="checkbox"
          checked={visible}
          onchange={(e) => (visible = e.currentTarget.checked)}
        />
        Show Tiles (visible)
      </label>
    </div>
  </div>

  <div class="card">
    <h2>Hand Component Example</h2>
    <div class="hand-example">
      <Hand {hand} {visible} {showNumbers} />
    </div>
    <div class="hand-controls">
      <button onclick={() => generateHand()}>Generate New Hand</button>
      <button onclick={() => (visible = !visible)}>
        {visible ? 'Hide' : 'Show'} Tiles
      </button>
    </div>
    {#if hand}
      <p class="hand-info">
        Hand: {hand.length} tiles | Visible: {visible} | Show Numbers:{' '}
        {showNumbers}
      </p>
    {/if}
  </div>

  <div class="card">
    <h2>Test Display</h2>
    {#if showNumbers}
      <div class="test-box numbers-box">Numbers are visible: 1, 2, 3, 4, 5</div>
    {:else}
      <div class="test-box numbers-box hidden">Numbers are hidden</div>
    {/if}

    {#if showTimer}
      <div class="test-box timer-box">Timer: 00:00:00</div>
    {:else}
      <div class="test-box timer-box hidden">Timer is hidden</div>
    {/if}
  </div>
</main>

<style>
  main {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    text-align: center;
    margin-bottom: 2rem;
  }

  h2 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .card {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .checkbox-group input[type='checkbox'] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  .test-box {
    padding: 1rem;
    margin: 0.5rem 0;
    border-radius: 4px;
    transition: opacity 0.3s ease;
  }

  .numbers-box {
    background: #e3f2fd;
    border: 2px solid #2196f3;
  }

  .timer-box {
    background: #f3e5f5;
    border: 2px solid #9c27b0;
  }

  .test-box.hidden {
    opacity: 0.3;
    background: #e0e0e0;
    border-color: #9e9e9e;
  }

  .hand-example {
    margin: 1rem 0;
    padding: 1rem;
    background: white;
    border-radius: 4px;
    min-height: 100px;
  }

  .hand-controls {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .hand-controls button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .hand-controls button:hover {
    background: #f0f0f0;
  }

  .hand-info {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #666;
  }
</style>
