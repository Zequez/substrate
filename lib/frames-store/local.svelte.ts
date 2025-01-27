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

  // // Try to load the initial value from localStorage
  // load(key);
  // if (!state[key]) {
  //   state[key] = ;
  //   save(key);
  // }

  // If there's a saved value, parse it, otherwise use the default value
  // const initialValue: T = savedValue ? JSON.parse(savedValue) : defaultValue;

  // let state = $state(initialValue);

  // $effect(() => {
  //   console.log(`LOCALSTORAGE ${key} UPDATING`, $inspect(state));
  //   // Save the store value to localStorage whenever it changes
  //   localStorage.setItem(key, JSON.stringify(state));
  // });

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
    ready: true,
  };
}

export default {
  state: localStorageSyncedState,
};
