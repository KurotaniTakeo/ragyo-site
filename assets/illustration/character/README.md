# 立绘原稿命名对照

本目录的立绘原稿统一使用英文文件名。命名规范：

```
[<姿势>-]<表情>-<造型>.png      # 常规立绘
<用途>.png                      # 设定图等
```

- **姿势**：`pockets`（插袋，手插兜）／省略（非插袋）。
- **表情**：`smile`（微笑，闭嘴）／`open-mouth`（张嘴）。
- **造型**：`costume-1`（公式1，红领带）／`costume-2`（公式2，无领带黑衬衫）。
- 立绘原稿尺寸均为 9927×14720；`front-back.png` 为 1924×2480 的正/背设定图。

## 对照表

| 英文文件名 | 中文原名 | 早期数字名 | 内容 |
| --- | --- | --- | --- |
| `pockets-smile-costume-1.png` | 插袋微笑-公式1 | `4.png` | 红领带・手插兜・闭嘴微笑 |
| `pockets-smile-costume-2.png` | 插袋微笑-公式2 | `1.png` | 无领带黑衬衫・手插兜・闭嘴微笑 |
| `pockets-open-mouth-costume-1.png` | 插袋张嘴-公式1 | `5.png` | 红领带・手插兜・张嘴 |
| `pockets-open-mouth-costume-2.png` | 插袋张嘴-公式2 | `3.png` | 无领带黑衬衫・手插兜・张嘴 |
| `smile-costume-1.png` | 微笑-公式1 | — | 红领带・非插兜・闭嘴微笑 |
| `smile-costume-2.png` | 微笑-公式2 | — | 无领带黑衬衫・非插兜・闭嘴微笑 |
| `open-mouth-costume-1.png` | 张嘴-公式1 | — | 红领带・非插兜・张嘴 |
| `open-mouth-costume-2.png` | 张嘴-公式2 | — | 无领带黑衬衫・非插兜・张嘴 |
| `front-back.png` | 正反面 | `7.png` | 设定图・正面与背面双视图 |

## 备注

- 早期纯数字命名（`1.png`–`7.png`）已删除。其中 `1/3/4/5/7.png` 与上表中文原名逐字节相同；`6.png`（近似重复稿，与 `4.png` 重合度 SSIM 0.9999）一并删除。
- 文件名与派生规则的**唯一事实来源**是 [`scripts/assets.manifest.json`](../../../scripts/assets.manifest.json)；业务代码一律经 `src/data/assets.ts` 的语义化键引用，不出现具体文件名。
