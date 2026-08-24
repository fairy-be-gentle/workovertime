<script lang="ts">
  import '../app.css';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
  <main class="container mx-auto px-4 py-8">
    {@render children()}
  </main>
</div>
