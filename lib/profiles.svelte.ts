import type { ProfilesClient } from "@holochain-open-dev/profiles/dist/profiles-client.d.ts";
import type { Profile } from "@holochain-open-dev/profiles/dist/types.d.ts";
import { type PeerStatusUpdate, type WeaveClient } from "@theweave/api";
import {
  encodeHashToBase64,
  decodeHashFromBase64,
  type HoloHash,
} from "@holochain/client";

let peers: PeerStatusUpdate = $state({});
let participants = $state<HoloHash[]>([]);
let participantsB64 = $derived(participants.map(encodeHashToBase64));
let profilesClient = $state<ProfilesClient>(null!);
let participantsProfiles = $state<{ [key: string]: ProfileStatus }>({});
let W = $state<WeaveClient>(null!);

type ProfileStatus = "unknown" | "none" | Profile;

function init(weaveClient: WeaveClient) {
  W = weaveClient;
  if (weaveClient.renderInfo.type !== "applet-view") throw "Not applet view";
  profilesClient = weaveClient.renderInfo.profilesClient;

  const unsubPeerstatus = weaveClient.onPeerStatusUpdate((peersStatus) => {
    console.log("Gotten peers status", peersStatus);
    peers = peersStatus;
    // let fetchProfilesFor: string[] = [];
    Object.entries(peers).forEach(async ([agentString, status]) => {
      if (!participantsProfiles[agentString]) {
        participantsProfiles[agentString] = "unknown";
        const profile = await profilesClient.getAgentProfile(
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

  const unsubProfilesClientSignal = profilesClient.onSignal((s) => {
    console.log("Profiles signal", s);
    if (s.type === "EntryCreated" || s.type === "EntryUpdated") {
    }
  });

  // $effect(() => {

  // })

  // let timeoutId: any;
  // async function poll() {
  //   console.log("Fetching participants");
  //   participants = await weaveClient.appletParticipants();
  //   participants.forEach((participant) => {
  //     const stringHash = encodeHashToBase64(participant);
  //     if (!participantsProfiles[stringHash]) {
  //       participantsProfiles[stringHash] = "unknown";
  //     }
  //   });
  //   await fetchProfilesForParticipants();
  //   timeoutId = setTimeout(async () => {
  //     poll();
  //   }, 10000);
  // }
  // poll();

  // const unsub = profilesClient.onSignal((s) => {
  //   console.log('Profiles signal');
  //   if (s.type === 'EntryCreated' || s.type === 'EntryUpdated') {

  //   }
  // })

  return function clean() {
    // if (timeoutId) clearTimeout(timeoutId);
    unsubPeerstatus();
    unsubProfilesClientSignal();
  };
}

// async function fetchProfilesForParticipants() {
//   // console.log("Fetching profiles for partcipants");
//   const agents = await profilesClient.getAgentsWithProfile();
//   const agentsB64 = agents.map(encodeHashToBase64);
//   // console.log("Agents with profiles", agents);
//   const profiles = await Promise.all(
//     agents.map((agentHash) => {
//       return profilesClient.getAgentProfile(agentHash);
//     })
//   );
//   // console.log("Profiles", profiles);
//   const restAgents = participantsB64.filter((p) => agentsB64.indexOf(p) === -1);
//   // console.log("Rest agents", restAgents);
//   agentsB64.forEach((agentString, i) => {
//     // console.log("Assigning profile", profiles[i]);
//     if (profiles[i]) {
//       participantsProfiles[agentString] = profiles[i].entry;
//     } else {
//       participantsProfiles[agentString] = "none";
//     }
//   });
//   restAgents.forEach((agentString) => {
//     participantsProfiles[agentString] = "none";
//   });
//   profilesClient.getAgentProfile(participants[0]);
//   // console.log("Participants profiles", JSON.stringify(participantsProfiles));
// }

export default {
  init,
  get participants() {
    return participantsB64;
  },
  get participantsProfiles() {
    return participantsProfiles;
  },
};
