<template>
  <td @mouseover="onMouseOver"
      @mouseleave="onMouseLeave"
      @click="onClick"
      :class="{
        disabled: isPlayable && !isSelectable,
        playable: isPlayable,
        selectable: isSelectable,
        removable: isRemovable
      }"
      :style="cssProps"></td>
</template>

<script>

export default {
  name: 'Tile',
  props: {
    tileColor: String,
    hoverColor: String,
    isPlayable: Boolean,
    isSelectable: Boolean,
    isRemovable: Boolean
  },
  data() {
    return {
      hovered: false
    };
  },
  methods: {
    onMouseOver() {
      this.hovered = true;
    },
    onMouseLeave() {
      this.hovered = false;
    },
    async onClick() {
      if (this.isSelectable || this.isRemovable) {
        this.$emit('tile-clicked');
      }
    },
  },
  computed: {
    cssProps() {
      return `--tile-bg-color: ${this.tileColor || '#F9F9F9'}; --tile-hover-bg-color: ${this.hoverColor}`;
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
td {
  width: 80px;
  height: 80px;
  background-color: var(--tile-bg-color);
  border-radius: 5px;
  box-sizing: border-box;
}

td.playable:not(.selectable:hover) {
  border: 2px dashed darkgray;
}

td.selectable:not(.disabled):hover, td.removable:not(.disabled):hover {
  background-color: var(--tile-hover-bg-color);
  cursor: pointer;
  opacity: 0.5;
}

td.disabled {
  cursor: not-allowed;
}
</style>
