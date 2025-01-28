import type { Profile } from "@holochain-open-dev/profiles/dist/types.d.ts";
import { type PeerStatusUpdate } from "@theweave/api";
import clients from "../clients";
import {
  encodeHashToBase64,
  decodeHashFromBase64,
  type HoloHash,
} from "@holochain/client";

let peers: PeerStatusUpdate = $state({});
let participants = $state<HoloHash[]>([]);
let participantsB64 = $derived(participants.map(encodeHashToBase64));
let participantsProfiles = $state<{ [key: string]: ProfileStatus }>({});

type ProfileStatus = "unknown" | "none" | Profile;

function init() {
  const unsubPeerstatus = clients.weave.onPeerStatusUpdate((peersStatus) => {
    console.log("Gotten peers status", peersStatus);
    peers = peersStatus;
    Object.entries(peers).forEach(async ([agentString, status]) => {
      if (!participantsProfiles[agentString]) {
        participantsProfiles[agentString] = "unknown";
        const profile = await clients.profiles.getAgentProfile(
          decodeHashFromBase64(agentString)
        );
        if (profile) {
          participantsProfiles[agentString] = profile.entry;
        } else {
          participantsProfiles[agentString] = "none";
        }
      }
    });
  });

  const unsubProfilesClientSignal = clients.profiles.onSignal((s) => {
    console.log("Profiles signal", s);
    if (s.type === "EntryCreated" || s.type === "EntryUpdated") {
    }
  });

  return function clean() {
    unsubPeerstatus();
    unsubProfilesClientSignal();
  };
}

export default {
  init,
  get participants() {
    return participantsB64;
  },
  get participantsProfiles() {
    return participantsProfiles;
  },
};
