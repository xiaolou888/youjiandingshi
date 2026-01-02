<template>
  <div class="email-editor">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button-group>
        <el-button size="small" @click="insertTemplate('basic')">基础模板</el-button>
        <el-button size="small" @click="insertTemplate('notification')">通知模板</el-button>
        <el-button size="small" @click="insertTemplate('reminder')">提醒模板</el-button>
        <el-button size="small" @click="insertTemplate('report')">报表模板</el-button>
      </el-button-group>
      
      <el-button-group style="margin-left: 12px;">
        <el-button size="small" :type="mode === 'visual' ? 'primary' : ''" @click="mode = 'visual'">
          <el-icon><View /></el-icon> 可视化
        </el-button>
        <el-button size="small" :type="mode === 'html' ? 'primary' : ''" @click="mode = 'html'">
          <el-icon><Document /></el-icon> HTML
        </el-button>
        <el-button size="small" @click="openPreviewDialog">
          <el-icon><Monitor /></el-icon> 预览
        </el-button>
      </el-button-group>
    </div>

    <!-- 编辑区域 -->
    <div class="editor-content">
      <!-- 可视化编辑模式 -->
      <div v-show="mode === 'visual'" class="visual-editor">
        <div 
          ref="editableDiv"
          class="editable-area"
          contenteditable="true"
          @input="onVisualInput"
          @blur="onVisualBlur"
        ></div>
      </div>

      <!-- HTML 代码编辑模式 -->
      <div v-show="mode === 'html'" class="html-editor">
        <el-input
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)"
          type="textarea"
          :rows="20"
          placeholder="请输入HTML代码"
        />
      </div>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="邮件预览"
      width="800px"
      :close-on-click-modal="false"
      class="email-preview-dialog"
    >
      <div class="preview-wrapper">
        <div class="preview-device-frame">
          <div class="preview-device-header">
            <div class="preview-device-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="preview-device-title">📧 邮件客户端预览</div>
          </div>
          <div class="preview-device-body">
            <div class="preview-content" v-html="modelValue"></div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="openInNewTab">
          <el-icon><TopRight /></el-icon> 在新标签页打开
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { View, Document, Monitor, TopRight } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const mode = ref('visual') // visual | html
const editableDiv = ref(null)
const previewDialogVisible = ref(false)

// 保存光标位置
const saveCursorPosition = () => {
  const selection = window.getSelection()
  if (!selection.rangeCount) return null
  
  const range = selection.getRangeAt(0)
  const preSelectionRange = range.cloneRange()
  preSelectionRange.selectNodeContents(editableDiv.value)
  preSelectionRange.setEnd(range.startContainer, range.startOffset)
  
  return preSelectionRange.toString().length
}

// 恢复光标位置
const restoreCursorPosition = (position) => {
  if (position === null || !editableDiv.value) return
  
  const selection = window.getSelection()
  const range = document.createRange()
  
  let currentPos = 0
  let found = false
  
  const findPosition = (node) => {
    if (found) return
    
    if (node.nodeType === Node.TEXT_NODE) {
      const nodeLength = node.textContent.length
      if (currentPos + nodeLength >= position) {
        range.setStart(node, position - currentPos)
        range.collapse(true)
        found = true
        return
      }
      currentPos += nodeLength
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        findPosition(node.childNodes[i])
        if (found) return
      }
    }
  }
  
  findPosition(editableDiv.value)
  
  if (found) {
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

// 可视化编辑器输入事件
const onVisualInput = (e) => {
  // 直接发送更新，不需要恢复光标（因为没有 v-html 重新渲染）
  emit('update:modelValue', e.target.innerHTML)
}

// 失去焦点时同步内容
const onVisualBlur = (e) => {
  emit('update:modelValue', e.target.innerHTML)
}

// 监听模式切换，同步内容
watch(mode, (newMode, oldMode) => {
  if (newMode === 'visual' && editableDiv.value) {
    // 从其他模式切换到可视化模式时，更新内容
    if (oldMode !== 'visual') {
      editableDiv.value.innerHTML = props.modelValue
    }
  }
})

// 监听 modelValue 变化（仅在非可视化模式或初始化时更新）
watch(() => props.modelValue, (newValue) => {
  if (mode.value === 'visual' && editableDiv.value) {
    // 只有当内容真的不同时才更新（避免循环更新）
    if (editableDiv.value.innerHTML !== newValue) {
      const cursorPos = saveCursorPosition()
      editableDiv.value.innerHTML = newValue
      restoreCursorPosition(cursorPos)
    }
  }
})

// 初始化内容
onMounted(() => {
  if (editableDiv.value && props.modelValue) {
    editableDiv.value.innerHTML = props.modelValue
  }
})

// 邮件模板
const templates = {
  basic: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">标题</h2>
    <p style="color: #666; line-height: 1.6;">这是邮件正文内容，您可以在这里编写您的消息。</p>
    <div style="margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af;">💡 这是一个提示框，可以用来突出重要信息。</p>
    </div>
    <p style="color: #666; line-height: 1.6;">如有任何问题，请随时联系我们。</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">此邮件由系统自动发送，请勿直接回复</p>
  </div>
</div>`,

  notification: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- 头部 -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📢 系统通知</h1>
    </div>
    
    <!-- 内容 -->
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px; line-height: 1.8;">尊敬的用户，您好！</p>
      <p style="color: #666; line-height: 1.8;">这是一条重要的系统通知消息。</p>
      
      <div style="background-color: #fef3c7; border-radius: 6px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #92400e; margin-top: 0;">⚠️ 重要提醒</h3>
        <p style="color: #78350f; margin-bottom: 0;">请及时处理相关事项，避免影响正常使用。</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">立即查看</a>
      </div>
      
      <p style="color: #999; font-size: 14px;">如有疑问，请联系管理员。</p>
    </div>
    
    <!-- 底部 -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px; margin: 0;">© 2026 消息通知系统 | 此邮件由系统自动发送</p>
    </div>
  </div>
</div>`,

  reminder: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- 头部 -->
    <div style="background-color: #10b981; padding: 20px 30px;">
      <h2 style="color: #ffffff; margin: 0; display: flex; align-items: center;">
        <span style="font-size: 32px; margin-right: 10px;">⏰</span>
        <span>温馨提醒</span>
      </h2>
    </div>
    
    <!-- 内容 -->
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px; line-height: 1.8;">您好，</p>
      <p style="color: #666; line-height: 1.8;">这是一条定期提醒消息，以下事项需要您关注：</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f9fafb;">
          <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">提醒事项</td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">服务器续费</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">到期时间</td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">2026-02-01</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; color: #374151;">剩余天数</td>
          <td style="padding: 12px; border: 1px solid #e5e7eb; color: #ef4444; font-weight: bold;">30 天</td>
        </tr>
      </table>
      
      <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; color: #1e40af;">💡 建议您提前做好准备，避免服务中断。</p>
      </div>
      
      <p style="color: #666; line-height: 1.8;">感谢您的关注！</p>
    </div>
    
    <!-- 底部 -->
    <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px; margin: 0;">此邮件为自动发送，请勿直接回复</p>
    </div>
  </div>
</div>`,

  report: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- 头部 -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 数据报表</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">2026年1月 月度报告</p>
    </div>
    
    <!-- 内容 -->
    <div style="padding: 30px;">
      <p style="color: #333; font-size: 16px; line-height: 1.8;">尊敬的管理员，</p>
      <p style="color: #666; line-height: 1.8;">以下是本月的数据统计报表：</p>
      
      <!-- 数据卡片 -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 6px; text-align: center;">
          <div style="color: #1e40af; font-size: 32px; font-weight: bold;">1,234</div>
          <div style="color: #3b82f6; margin-top: 5px;">总发送量</div>
        </div>
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 6px; text-align: center;">
          <div style="color: #065f46; font-size: 32px; font-weight: bold;">98.5%</div>
          <div style="color: #10b981; margin-top: 5px;">成功率</div>
        </div>
      </div>
      
      <!-- 详细数据 -->
      <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">详细统计</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151;">项目</th>
            <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; color: #374151;">数值</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">成功发送</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; color: #10b981; font-weight: bold;">1,216</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">发送失败</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; color: #ef4444; font-weight: bold;">18</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">活跃通知</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; color: #3b82f6; font-weight: bold;">25</td>
          </tr>
        </tbody>
      </table>
      
      <p style="color: #666; line-height: 1.8; margin-top: 20px;">感谢您使用我们的服务！</p>
    </div>
    
    <!-- 底部 -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px; margin: 0;">© 2026 消息通知系统 | 报表自动生成于 ${new Date().toLocaleString('zh-CN')}</p>
    </div>
  </div>
</div>`
}

// 插入模板
const insertTemplate = (templateName) => {
  const template = templates[templateName]
  if (template) {
    emit('update:modelValue', template.trim())
    if (mode.value === 'visual' && editableDiv.value) {
      editableDiv.value.innerHTML = template.trim()
    }
  }
}

// 打开预览弹窗
const openPreviewDialog = () => {
  previewDialogVisible.value = true
}

// 在新标签页打开预览
const openInNewTab = () => {
  const previewWindow = window.open('', '_blank')
  if (previewWindow) {
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>邮件预览</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            font-family: Arial, sans-serif;
          }
          .email-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
          }
          .email-body {
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h2 style="margin: 0;">📧 邮件预览</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">以下是邮件的实际显示效果</p>
          </div>
          <div class="email-body">
            ${props.modelValue}
          </div>
        </div>
      </body>
      </html>
    `)
    previewWindow.document.close()
  }
}
</script>

<style scoped>
.email-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.toolbar {
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.editor-content {
  min-height: 400px;
  background-color: #ffffff;
}

.visual-editor {
  height: 100%;
}

.editable-area {
  min-height: 400px;
  padding: 20px;
  outline: none;
  overflow-y: auto;
  max-height: 600px;
  background-color: #ffffff;
  color: #333333;
}

.editable-area:focus {
  background-color: #fafafa;
}

.html-editor {
  padding: 10px;
}

.preview-area {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.preview-content {
  background-color: #ffffff;
  min-height: 360px;
}

/* 深色模式适配 */
html.dark .email-editor {
  border-color: #414243;
}

html.dark .toolbar {
  background-color: #1d1e1f;
  border-bottom-color: #414243;
}

html.dark .editor-content {
  background-color: #141414;
}

html.dark .editable-area {
  background-color: #1d1e1f;
  color: #e5e7eb;
}

html.dark .editable-area:focus {
  background-color: #262727;
}

/* 预览弹窗样式 */
.email-preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  background-color: #f5f5f5;
}

.preview-wrapper {
  padding: 20px;
  min-height: 500px;
  max-height: 70vh;
  overflow-y: auto;
}

.preview-device-frame {
  max-width: 700px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.preview-device-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-device-dots {
  display: flex;
  gap: 6px;
}

.preview-device-dots .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.preview-device-dots .dot.red {
  background-color: #ff5f56;
}

.preview-device-dots .dot.yellow {
  background-color: #ffbd2e;
}

.preview-device-dots .dot.green {
  background-color: #27c93f;
}

.preview-device-title {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.preview-device-body {
  background-color: #ffffff;
  padding: 20px;
  min-height: 400px;
}

.preview-content {
  background-color: #ffffff;
  min-height: 360px;
}

/* 深色模式 - 预览弹窗 */
html.dark .email-preview-dialog :deep(.el-dialog__body) {
  background-color: #1d1e1f;
}

html.dark .preview-wrapper {
  background-color: #1d1e1f;
}

html.dark .preview-device-frame {
  background-color: #262727;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

html.dark .preview-device-body {
  background-color: #262727;
}

html.dark .preview-content {
  background-color: #262727;
}
</style>

