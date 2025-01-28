let state = $state<{ [key: string]: any }>({});

function load(key: string) {
  const savedValue = localStorage.getItem(key);
  if (savedValue) {
    try {
      state[key] = JSON.parse(savedValue);
    } catch (e) {
      state[key] = null;
    }
  } else {
    state[key] = null;
  }

  return state[key];
}

function save(key: string) {
  localStorage.setItem(key, JSON.stringify(state[key]));
}

// $effect(() => {
//   console.log("Localstorage effect");
//   $inspect(state);
// });

function localStorageSyncedState<T>(key: string, defaultValue: T) {
  // Try to load the initial value from localStorage
  load(key);
  if (!state[key]) {
    state[key] = defaultValue;
    save(key);
  }

  // If there's a saved value, parse it, otherwise use the default value
  // const initialValue: T = savedValue ? JSON.parse(savedValue) : defaultValue;

  // let state = $state(initialValue);

  // $effect(() => {
  //   console.log(`LOCALSTORAGE ${key} UPDATING`, $inspect(state));
  //   // Save the store value to localStorage whenever it changes
  //   localStorage.setItem(key, JSON.stringify(state));
  // });

  return {
    get value() {
      return state[key];
    },
    set value(val: T) {
      state[key] = val;
      save(key);
    },
    reset() {
      state[key] = defaultValue;
      save(key);
    },
  };
}

export default {
  state: localStorageSyncedState,
};
