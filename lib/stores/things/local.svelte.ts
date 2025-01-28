function getValue<T>(key: string) {
  const savedValue = localStorage.getItem(key);
  if (savedValue) {
    try {
      return JSON.parse(savedValue) as T;
    } catch (e) {
      return null;
    }
  } else {
    return null;
  }
}

function localStorageSyncedState<T>(lsKey: string) {
  const savedValue = getValue<{ [key: string]: T }>(lsKey);
  let state = $state<{ [key: string]: T }>(savedValue || {});

  let saveTimeout: any = null;
  function save() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      localStorage.setItem(lsKey, JSON.stringify(state));
    }, 100);
  }

  return {
    get all() {
      return state;
    },
    set(uuid: string, val: T) {
      state[uuid] = val;
      save();
    },
    reset() {
      state = {};
      save();
    },
    get ready() {
      return true;
    },
  };
}

export default {
  state: localStorageSyncedState,
};
