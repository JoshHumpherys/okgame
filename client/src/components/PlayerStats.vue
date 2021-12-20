<template>
  <div class="player-stats" :style="cssProps">
    <h1>{{ name }}</h1>
    <div class="mini-tile-container">
      <div v-for="i in numTilesRemaining" :key="i" class="mini-tile"></div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'PlayerStats',
  components: {
  },
  props: {
    id: Number,
    name: String,
    color: String,
    numTilesRemaining: Number
  },
  data() {
    return {
    };
  },
  methods: {
  },
  computed: {
    cssProps() {
      return [
        '--border: 5px solid ' + this.color,
        '--color: ' + this.color
      ].join(';');
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.player-stats {
  height: 300px;
  width: 300px;
  border: var(--border);
  background-color: lightgray;
  margin: 20px;
  border-radius: 15px;
}
h1 {
}
.mini-tile-container {
  display: flex;
  flex-wrap: wrap;
}
.mini-tile {
  min-width: 20px;
  min-height: 20px;
  margin: 5px;
  background-color: var(--color);
  border-radius: 3px;
}
</style>
