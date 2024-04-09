<script lang="ts">
  export let book: Book;
  export let overlay: boolean = false;
  export let pageHeight: boolean = false;
  let src: string;
  $: src = book ? `bookimage://${book.cache.urlpath}.jpg?t=${book.images.imageUpdated ?? 0}` : "";
</script>

{#if book && book.images.hasImage}
  {#key book.images.imageUpdated}
    {#if overlay}
      <div class="bookComposite" class:pageHeight>
        <img {src} alt="" />
      </div>
    {:else}
      <img {src} alt="" />
    {/if}
  {/key}
{/if}

<style lang="scss">
  img {
    max-height: var(--book-height, 100%);
    max-width: 100%;
  }

  .bookComposite {
    position: relative;
    display: inline-block;
    max-height: var(--book-height, 100%);

    img {
      display: block;
      box-shadow: rgb(0, 0, 0, 0.3) 0.14rem 0.14rem 0.6rem 0.2rem;
      border-radius: 2px;
    }

    &.pageHeight {
      max-height: 85vh;

      img {
        max-height: 85vh;
      }
    }

    &::after {
      content: "";
      display: inline-block;
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      border-radius: 2px;
      background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.1) 2%,
          rgba(0, 0, 0, 0.1) 4%,
          rgba(255, 255, 255, 0) 8%
        ),
        radial-gradient(circle at 55% 35%, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.2) 100%),
        radial-gradient(circle at 55% 25%, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 50%);
      box-shadow:
        inset rgba(255, 255, 255, 0.6) -0.25rem 0.25rem 0.4rem -0.4rem,
        inset rgba(0, 0, 0, 1) 0.15rem -0.15rem 0.6rem -0.3rem;
    }
  }
</style>