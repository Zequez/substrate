import {
  WeaveClient,
  weaveUrlToLocation,
  stringifyHrl,
  deStringifyWal,
  encodeContext,
  type WAL,
  type AssetInfo,
  type AssetLocationAndInfo,
  type AppletHash,
  stringifyWal,
} from "@theweave/api";
import {
  urlFromAppletHash,
  appletOrigin,
} from "@theweave/elements/dist/utils.js";

let W = $state<WeaveClient>(null!);

type AssetData = {
  wal: WAL;
  hash: AppletHash;
  iframeSrc: string;
  info: AssetInfo;
  key: string;
};

let assetsMap = $state<Record<string, AssetData>>({});

function init(weaveClient: WeaveClient) {
  W = weaveClient;

  // $effect(() => {
  //   console.log("Assets", JSON.stringify(assetsMap, null, 2));
  // });
  return () => {};
}

async function loadAsset(key: string) {
  const data = assetsMap[key];
  if (data) {
    return data;
  } else {
    const wal = deStringifyWal(key);
    return await cacheAsset(key, wal);
  }
}

async function pickAsset() {
  const wal = await W.assets.userSelectAsset();
  if (wal) {
    const url = stringifyWal(wal);
    return await cacheAsset(url, wal);
  } else {
    return null;
  }
}

async function cacheAsset(key: string, wal: WAL) {
  const locAndInfo = await W.assets.assetInfo(wal);
  if (locAndInfo) {
    const data: AssetData = {
      wal,
      hash: locAndInfo.appletHash,
      iframeSrc: assetInfoToIframeSrc(wal, locAndInfo),
      info: locAndInfo.assetInfo,
      key,
    };
    assetsMap[key] = data;
    return data;
  } else {
    console.log("No info gotten", key);
    return false;
  }
}

export default {
  init,
  get pickAsset() {
    return pickAsset;
  },
  get loadAsset() {
    return loadAsset;
  },
  get V() {
    return assetsMap;
  },
};

// UTILS

function assetInfoToIframeSrc(asset: WAL, assetInfo: AssetLocationAndInfo) {
  const queryString = [
    "view=applet-view",
    "view-type=asset",
    "hrl=" + stringifyHrl(asset.hrl),
    asset.context ? "context=" + encodeContext(asset.context) : "",
  ].join("&");

  const iframeSrc = assetInfo.appletDevPort
    ? `http://localhost:${
        assetInfo.appletDevPort
      }?${queryString}#${urlFromAppletHash(assetInfo.appletHash)}`
    : `${appletOrigin(assetInfo.appletHash)}?${queryString}`;

  return iframeSrc;
}
