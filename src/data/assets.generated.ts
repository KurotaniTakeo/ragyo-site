/* 此文件由 scripts/gen-images.mjs 自动生成，请勿手动编辑。 */

export interface GeneratedImage {
  /** 最大尺寸版本，用作 src 与 OGP 兜底 */
  src: string
  /** WebP 回退 srcset */
  srcset: string
  /** AVIF 首选 srcset */
  avifSrcset: string
  width: number
  height: number
  /** 20px 宽的模糊占位图（data URI） */
  lqip: string
  note: string
}

export const images = {
  "character.outfit-b": {
    "src": "/img/generated/character-outfit-b-3200.webp",
    "srcset": "/img/generated/character-outfit-b-640.webp 640w, /img/generated/character-outfit-b-1024.webp 1024w, /img/generated/character-outfit-b-1600.webp 1600w, /img/generated/character-outfit-b-2400.webp 2400w, /img/generated/character-outfit-b-3200.webp 3200w",
    "avifSrcset": "/img/generated/character-outfit-b-640.avif 640w, /img/generated/character-outfit-b-1024.avif 1024w, /img/generated/character-outfit-b-1600.avif 1600w, /img/generated/character-outfit-b-2400.avif 2400w, /img/generated/character-outfit-b-3200.avif 3200w",
    "width": 3200,
    "height": 4745,
    "lqip": "data:image/webp;base64,UklGRoYAAABXRUJQVlA4IHoAAABwBACdASoUAB4APuVepU2pJSOiMAwBIByJZwAAW4befedfPgCi9PpxnEZfAAD+8MlQd46vNUX+BM6GjdPweimq9fEyjd/zEFgfgZPwlt9OsWOgz8t9JONyAZ6vQLHWBPksbJMUppRlmvYjBeH0eqesotdViAdGLCAAAA==",
    "note": "服装 B・正面站姿・红色领带清晰。"
  },
  "character.outfit-b-bust": {
    "src": "/img/generated/character-outfit-b-bust-2400.webp",
    "srcset": "/img/generated/character-outfit-b-bust-640.webp 640w, /img/generated/character-outfit-b-bust-1024.webp 1024w, /img/generated/character-outfit-b-bust-1600.webp 1600w, /img/generated/character-outfit-b-bust-2400.webp 2400w",
    "avifSrcset": "/img/generated/character-outfit-b-bust-640.avif 640w, /img/generated/character-outfit-b-bust-1024.avif 1024w, /img/generated/character-outfit-b-bust-1600.avif 1600w, /img/generated/character-outfit-b-bust-2400.avif 2400w",
    "width": 2400,
    "height": 2562,
    "lqip": "data:image/webp;base64,UklGRnQAAABXRUJQVlA4IGgAAAAwBACdASoUABUAPulcp02pJKOiN/VYASAdCWcAAC32YqHqokE7AQ78wwAA/vDLlRLJxBwdnVPmsWoYlqYPfq0BSdiyGXKVR72YfbEHZuvhhDF6AhRs9pSwqMAVNjrmz+1EGBZNspYAAA==",
    "note": "服装 B・半身像（头部至半腿）。保留整幅宽度以容纳完整的麦克风线回环，仅纵向裁剪。"
  },
  "character.outfit-a": {
    "src": "/img/generated/character-outfit-a-3200.webp",
    "srcset": "/img/generated/character-outfit-a-640.webp 640w, /img/generated/character-outfit-a-1024.webp 1024w, /img/generated/character-outfit-a-1600.webp 1600w, /img/generated/character-outfit-a-2400.webp 2400w, /img/generated/character-outfit-a-3200.webp 3200w",
    "avifSrcset": "/img/generated/character-outfit-a-640.avif 640w, /img/generated/character-outfit-a-1024.avif 1024w, /img/generated/character-outfit-a-1600.avif 1600w, /img/generated/character-outfit-a-2400.avif 2400w, /img/generated/character-outfit-a-3200.avif 3200w",
    "width": 3200,
    "height": 4745,
    "lqip": "data:image/webp;base64,UklGRoIAAABXRUJQVlA4IHYAAABQBACdASoUAB4APuVepU2pJSOiMAwBIByJZwAAW4NTo5vqN64Z9D0Ak2AAAP7wyVB3jq81RmOCmyetPBoh/s9sANQIMlb1/DUX1bKMi5hxsRWkwB5vCfzRGbflAbadv+VPqUg88kDTnRiGiY1NFMW0sXCUGBAA",
    "note": "服装 A・正面站姿・夹克扣起。"
  },
  "character.sheet": {
    "src": "/img/generated/character-sheet-1924.webp",
    "srcset": "/img/generated/character-sheet-640.webp 640w, /img/generated/character-sheet-1024.webp 1024w, /img/generated/character-sheet-1600.webp 1600w, /img/generated/character-sheet-1924.webp 1924w",
    "avifSrcset": "/img/generated/character-sheet-640.avif 640w, /img/generated/character-sheet-1024.avif 1024w, /img/generated/character-sheet-1600.avif 1600w, /img/generated/character-sheet-1924.avif 1924w",
    "width": 1924,
    "height": 2480,
    "lqip": "data:image/webp;base64,UklGRp4AAABXRUJQVlA4IJIAAACQBACdASoUABoAPu1qrVEppaQiqAqpMB2JQAB8qCE8oAM59Gut71KRqkay4iwA/u9jTs0moAJ53DIIaTHkZ4rF7SgY41eumpM+WIaeVEV032iPvkPxWmWkE1E2x2XBjPVoVLeFcMSrRKdbNxhFjODeGnxdmcP9GrE00PpjbMbd5fwxnE1HM8aWKAj+mvEMI1K4AA==",
    "note": "设定图・正面与背面双视图・含耳麦与尾巴。"
  }
} as const satisfies Record<string, GeneratedImage>

export type ImageKey = keyof typeof images
