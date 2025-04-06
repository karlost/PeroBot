import type { Group } from 'three'
import { Box3, Vector3 } from 'three'
import { ref, watch } from 'vue'

export interface ModelSize {
  width: number
  height: number
  depth: number
}

export interface ModelOffset {
  x: number
  y: number
  z: number
}

export function useModelSize() {
  const modelSize = ref<ModelSize>({ width: 0, height: 0, depth: 0 })
  const modelOffset = ref<ModelOffset>({ x: 0, y: 0, z: 0 })
  const scale = ref(1)

  function calculateModelSize(modelGroup: Group | null) {
    if (!modelGroup)
      return

    try {
      const box = (new Box3()).setFromObject(modelGroup, true)
      const size = new Vector3()
      box.getSize(size)

      modelOffset.value = {
        x: size.x / scale.value / -2,
        y: size.y / scale.value / -2,
        z: 0,
      }

      modelSize.value = {
        width: Number(size.x.toFixed(2)),
        height: Number(size.y.toFixed(2)),
        depth: Number(size.z.toFixed(2)),
      }
    }
    catch (error) {
      console.error('计算模型尺寸失败:', error)
    }
  }

  function calcScale(nowScale: number, nowSize: number, targetSize: number) {
    return targetSize / (nowSize / nowScale)
  }

  function updateScale(newSize: number, currentSize: number) {
    if (currentSize === 0)
      return
    scale.value = calcScale(scale.value, currentSize, newSize)
  }

  function watchModelSizeChanges(modelGroup: MaybeRefOrGetter<Group | null>, shapes: MaybeRefOrGetter<any[]>) {
    watch([() => toValue(modelGroup), scale, () => toValue(shapes).map(i => [i.depth, i.startZ])], () => {
      calculateModelSize(toValue(modelGroup))
    })
  }

  const size = computed({
    get() {
      return Math.max(modelSize.value.width, modelSize.value.height)
    },
    set(value) {
      updateScale(value, Math.max(modelSize.value.width, modelSize.value.height))
    },
  })

  return {
    modelSize,
    modelOffset,
    scale,
    calculateModelSize,
    updateScale,
    watchModelSizeChanges,
    size,
  }
}
