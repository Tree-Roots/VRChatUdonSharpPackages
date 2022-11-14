// 从 https://vpm.directus.app/assets/53e9594f-1773-4bac-9c0f-81be5980bac9?download 读取最新的 vrc-curated.json
// 执行路径在 UpdateCheck 文件夹里，Packages 文件夹在上一级目录里
import { VRCCurated } from "./types.ts";
import {
  decompress
} from "https://deno.land/x/zip@v1.2.3/mod.ts";
(async () => {
  const res = await fetch(`https://vpm.directus.app/assets/53e9594f-1773-4bac-9c0f-81be5980bac9?download&cache=${new Date().toLocaleString()}`)
  const json: VRCCurated = await res.json()
  // 读取 UdonSharp 的版本号，位于 packages → com.vrchat.udonsharp → versions → x.x.x ，其中 x.x.x 为版本号，取最新的版本
  // Object.keys 选最后一个，即最新的版本
  let udonSharpVersions = Object.keys(json.packages["com.vrchat.udonsharp"].versions)
  udonSharpVersions = (f=>f(f(udonSharpVersions,1).sort(),-1)) ((udonSharpVersions,v)=>udonSharpVersions.map(a=>a.replace(/\d+/g,n=>+n+v*100000)))
  // 排序，取最后一个
  const udonSharpVersion = udonSharpVersions.pop()
  if (udonSharpVersion) {
    console.log(udonSharpVersion)
    // 读取 version.txt 的内容，与 udonSharpVersion 比较
    const versionTxt = await Deno.readTextFile("version.txt")
    if (versionTxt !== udonSharpVersion) {
      // 如果不一致，则从 url 下载最新的 zip
      const url = json.packages["com.vrchat.udonsharp"].versions[udonSharpVersion].url
      const res = await fetch(url)
      const zip = await res.arrayBuffer()
      // 解压到 UdonSharp 文件夹
      await Deno.mkdir("UdonSharp", { recursive: true })
      await Deno.writeFile("UdonSharp/UdonSharp.zip", new Uint8Array(zip))
      // 解压 zip
      await decompress("UdonSharp/UdonSharp.zip", "UdonSharp/latest")
      // 删除 ../Packages/com.vrchat.udonsharp
      await Deno.remove("../Packages/com.vrchat.udonsharp", { recursive: true })
      // 将 UdonSharp/latest 移动到 ../Packages/com.vrchat.udonsharp
      await Deno.rename("UdonSharp/latest", "../Packages/com.vrchat.udonsharp")
      // 删除 UdonSharp 文件夹
      await Deno.remove("UdonSharp", { recursive: true })
      // 写入 version.txt
      await Deno.writeTextFile("version.txt", udonSharpVersion)
      // 读取 ../README.md ，替换版本号 versionTxt 为 udonSharpVersion
      const readme = await Deno.readTextFile("../README.md")
      await Deno.writeTextFile("../README.md", readme.replaceAll(versionTxt, udonSharpVersion))
      const readmez = await Deno.readTextFile("../README_zh.md")
      await Deno.writeTextFile("../README_zh.md", readmez.replaceAll(versionTxt, udonSharpVersion))
    }
  }
})()
