type ThingContent = {
  type: string;
  uuid: string;
  value: any;
  timestamp: number;
  sync: SyncStatus;
};

type LocalStorageSync = [];
type GenericDnaSync = ["created" | "updated" | "deleted", string];
type SynSync = [];
type SyncStatus = {
  origin: "generic-dna" | "local" | "syn";
  genericDna: GenericDnaSync;
};

function createThing() {}

function getThings(thingType?: string) {}
