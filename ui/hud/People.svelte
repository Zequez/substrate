<script lang="ts">
  import cx from "classnames";
  import profiles from "@center/profiles.svelte";
  import clients from "@center/clients";
  import { tooltip } from "@center/snippets/tooltip";

  const sortedProfiles = $derived.by(() => {
    return Object.entries(profiles.participantsProfiles).sort((a, b) => {
      if (a[0] === clients.agentKeyB64) {
        return 1;
      } else {
        return -1;
      }
    });
  });
</script>

<div class="absolute bottom-2 left-2 z-hud flexcc space-x-2">
  {#each sortedProfiles as [agent, profile]}
    {@const isSelf = agent === clients.agentKeyB64}
    {#if profile === "unknown" || profile === "none" || !profile.fields.avatar}
      {@const nickname =
        profile && profile !== "unknown" && profile !== "none"
          ? profile.nickname
          : agent.slice(0, 5)}
      <div
        class={cx(
          "h-8 w-8 rounded-full overflow-hidden shadow-md p.5 flexcc bg-white b b-black/10",
          {
            "outline-solid outline-3 outline-blue-500/80": isSelf,
          }
        )}
        use:tooltip={`${nickname}${isSelf ? " (you)" : ""}`}
      >
        {nickname}
      </div>
    {:else}
      <img
        use:tooltip={`${profile.nickname}${isSelf ? " (you)" : ""}`}
        alt={profile.nickname}
        class={cx("h-8 w-8 rounded-full bg-white p.5 shadow-md b b-black/10", {
          "outline-solid outline-3 outline-blue-500/80": isSelf,
        })}
        src={profile.fields.avatar}
      />
    {/if}
  {/each}
</div>
