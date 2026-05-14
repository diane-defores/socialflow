<template>
  <div
    class="create-post"
    :class="networkClass"
  >
    <div class="post-composer">
      <SocialAvatar 
        :user="currentUser"
        size="normal"
      />
      <div class="composer-input">
        <Button 
          class="start-post"
          text
          @click="showDialog = true"
        >
          <span>{{ resolvedPlaceholder }}</span>
        </Button>
        <div class="post-types">
          <slot name="post-types">
            <Button
              v-for="type in postTypes"
              :key="type.id"
              :icon="type.icon"
              :label="type.label"
              text
              class="flex-1"
              @click="handleTypeClick(type)"
            />
          </slot>
        </div>
      </div>
    </div>

    <Dialog 
      v-model:visible="showDialog" 
      :header="resolvedDialogTitle"
      :modal="true"
      class="post-dialog"
      :style="{ width: '500px' }"
    >
      <div class="dialog-content">
        <div class="dialog-header">
          <SocialAvatar 
            :user="currentUser"
            size="normal"
          />
          <div class="post-settings">
            <h4>{{ currentUser.name }}</h4>
            <Dropdown
              v-model="privacy"
              :options="privacyOptions"
              option-label="label"
              :placeholder="$t('post.privacy_placeholder')"
              class="privacy-dropdown"
            >
              <template #value="{ value }">
                <i :class="value?.icon" /> {{ value?.label }}
              </template>
              <template #option="{ option }">
                <i :class="option.icon" /> {{ option.label }}
              </template>
            </Dropdown>
          </div>
        </div>
        
        <div class="post-editor">
          <InputTextarea
            v-model="postContent"
            :placeholder="resolvedEditorPlaceholder"
            :auto-resize="true"
            rows="5"
            class="w-full"
          />

          <div
            v-if="selectedFiles.length"
            class="selected-files"
          >
            <div
              v-for="(file, index) in selectedFiles" 
              :key="index" 
              class="file-preview"
            >
              <img
                v-if="file.type.startsWith('image/')" 
                :src="file.preview" 
                :alt="file.file.name"
              />
              <video
                v-else-if="file.type.startsWith('video/')"
                controls
              >
                <source
                  :src="file.preview"
                  :type="file.type"
                >
              </video>
              <div class="file-overlay">
                <Button 
                  icon="pi pi-times" 
                  severity="danger"
                  text
                  rounded
                  @click="removeFile(index)"
                />
              </div>
            </div>
          </div>

          <div class="add-to-post">
            <h5>{{ $t('post.add_to_post_title') }}</h5>
            <div class="post-tools">
              <FileUpload
                mode="basic"
                :multiple="true"
                accept="image/*,video/*"
                :max-file-size="10000000"
                :auto="true"
                choose-label=""
                class="hidden-upload"
                @select="onFileSelect"
              />
              <Button
                v-for="tool in postTools"
                :key="tool.id"
                :icon="tool.icon"
                :severity="tool.severity"
                text
                rounded
                @click="handleToolClick(tool)"
              />
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <Button 
            :label="resolvedSubmitLabel"
            :disabled="!canSubmit"
            :class="submitButtonClass"
            @click="submitPost"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import FileUpload from 'primevue/fileupload'
import SocialAvatar from './SocialAvatar.vue'

const { t } = useI18n()

interface Props {
  currentUser: {
    name: string
    avatar: string
  }
  network?: 'facebook' | 'twitter' | 'linkedin' | 'instagram'
  placeholder?: string
  editorPlaceholder?: string
  dialogTitle?: string
  submitLabel?: string
  maxFiles?: number
}

const props = withDefaults(defineProps<Props>(), {
  network: 'facebook',
  placeholder: undefined,
  editorPlaceholder: undefined,
  dialogTitle: undefined,
  submitLabel: undefined,
  maxFiles: 4
})

const resolvedPlaceholder = computed(() => props.placeholder ?? t('post.composer_placeholder'))
const resolvedEditorPlaceholder = computed(() => props.editorPlaceholder ?? t('post.editor_placeholder'))
const resolvedDialogTitle = computed(() => props.dialogTitle ?? t('post.dialog_title'))
const resolvedSubmitLabel = computed(() => props.submitLabel ?? t('common.publish'))

const emit = defineEmits<{
  'submit': [{
    content: string,
    privacy: string,
    files: File[]
  }]
}>()

const showDialog = ref(false)
const postContent = ref('')
const selectedFiles = ref<Array<{ file: File, preview: string, type: string }>>([])
const privacy = ref({
  value: 'public',
  label: 'Public',
  icon: 'pi pi-globe'
})

const networkClass = computed(() => `network-${props.network}`)

const submitButtonClass = computed(() => ({
  'w-full': true,
  [`p-button-${props.network}`]: true
}))

const canSubmit = computed(() => {
  return postContent.value.trim().length > 0 || selectedFiles.value.length > 0
})

const postTypes = computed(() => [
  { id: 'photo', icon: 'pi pi-image', label: t('post.photo_video_type') },
  { id: 'feeling', icon: 'pi pi-smile', label: 'Humeur/Activité' },
  { id: 'event', icon: 'pi pi-calendar', label: t('common.event') }
])

const postTools = [
  { id: 'media', icon: 'pi pi-image', severity: 'success' },
  { id: 'tag', icon: 'pi pi-user', severity: 'info' },
  { id: 'feeling', icon: 'pi pi-smile', severity: 'warning' },
  { id: 'location', icon: 'pi pi-map-marker', severity: 'help' },
  { id: 'poll', icon: 'pi pi-chart-bar', severity: 'danger' }
]

const privacyOptions = computed(() => [
  { value: 'public', label: 'Public', icon: 'pi pi-globe' },
  { value: 'friends', label: t('common.friends'), icon: 'pi pi-users' },
  { value: 'private', label: 'Moi uniquement', icon: 'pi pi-lock' }
])

const handleTypeClick = (type: typeof postTypes.value[0]) => {
  showDialog.value = true
  if (type.id === 'photo') {
    const input = document.querySelector('.hidden-upload input[type="file"]') as HTMLInputElement | null
    input?.click()
  }
}

const handleToolClick = (tool: typeof postTools[0]) => {
  if (tool.id === 'media') {
    const input = document.querySelector('.hidden-upload input[type="file"]') as HTMLInputElement | null
    input?.click()
  }
  // Implémenter les autres actions d'outils
}

interface FileUploadSelectEvent {
  files: File[]
}

const onFileSelect = (event: FileUploadSelectEvent) => {
  const files = event.files
  
  for (let file of files) {
    if (selectedFiles.value.length >= props.maxFiles) break

    const reader = new FileReader()
    reader.onload = (e) => {
      selectedFiles.value.push({
        file,
        preview: e.target?.result as string,
        type: file.type
      })
    }
    reader.readAsDataURL(file)
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const submitPost = () => {
  emit('submit', {
    content: postContent.value,
    privacy: privacy.value.value,
    files: selectedFiles.value.map(f => f.file)
  })
  
  // Réinitialiser le formulaire
  postContent.value = ''
  selectedFiles.value = []
  showDialog.value = false
}
</script>

<style scoped>
.create-post {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.post-composer {
  display: flex;
  gap: 1rem;
}

.composer-input {
  flex: 1;
}

.start-post {
  width: 100%;
  justify-content: flex-start;
  margin-bottom: 0.5rem;
  background: var(--surface-ground);
  border-radius: 2rem;
  color: var(--text-color-secondary);
}

.post-types {
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
}

.dialog-content {
  padding: 1rem;
}

.dialog-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.post-settings {
  flex: 1;
}

.post-settings h4 {
  margin: 0 0 0.5rem;
}

.privacy-dropdown {
  width: 200px;
}

.post-editor {
  margin-bottom: 1rem;
}

:deep(.p-inputtextarea),
:deep(.p-textarea) {
  field-sizing: content;
}

.selected-files {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  margin: 1rem 0;
}

.file-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.file-preview img,
.file-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-overlay {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.add-to-post {
  background: var(--surface-ground);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.add-to-post h5 {
  margin: 0 0 0.5rem;
  color: var(--text-color-secondary);
}

.post-tools {
  display: flex;
  gap: 0.5rem;
}

.hidden-upload {
  display: none;
}

/* Styles spécifiques aux réseaux */
.network-facebook :deep(.p-button-facebook) {
  background: #1877f2;
}

.network-twitter :deep(.p-button-twitter) {
  background: #1da1f2;
}

.network-linkedin :deep(.p-button-linkedin) {
  background: #0077b5;
}

.network-instagram :deep(.p-button-instagram) {
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
}
</style> 
