<script lang="ts">
  import { onMount, tick } from "svelte";

  let box: HTMLDivElement;
  let shadowTopOpacity: number = 0;
  let shadowBottomOpacity: number = 0;
  let shadowScalingFactor: number = 1;

  onMount(() => {
    tick().then(updateScroll);
    const resizeObserver = new ResizeObserver(updateScroll);
    resizeObserver.observe(box);
    return () => {
      resizeObserver.unobserve(box);
    };
  });

  /**
   * Amplify shadows at low percentages.
   *
   * @param {number} n [0-1] Value to scale
   * @param {number} x [0-1] Scaling factor (less is more)
   */
  const logScale = (n: number, x: number = 0.5) => n * ((x - Math.log10(n)) / x);

  export const updateScroll = (): void => {
    if (!box || box.offsetHeight >= box.scrollHeight) {
      shadowTopOpacity = 0;
      shadowBottomOpacity = 0;
    } else {
      shadowScalingFactor = Math.min(1, Math.max(0.5, (35000 - box.scrollHeight) / 35000));
      const percentScroll = box.scrollTop / (box.scrollHeight - box.offsetHeight);
      shadowTopOpacity = box.scrollTop === 0 ? 0 : logScale(percentScroll, shadowScalingFactor);
      shadowBottomOpacity = percentScroll === 1 ? 0 : logScale(1 - percentScroll, shadowScalingFactor);
    }
  };
</script>

<div class="scrollBox" bind:this={box} on:scroll={updateScroll}>
  <div class="scrollBox__shadow scrollBox__shadow--top" style:opacity={shadowTopOpacity}></div>
  <div class="scrollBox__shadow scrollBox__shadow--bottom" style:opacity={shadowBottomOpacity}></div>
  <div class="scrollBox__content">
    <slot />
  </div>
</div>

<style lang="scss">
  .scrollBox {
    --shadow-height: 1.25rem;

    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--c-subtle) transparent;

    &__shadow {
      position: sticky;
      left: 0;
      z-index: 50;
      width: 100%;
      height: var(--shadow-height);
      transition: opacity 0.05s linear;
      pointer-events: none;

      &--top {
        top: 0;
        background: radial-gradient(55% 1rem at top center, var(--shadow-5) 0%, transparent 100%);
      }

      &--bottom {
        top: calc(100% - var(--shadow-height));
        background: radial-gradient(55% 1rem at bottom center, var(--shadow-5) 0%, transparent 100%);
      }
    }

    &__content {
      position: relative;
      top: calc(var(--shadow-height) * -2);
      margin-bottom: calc(var(--shadow-height) * -2);
    }
  }
</style>
