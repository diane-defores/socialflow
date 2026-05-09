<template>
  <div class="onboarding-backdrop">
    <div class="onboarding-card">
      <!-- Progress dots -->
      <div class="onboarding-dots">
        <span
          v-for="i in TOTAL_STEPS"
          :key="i"
          class="dot"
          :class="{ active: i === step, done: i < step }"
        />
      </div>

      <!-- Step 1: Welcome -->
      <div
        v-if="step === 1"
        class="onboarding-step"
      >
        <div class="welcome-icon">
          <img
            :src="logoUrl"
            alt="SocialFlow"
            class="welcome-logo"
          />
        </div>
        <h1 class="step-title">{{ $t('onboarding.welcome_title') }}</h1>
        <p class="step-desc">{{ $t('onboarding.welcome_desc') }}</p>
        <button
          class="btn-primary"
          @click="step = 2"
        >
          {{ $t('onboarding.start_button') }}
        </button>
      </div>

      <!-- Step 2: Profile setup -->
      <div
        v-if="step === 2"
        class="onboarding-step"
      >
        <h2 class="step-title">{{ $t('onboarding.profile_title') }}</h2>
        <p class="step-desc">{{ $t('onboarding.profile_desc') }}</p>

        <div class="profile-setup">
          <div class="emoji-picker">
            <button
              v-for="emoji in EMOJIS"
              :key="emoji"
              class="emoji-btn"
              :class="{ selected: selectedEmoji === emoji }"
              @click="selectedEmoji = emoji"
            >
              {{ emoji }}
            </button>
          </div>
          <input
            v-model="profileName"
            class="profile-input"
            :placeholder="$t('onboarding.profile_name_placeholder')"
            maxlength="30"
            @keydown.enter="step = 3"
          />
        </div>

        <div class="step-actions">
          <button
            class="btn-ghost"
            @click="step = 1"
          >
            {{ $t('onboarding.back') }}
          </button>
          <button
            class="btn-primary"
            @click="step = 3"
          >
            {{ $t('onboarding.next') }}
          </button>
        </div>
      </div>

      <!-- Step 3: Network selection -->
      <div
        v-if="step === 3"
        class="onboarding-step"
      >
        <h2 class="step-title">{{ $t('onboarding.networks_title') }}</h2>
        <p class="step-desc">{{ $t('onboarding.networks_desc') }}</p>

        <div class="network-grid">
          <button
            v-for="net in NETWORKS"
            :key="net.id"
            class="network-chip"
            :class="{ selected: selectedNetworks.has(net.id) }"
            :style="selectedNetworks.has(net.id) ? { background: net.color, borderColor: net.color } : {}"
            @click="toggleNetwork(net.id)"
          >
            <i :class="net.icon" />
            <span>{{ net.label }}</span>
          </button>
        </div>

        <div class="step-actions">
          <button
            class="btn-ghost"
            @click="step = 2"
          >
            {{ $t('onboarding.back') }}
          </button>
          <button
            class="btn-primary"
            @click="step = 4"
          >
            {{ $t('onboarding.next') }}
          </button>
        </div>
      </div>

      <!-- Step 4: Feature highlights -->
      <div
        v-if="step === 4"
        class="onboarding-step"
      >
        <h2 class="step-title">{{ $t('onboarding.features_title') }}</h2>
        <div class="features-list">
          <div class="feature-item">
            <i class="pi pi-users feature-icon" />
            <div>
              <strong>{{ $t('onboarding.feature_profiles') }}</strong>
              <p>{{ $t('onboarding.feature_profiles_desc') }}</p>
            </div>
          </div>
          <div class="feature-item">
            <i class="pi pi-th-large feature-icon" />
            <div>
              <strong>{{ $t('onboarding.feature_customize') }}</strong>
              <p>{{ $t('onboarding.feature_customize_desc') }}</p>
            </div>
          </div>
          <div class="feature-item">
            <i class="pi pi-palette feature-icon" />
            <div>
              <strong>{{ $t('onboarding.feature_focus') }}</strong>
              <p>{{ $t('onboarding.feature_focus_desc') }}</p>
            </div>
          </div>
          <div class="feature-item">
            <i class="pi pi-heart feature-icon" />
            <div>
              <strong>{{ $t('onboarding.feature_friends') }}</strong>
              <p>{{ $t('onboarding.feature_friends_desc') }}</p>
            </div>
          </div>
          <div class="feature-item">
            <i class="pi pi-lock feature-icon" />
            <div>
              <strong>{{ $t('onboarding.feature_privacy') }}</strong>
              <p>{{ $t('onboarding.feature_privacy_desc') }}</p>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button
            class="btn-ghost"
            @click="step = 3"
          >
            {{ $t('onboarding.back') }}
          </button>
          <button
            class="btn-primary"
            @click="finish"
          >
            {{ $t('onboarding.finish_button') }}
          </button>
        </div>
      </div>

      <!-- Skip link -->
      <button
        v-if="step < 4"
        class="skip-link"
        @click="finish"
      >
        {{ $t('onboarding.skip') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useProfilesStore } from '@/stores/profiles'
import { useOnboardingStore } from '@/stores/onboarding'
import { builtInSocialNetworks } from '@/config/socialNetworks'
import logoUrl from '@/assets/logo.png'

const profilesStore = useProfilesStore()
const onboardingStore = useOnboardingStore()

const TOTAL_STEPS = 4
const step = ref(1)

const EMOJIS = ['🟦', '🔵', '🟣', '🟢', '🔴', '🟡', '🟠', '⚫', '🌊', '🔥', '⚡', '🎯']
const selectedEmoji = ref('🟦')
const profileName = ref('')

const NETWORKS = computed(() =>
  builtInSocialNetworks
    .filter((network) => network.onboarding)
    .map(({ id, label, icon, color, defaultSelected }) => ({ id, label, icon, color, defaultSelected })),
)

// Default: top 5 selected
const selectedNetworks = reactive(
  new Set(
    NETWORKS.value
      .filter(network => network.defaultSelected)
      .map(network => network.id),
  ),
)

function toggleNetwork(id: string) {
  if (selectedNetworks.has(id)) {
    selectedNetworks.delete(id)
  } else {
    selectedNetworks.add(id)
  }
}

function finish() {
  // Update profile
  profilesStore.ensureDefault()
  const profile = profilesStore.activeProfile
  if (profile) {
    if (profileName.value.trim()) {
      profilesStore.rename(profile.id, profileName.value.trim())
    }
    profilesStore.setEmoji(profile.id, selectedEmoji.value)

    // Hide unselected networks
    const allIds = NETWORKS.value.map(n => n.id)
    for (const id of allIds) {
      const isHidden = !selectedNetworks.has(id)
      const currentlyHidden = profilesStore.isNetworkHidden(profile.id, id)
      if (isHidden !== currentlyHidden) {
        profilesStore.toggleNetworkHidden(profile.id, id)
      }
    }
  }

  onboardingStore.complete()
}
</script>

<style scoped>
.onboarding-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  padding: 1rem;
}

.onboarding-card {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.onboarding-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--surface-border);
  transition: background 0.2s, transform 0.2s;
}

.dot.active {
  background: var(--primary-color);
  transform: scale(1.3);
}

.dot.done {
  background: var(--primary-color);
  opacity: 0.5;
}

.onboarding-step {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.welcome-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.welcome-logo {
  width: 56px;
  height: 56px;
  border-radius: 12px;
}

.step-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
  text-align: center;
}

.step-desc {
  font-size: 0.95rem;
  color: var(--text-color-secondary);
  text-align: center;
  margin: 0;
  line-height: 1.5;
  max-width: 360px;
}

/* Profile setup */
.profile-setup {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  max-width: 320px;
}

.emoji-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 2px solid var(--surface-border);
  background: var(--surface-card);
  font-size: 1.3rem;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn.selected {
  border-color: var(--primary-color);
  transform: scale(1.1);
}

.profile-input {
  width: 100%;
  max-width: 300px;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1.5px solid var(--surface-border);
  background: var(--surface-card);
  color: var(--text-color);
  font-size: 1rem;
  text-align: center;
  outline: none;
  transition: border-color 0.15s;
}

.profile-input:focus {
  border-color: var(--primary-color);
}

/* Network grid */
.network-grid {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  max-height: 45vh;
  overflow-y: auto;
  padding: 0.25rem;
}

.network-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  border-radius: 20px;
  border: 1.5px solid var(--surface-border);
  background: var(--surface-card);
  color: var(--text-color);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}

.network-chip.selected {
  color: #fff;
  border-color: transparent;
}

.network-chip i {
  font-size: 1rem;
}

/* Features */
.features-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.75rem;
  border-radius: 12px;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}

.feature-icon {
  font-size: 1.2rem;
  color: var(--primary-color);
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.feature-item strong {
  font-size: 0.9rem;
  color: var(--text-color);
}

.feature-item p {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

/* Actions */
.step-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  max-width: 320px;
  margin-top: 0.5rem;
}

.btn-primary {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  border: none;
  background: var(--primary-color);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:active {
  opacity: 0.85;
}

.btn-ghost {
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 1.5px solid var(--surface-border);
  background: transparent;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-ghost:active {
  background: var(--surface-hover);
}

.skip-link {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.5rem;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.skip-link:hover {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-step { animation: none; }
  .dot { transition: none; }
}
</style>
