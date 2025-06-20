import { Execution, Game, Player, Unit, UnitType } from "../game/Game";
import { TileRef } from "../game/GameMap";
import { PseudoRandom } from "../PseudoRandom";

export class GemMineExecution implements Execution {
  private active = true;
  private mg: Game | null = null;
  private gemMine: Unit | null = null;
  private random: PseudoRandom | null = null;
  private checkOffset: number | null = null;

  constructor(
    private player: Player,
    private tile: TileRef,
  ) {}

  init(mg: Game, ticks: number): void {
    this.mg = mg;
    this.random = new PseudoRandom(mg.ticks());
    this.checkOffset = mg.ticks() % 10;
  }

  tick(ticks: number): void {
    if (this.mg === null || this.random === null || this.checkOffset === null) {
      throw new Error("Not initialized");
    }
    if (this.gemMine === null) {
      const tile = this.tile;
      const spawn = this.player.canBuild(UnitType.GemMine, tile);
      if (spawn === false) {
        console.warn(
          `player ${this.player.id()} cannot build gem mine at ${this.tile}`,
        );
        this.active = false;
        return;
      }
      this.gemMine = this.player.buildUnit(UnitType.GemMine, spawn, {});
    }

    if (!this.gemMine.isActive()) {
      this.active = false;
      return;
    }

    if (this.player.id() !== this.gemMine.owner().id()) {
      this.player = this.gemMine.owner();
    }

    // Only check every 10 ticks for performance.
    if ((this.mg.ticks() + this.checkOffset) % 10 !== 0) {
      return;
    }

    // Generate gems based on mine level and random chance
    const mineLevel = this.gemMine.level();
    const baseGemRate = this.mg.config().gemMineRate(mineLevel);
    
    if (this.random.chance(baseGemRate)) {
      const gemsGenerated = this.mg.config().gemMineOutput(mineLevel);
      this.player.addGems(gemsGenerated);
      
      // Record stats
      this.mg.stats().gemsMined(this.player, gemsGenerated);
      
      // Display message
      this.mg.displayMessage(
        `Mined ${gemsGenerated} gems from gem mine`,
        "GEMS_MINED" as any,
        this.player.id(),
        gemsGenerated,
      );
    }
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }
} 