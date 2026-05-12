import { ref, watch, nextTick } from "vue"

type JsonValue = string | number | boolean | null | undefined | JsonObject | JsonArray
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]

function mergeDeep(defaults: JsonObject, source: JsonObject): JsonObject {
	// Merge the default options with the stored options
	const output: JsonObject = { ...defaults } // Start with defaults

	Object.keys(defaults).forEach((key) => {
		const defaultValue = defaults[key]
		const sourceValue = source?.[key]

		if (isObject(defaultValue) && sourceValue != null) {
			// Recursively merge nested objects
			output[key] = mergeDeep(defaultValue, sourceValue)
		} else if (checkType(defaultValue, sourceValue)) {
			output[key] = sourceValue
		} else {
			// If the type is different, use the default value
			output[key] = defaultValue
			console.warn("Type mismatch", key, sourceValue)
		}
	})

	return output
}

function checkType(defaultValue: JsonValue, value: unknown): value is JsonValue {
	// Check if the value type is the same type as the default value or null
	// there are only strings, booleans, nulls and arrays as types left
	return (
		(value === null && defaultValue === null) ||
		(value !== null &&
			typeof value === typeof defaultValue &&
			Array.isArray(value) === Array.isArray(defaultValue))
	)
}
function isObject(value: JsonValue): value is JsonObject {
	return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function useBrowserSyncStorage<T>(key: string, defaultValue: T) {
	return useBrowserStorage(key, defaultValue, "sync")
}

export function useBrowserLocalStorage<T>(key: string, defaultValue: T) {
	return useBrowserStorage(key, defaultValue, "local")
}

function useBrowserStorage<T>(key: string, defaultValue: T, storageType: "sync" | "local" = "sync") {
	const data = ref<T>(defaultValue)
	// Blocking setting storage if it is updating from storage
	let isUpdatingFromStorage = true
	const defaultIsObject = isObject(defaultValue)
	// Initialize storage with the value from chrome.storage
	const promise = new Promise((resolve) => {
		chrome.storage[storageType].get(key, async (result: Record<string, unknown>) => {
			const storedValue = result?.[key]
			if (storedValue !== undefined) {
				if (defaultIsObject && isObject(storedValue as JsonValue)) {
					data.value = mergeDeep(defaultValue as JsonObject, storedValue as JsonObject) as T
				} else if (checkType(defaultValue as JsonValue, storedValue)) {
					data.value = storedValue as T
				}
			}
			await nextTick()
			isUpdatingFromStorage = false
			resolve(true)
		})
	})

	// Watch for changes in the storage and update chrome.storage
	watch(
		data,
		(newValue) => {
			if (!isUpdatingFromStorage) {
				if (checkType(defaultValue, newValue)) {
					chrome.storage[storageType].set({ [key]: toRaw(newValue) })
				} else {
					console.error("not updating " + key + ": type mismatch")
				}
			}
		},
		{ deep: true, flush: "post" },
	)
	// Add the onChanged listener here
	chrome.storage[storageType].onChanged.addListener(async function (changes) {
		if (changes?.[key]) {
			isUpdatingFromStorage = true
			const { oldValue, newValue } = changes[key]
			data.value = newValue
			await nextTick()
			isUpdatingFromStorage = false
		}
	})
	return { data, promise }
}
