/**
 * Node ESM resolve hook.
 *
 * `@material/material-color-utilities` 是 TypeScript 以旧式 module 配置编译产出的，
 * 包内相对导入省略了 `.js` 扩展名（例如 `./dynamiccolor/dynamic_color`）。
 * 浏览器打包器会自动补全，但 Node 原生 ESM 解析器不允许，因此这里补一层容错解析。
 */
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      for (const candidate of [`${specifier}.js`, `${specifier}/index.js`]) {
        try {
          return await nextResolve(candidate, context)
        } catch {
          /* 尝试下一个候选 */
        }
      }
    }
    throw error
  }
}
