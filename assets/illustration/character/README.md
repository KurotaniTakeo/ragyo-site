# 立绘原稿命名对照

本目录的立绘原稿统一使用英文文件名。命名规范：

```
[<姿势>-]<表情>-<造型>[-<描边>].png   # 常规立绘
<用途>.png                            # 设定图、单视图等
```

- **姿势**：`pockets`（插袋，手插兜）／省略（非插袋）。
- **表情**：`smile`（微笑，闭嘴）／`open-mouth`（张嘴）。
- **造型**：`costume-1`（公式1，红领带）／`costume-2`（公式2，无领带黑毛衣）。
- **描边**：省略（普通）／`outline-opaque`（不透明描边）／`outline-translucent`（半透明描边）／`glow`（发光，取代硬描边）。
- 常规立绘尺寸为 9927×14720；`front-back.png` 为 1924×2480 的正/背设定图，`back-view.png` 为 1163×2480 的背面单视图。

## 对照表

| 英文文件名 | 中文名 / 描述 | 到达时数字名 | 内容 |
| --- | --- | --- | --- |
| `pockets-smile-costume-1.png` | 插袋微笑-公式1 | `4.png` | 红领带・手插兜・闭嘴微笑 |
| `pockets-smile-costume-2.png` | 插袋微笑-公式2 | `1.png` | 无领带黑毛衣・手插兜・闭嘴微笑 |
| `pockets-open-mouth-costume-1.png` | 插袋张嘴-公式1 | `5.png` | 红领带・手插兜・张嘴 |
| `pockets-open-mouth-costume-2.png` | 插袋张嘴-公式2 | `3.png` | 无领带黑毛衣・手插兜・张嘴 |
| `smile-costume-1.png` | 微笑-公式1 | — | 红领带・非插兜・闭嘴微笑 |
| `smile-costume-2.png` | 微笑-公式2 | — | 无领带黑毛衣・非插兜・闭嘴微笑 |
| `smile-costume-2-outline-opaque.png` | 闭嘴不插兜・不透明描边版本 | `1.png` | 无领带黑毛衣・非插兜・闭嘴・不透明描边 |
| `smile-costume-2-outline-translucent.png` | 闭嘴不插兜・半透明描边版本 | `2.png` | 无领带黑毛衣・非插兜・闭嘴・半透明描边 |
| `smile-costume-2-glow.png` | 闭嘴不插兜・发光版本 | `5.png`（后补） | 无领带黑毛衣・非插兜・闭嘴・柔和发光（取代硬描边） |
| `open-mouth-costume-1.png` | 张嘴-公式1 | — | 红领带・非插兜・张嘴 |
| `open-mouth-costume-2.png` | 张嘴-公式2 | — | 无领带黑毛衣・非插兜・张嘴 |
| `front-back.png` | 正反面 | `7.png` | 设定图・正面与背面双视图 |
| `back-view.png` | 背面立绘 | `3.png` | 背面单视图（透明底） |

## 备注

- 表中 `1.png`、`2.png`、`3.png` 是**后补的一批**原稿（`1`/`2` 为描边变体、`3` 为背面），数字名与更早一批（已删除的 `1.png`–`7.png`）**无关**；两批仅数字巧合重名。
- 第一批纯数字命名（`1.png`–`7.png`）已删除：其中 `1/3/4/5/7.png` 与上表对应中文原名逐字节相同；`6.png`（近似重复稿，与 `4.png` 重合度 SSIM 0.9999）一并删除。
- `smile-costume-2-outline-opaque.png` 与 `smile-costume-2.png` 画面几乎重合，仅描边处理不同。
- `smile-costume-2-glow.png` 为最新补入的发光版本（原数字名 `5.png`），与更早两批的 `5.png` 仅是数字巧合；用于替换首页主视觉原先的硬描边稿。
- 文件名与派生规则的**唯一事实来源**是 [`scripts/assets.manifest.json`](../../../scripts/assets.manifest.json)；业务代码一律经 `src/data/assets.ts` 的语义化键引用，不出现具体文件名。本目录中的原稿若未登记进该清单，则不会被 `gen:images` 处理。
