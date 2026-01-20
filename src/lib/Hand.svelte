<script lang="ts">
  import type { Hand, Tile } from './mahjong/types';
  import { Suit } from './mahjong/types';
  import backTile from '../assets/mahjong-tiles/back.svg';

  interface Props {
    hand: Hand | null;
    visible: boolean;
    showNumbers: boolean;
  }

  let { hand, visible, showNumbers }: Props = $props();

  function tileToTenhou(tile: Tile): string {
    return `${tile.value}${tile.suit}`;
  }

  function getTileImagePath(tile: Tile): string {
    const tenhou = tileToTenhou(tile);
    const folder = showNumbers ? 'number' : 'original';
    // Vite will resolve this path at build time
    return `src/assets/mahjong-tiles/${folder}/${tenhou}.svg`;
  }
</script>

<div class="hand">
  {#if hand && hand.length > 0}
    {#each hand as tile (tile)}
      <div class="tile">
        {#if visible}
          <img src={getTileImagePath(tile)} alt={tileToTenhou(tile)} />
        {:else}
          <img src={backTile} alt="back" />
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .hand {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    align-items: center;
  }

  .tile {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tile img {
    width: 3rem;
    height: auto;
    display: block;
  }
</style>
