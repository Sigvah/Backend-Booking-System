export function GuidePage() {
  return (
    <div className="guide">
      <section>
        <h2>How a battle works, in one minute</h2>
        <ul>
          <li>
            At <strong>team preview</strong> you see each other's 6 Pokemon and secretly pick the
            ones you'll bring (4 in doubles, usually 3 in singles). Items, abilities and moves stay
            hidden — that's what the Scout tab helps you guess.
          </li>
          <li>
            Each turn everyone picks a move, then moves happen in order of{" "}
            <strong>priority first, Speed second</strong>. Higher priority always goes first no
            matter how slow; within the same priority, the faster Pokemon moves first.
          </li>
          <li>
            Damage comes down to: attacker's Attack (physical) or Sp. Atk (special) vs your Defense
            or Sp. Def, times the <strong>type matchup</strong> (×4, ×2, ×1, ×½, ×¼ or ×0) and a{" "}
            <strong>1.5× boost when a Pokemon uses a move of its own type</strong> ("STAB").
          </li>
          <li>
            In doubles, moves that hit both opponents (Earthquake, Dazzling Gleam, Blizzard) do 75%
            damage per target, and <strong>Protect</strong> is everywhere — expect it, play around
            it.
          </li>
        </ul>
      </section>

      <section>
        <h2>Weather (lasts 5 turns, 8 with the matching rock)</h2>
        <table className="guide-table">
          <thead>
            <tr><th>Weather</th><th>What it does</th><th>Watch out for</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>☀ <strong>Sun</strong></td>
              <td>Fire moves ×1.5, Water moves ×0.5. Solar Beam skips its charge turn.</td>
              <td><strong>Chlorophyll</strong> doubles Speed; <strong>Protosynthesis</strong> Pokemon (Flutter Mane & friends) get stronger.</td>
            </tr>
            <tr>
              <td>🌧 <strong>Rain</strong></td>
              <td>Water moves ×1.5, Fire moves ×0.5. Thunder and Hurricane never miss.</td>
              <td><strong>Swift Swim</strong> doubles Speed — rain teams try to outrun you.</td>
            </tr>
            <tr>
              <td>🌪 <strong>Sandstorm</strong></td>
              <td>Chip damage each turn to everything that isn't Rock/Ground/Steel. Rock-types get +50% Sp. Def.</td>
              <td><strong>Sand Rush</strong> doubles Speed (Excadrill).</td>
            </tr>
            <tr>
              <td>❄ <strong>Snow</strong></td>
              <td>Ice-types get +50% Defense. Blizzard never misses.</td>
              <td><strong>Slush Rush</strong> doubles Speed.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Terrain (affects Pokemon on the ground, lasts 5 turns)</h2>
        <table className="guide-table">
          <thead>
            <tr><th>Terrain</th><th>What it does</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>⚡ <strong>Electric</strong></td>
              <td>Electric moves ×1.3. Grounded Pokemon <strong>can't fall asleep</strong> — Spore stops working. Powers up Quark Drive Pokemon.</td>
            </tr>
            <tr>
              <td>🌿 <strong>Grassy</strong></td>
              <td>Grass moves ×1.3, everyone grounded heals a bit each turn, and <strong>Earthquake does half damage</strong>.</td>
            </tr>
            <tr>
              <td>🌫 <strong>Misty</strong></td>
              <td>Grounded Pokemon <strong>can't be statused</strong> (no sleep, burn, paralysis) and Dragon moves against them are halved.</td>
            </tr>
            <tr>
              <td>🔮 <strong>Psychic</strong></td>
              <td>Psychic moves ×1.3 and <strong>priority moves fail against grounded Pokemon</strong> — another way Fake Out gets shut off.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Fake Out & priority — and what stops them</h2>
        <ul>
          <li>
            <strong>Fake Out</strong> goes first (+3 priority), deals light damage and makes the
            target <strong>flinch</strong> (lose its turn). It only works on the user's{" "}
            <em>first turn on the field</em> — that's why doubles leads love it.
          </li>
          <li>
            It <strong>fails completely</strong> against: <strong>Armor Tail / Dazzling / Queenly
            Majesty</strong> Pokemon and their allies (this is the Farigiraf trick — the giraffe's
            Armor Tail blocks all priority aimed at its side), anything protected by{" "}
            <strong>Psychic Terrain</strong> (if grounded), <strong>Quick Guard</strong>, and{" "}
            <strong>Ghost-types</strong> (immune to Normal moves).
          </li>
          <li>
            It <strong>deals damage but doesn't flinch</strong> Pokemon with{" "}
            <strong>Inner Focus</strong> or holding a <strong>Covert Cloak</strong>.
          </li>
          <li>
            Other common priority moves: Extreme Speed, Aqua Jet, Sucker Punch (only works if the
            target is attacking), Grassy Glide (in Grassy Terrain), and{" "}
            <strong>Prankster</strong>-boosted status moves like Thunder Wave and Tailwind.
          </li>
        </ul>
      </section>

      <section>
        <h2>Speed control — how battles are actually won</h2>
        <ul>
          <li><strong>Tailwind</strong>: doubles your whole side's Speed for 4 turns. The #1 speed tool in doubles.</li>
          <li><strong>Trick Room</strong>: for 5 turns the <em>slowest</em> Pokemon moves first. Slow, strong teams (Ursaluna, Torkoal) build around this — against them, being fast is a liability.</li>
          <li><strong>Icy Wind / Electroweb</strong>: damage both opponents and drop their Speed one stage.</li>
          <li><strong>Paralysis</strong> (Thunder Wave): halves Speed and 25% chance to lose the turn.</li>
          <li><strong>Choice Scarf</strong>: hidden ×1.5 Speed — the classic surprise. The Scout tab's ⚡ number shows every Pokemon's scarf ceiling.</li>
        </ul>
      </section>

      <section>
        <h2>Status conditions</h2>
        <ul>
          <li><strong>Burn</strong>: physical attackers do half damage + chip each turn. (But it makes <strong>Guts</strong> Pokemon stronger!)</li>
          <li><strong>Paralysis</strong>: Speed halved, 25% to skip the turn.</li>
          <li><strong>Sleep</strong> (Spore, Hypnosis): 1–3 turns of nothing. Safety Goggles and Grass-types ignore Spore.</li>
          <li><strong>Poison / Toxic</strong>: chip damage (toxic grows each turn).</li>
          <li><strong>Flinch</strong>: lose this turn only (Fake Out, Rock Slide's 30%).</li>
        </ul>
      </section>

      <section>
        <h2>Items you'll see constantly</h2>
        <table className="guide-table">
          <tbody>
            <tr><td><strong>Choice Scarf / Specs / Band</strong></td><td>×1.5 Speed / Sp. Atk / Attack — but locked into one move until switching out.</td></tr>
            <tr><td><strong>Focus Sash</strong></td><td>Survives any one hit from full HP with 1 HP. Assume frail fast Pokemon have one.</td></tr>
            <tr><td><strong>Assault Vest</strong></td><td>+50% Sp. Def, can't use status moves.</td></tr>
            <tr><td><strong>Life Orb</strong></td><td>×1.3 damage, small recoil.</td></tr>
            <tr><td><strong>Leftovers / Sitrus Berry</strong></td><td>Passive / one-time healing.</td></tr>
            <tr><td><strong>Booster Energy</strong></td><td>Activates Protosynthesis/Quark Drive without needing sun/terrain.</td></tr>
            <tr><td><strong>Safety Goggles</strong></td><td>Immune to Spore, Rage Powder redirection and weather chip.</td></tr>
            <tr><td><strong>Covert Cloak</strong></td><td>Immune to the added effects of attacks — no Fake Out flinch, no Icy Wind Speed drop, no Rock Slide flinches.</td></tr>
            <tr><td><strong>Clear Amulet</strong></td><td>Stats can't be lowered — Intimidate does nothing.</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Reading the Scout tab</h2>
        <ul>
          <li>Each opponent column shows their <strong>realistic Speed range</strong> (lazy spread → fully invested) and the <strong>⚡ scarf ceiling</strong>.</li>
          <li><span className="cell-safe guide-chip">✓✓</span> you outspeed even their scarf set — safe. <span className="cell-scarf-risk guide-chip">✓</span> you outspeed unless they're scarfed. <span className="cell-tie guide-chip">=</span> exact tie (coin flip!). <span className="cell-range guide-chip">~</span> depends how much Speed they invested. <span className="cell-slower guide-chip">✗</span> always slower — plan around it.</li>
          <li><span className="threat">⚠</span> their STAB type hits you super-effectively; <span className="edge">◆</span> yours hits them super-effectively.</li>
          <li><strong>Click any opponent's name</strong> to see its weaknesses, stats and ability warnings — that's where "Fake Out won't work on this one" lives.</li>
        </ul>
      </section>
    </div>
  );
}
