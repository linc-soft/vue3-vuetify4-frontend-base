# PDF 中文字体支持

为了在导出的 PDF 中正确显示中文和日文字符，需要下载支持 CJK 字符的字体文件。

## 快速设置

### 方式一：下载 Noto Sans SC（推荐）

1. 访问 [Google Fonts Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC)
2. 点击 "Download family" 下载字体包
3. 解压后找到 `NotoSansSC-Regular.ttf`
4. 将文件复制到此目录 (`public/fonts/`)

### 方式二：使用系统字体（Windows）

Windows 系统自带的中文字体位于 `C:\Windows\Fonts\` 目录：

- `simhei.ttf` - 黑体
- `simsun.ttc` - 宋体

复制到 `public/fonts/` 目录即可。

> 注意：`.ttc` 格式不支持，请使用 `.ttf` 格式

### 方式三：从 CDN 下载

```bash
# 使用 curl 下载（需要科学上网）
curl -L -o public/fonts/NotoSansSC-Regular.ttf "https://github.com/googlefonts/noto-cjk/releases/download/Sans2.004/05_NotoSansSC.zip"

# 或者手动从以下地址下载：
# https://github.com/googlefonts/noto-cjk/releases
```

## 支持的字体文件

| 文件名                        | 说明                 |
| ----------------------------- | -------------------- |
| `NotoSansSC-Regular.ttf`      | 思源黑体简体（推荐） |
| `simhei.ttf`                  | 黑体                 |
| `SourceHanSansSC-Regular.ttf` | 思源黑体             |

## 验证

放置字体文件后：

1. 重启开发服务器 (`pnpm dev`)
2. 打开用户或角色列表页面
3. 点击 "导出 PDF" 按钮
4. 检查 PDF 中中文是否正确显示

## 常见问题

### PDF 显示乱码或方块

原因：未找到支持中文的字体文件

解决：确保 `public/fonts/` 目录下有 `.ttf` 格式的中文字体

### 字体加载失败

原因：字体文件损坏或格式不支持

解决：

1. 确认文件是 `.ttf` 格式（不是 `.ttc`）
2. 重新下载字体文件
3. 尝试使用其他字体

## 许可说明

- **Noto Sans SC**: SIL Open Font License 1.1（免费商用）
- **思源黑体**: SIL Open Font License 1.1（免费商用）
- **微软雅黑/黑体**: Windows 系统字体，商用需获得授权
