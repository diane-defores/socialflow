<template>
  <div class="backup-section">
    <div class="backup-row">
      <div class="backup-label">
        <i class="pi pi-download mr-2"></i>
        <span>Exporter mes donnees</span>
      </div>
      <button class="backup-btn" :disabled="busy" @click="startExport">
        <i class="pi pi-lock" />
        Exporter
      </button>
    </div>

    <div class="backup-row">
      <div class="backup-label">
        <i class="pi pi-upload mr-2"></i>
        <span>Restaurer une sauvegarde</span>
      </div>
      <button class="backup-btn" :disabled="busy" @click="startImport">
        <i class="pi pi-lock-open" />
        Importer
      </button>
    </div>

    <!-- Password dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="dialogVisible" class="backup-dialog-overlay" @click.self="cancel">
          <div class="backup-dialog">
            <h3>{{ dialogTitle }}</h3>
            <p class="dialog-hint">{{ dialogHint }}</p>

            <div class="dialog-field">
              <label>Mot de passe</label>
              <input
                ref="passwordInput"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Minimum 8 caracteres"
                autocomplete="off"
                @keyup.enter="confirm"
              />
              <button class="toggle-password" @click="showPassword = !showPassword">
                <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" />
              </button>
            </div>

            <div v-if="mode === 'export'" class="dialog-field">
              <label>Confirmer le mot de passe</label>
              <input
                v-model="passwordConfirm"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Retapez le mot de passe"
                autocomplete="off"
                @keyup.enter="confirm"
              />
            </div>

            <p v-if="error" class="dialog-error">{{ error }}</p>
            <p v-if="success" class="dialog-success">{{ success }}</p>

            <div class="dialog-actions">
              <button class="dialog-btn cancel" @click="cancel" :disabled="busy">Annuler</button>
              <button class="dialog-btn primary" @click="confirm" :disabled="busy || !canConfirm">
                <i v-if="busy" class="pi pi-spin pi-spinner" />
                {{ busy ? 'En cours...' : (mode === 'export' ? 'Exporter' : 'Importer') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useBackup } from '../composables/useBackup'

const { exportBackup, importBackup } = useBackup()

const dialogVisible = ref(false)
const mode = ref<'export' | 'import'>('export')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const busy = ref(false)
const error = ref('')
const success = ref('')
const passwordInput = ref<HTMLInputElement | null>(null)

const dialogTitle = computed(() =>
  mode.value === 'export' ? 'Exporter mes donnees' : 'Restaurer une sauvegarde',
)
const dialogHint = computed(() =>
  mode.value === 'export'
    ? 'Choisissez un mot de passe pour chiffrer vos cookies et profils.'
    : 'Entrez le mot de passe utilise lors de l\'export.',
)
const canConfirm = computed(() => {
  if (password.value.length < 8) return false
  if (mode.value === 'export' && password.value !== passwordConfirm.value) return false
  return true
})

function resetDialog() {
  password.value = ''
  passwordConfirm.value = ''
  showPassword.value = false
  error.value = ''
  success.value = ''
  busy.value = false
}

function startExport() {
  mode.value = 'export'
  resetDialog()
  dialogVisible.value = true
  nextTick(() => passwordInput.value?.focus())
}

function startImport() {
  mode.value = 'import'
  resetDialog()
  dialogVisible.value = true
  nextTick(() => passwordInput.value?.focus())
}

function cancel() {
  if (busy.value) return
  dialogVisible.value = false
}

async function confirm() {
  if (!canConfirm.value || busy.value) return
  error.value = ''
  success.value = ''
  busy.value = true

  try {
    if (mode.value === 'export') {
      const path = await exportBackup(password.value)
      success.value = `Sauvegarde exportee: ${path}`
    } else {
      await importBackup(password.value)
      success.value = 'Restauration terminee! Rechargement...'
      setTimeout(() => window.location.reload(), 1500)
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.backup-section {
  width: 100%;
}

.backup-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.backup-label {
  display: flex;
  align-items: center;
  font-weight: 500;
  gap: 0.5rem;
}

.backup-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border, #ddd);
  background: var(--surface-card, #fff);
  color: var(--text-color, #333);
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.backup-btn:hover:not(:disabled) {
  background: var(--surface-hover, #f5f5f5);
}

.backup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dialog overlay */
.backup-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.backup-dialog {
  background: var(--surface-card, #fff);
  color: var(--text-color, #333);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.backup-dialog h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.dialog-hint {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  opacity: 0.7;
}

.dialog-field {
  position: relative;
  margin-bottom: 0.75rem;
}

.dialog-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  opacity: 0.8;
}

.dialog-field input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border, #ddd);
  background: var(--surface-ground, #f8f8f8);
  color: var(--text-color, #333);
  font-size: 0.9rem;
  box-sizing: border-box;
}

.toggle-password {
  position: absolute;
  right: 0.5rem;
  bottom: 0.45rem;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.5;
  color: var(--text-color, #333);
}

.dialog-error {
  color: #e74c3c;
  font-size: 0.85rem;
  margin: 0.5rem 0;
}

.dialog-success {
  color: #27ae60;
  font-size: 0.85rem;
  margin: 0.5rem 0;
}

.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.dialog-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: opacity 0.2s;
}

.dialog-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-btn.cancel {
  background: var(--surface-ground, #eee);
  color: var(--text-color, #333);
}

.dialog-btn.primary {
  background: #3b82f6;
  color: #fff;
}

.dialog-btn.primary:hover:not(:disabled) {
  background: #2563eb;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:global(.dark) .backup-dialog {
  background: #1e1e2e;
  color: #cdd6f4;
}

:global(.dark) .dialog-field input {
  background: #313244;
  border-color: #45475a;
  color: #cdd6f4;
}
</style>
