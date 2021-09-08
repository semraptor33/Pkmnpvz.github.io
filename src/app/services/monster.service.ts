import { Injectable } from '@angular/core';
import { BitmapAnimation, BitmapPalette, BitmapPixelData, BitmapPixelDepth, BitmapService } from './bitmap.service';
import { RomService } from './rom.service';

@Injectable({
  providedIn: 'root'
})
export class MonsterService {

  public monsters: Monster[] = [];
  public monsterIcons: BitmapAnimation[] = [];
  public abilityNames: string[] = [];
  public moveNames: string[] = [];

  public isLoaded: boolean = false;

  constructor(private romService: RomService, private bitmapService: BitmapService) { }

  public loadMonsters() {
    this.monsters = new Array(this.romService.constants().MONSTER_COUNT);

    this.loadNames();
    this.loadBaseStats();
    this.loadAbilityNames();
    this.loadMoveNames();
    this.loadMonsterIcons();

    this.isLoaded = true;
    this.romService.markToolLoaded();
  }

  private loadMonsterIcons() {
    let monsterIconPalettes: BitmapPalette[] = [];
    for (let i = 0; i < this.romService.constants().MONSTER_COUNT; i++) {
      this.romService.goTo(this.romService.constants().MONSTER_ICON_PIXEL_ADDRESS + (i * 4));
      this.romService.goTo(this.romService.getPointer());
      let frame0Values = this.romService.getBytes(32 * 32 / 2);
      let frame1Values = this.romService.getBytes(32 * 32 / 2);
      let frame0Data = new BitmapPixelData(undefined, BitmapPixelDepth.BPP_4, frame0Values, this.bitmapService, this.romService);
      let frame1Data = new BitmapPixelData(undefined, BitmapPixelDepth.BPP_4, frame1Values, this.bitmapService, this.romService);
      
      this.romService.goTo(this.romService.constants().MONSTER_ICON_PALETTE_ADDRESS + i);
      let paletteId = this.romService.getByte();

      if (monsterIconPalettes.length < this.romService.constants().MONSTER_ICON_PALETTE_COUNT) {
        for (let j = 0; j < this.romService.constants().MONSTER_ICON_PALETTE_COUNT; j++) {
          this.romService.goTo(this.romService.constants().MONSTER_ICON_PALETTES + (j * 32));
          let paletteValues = this.romService.getBytes(32);
          monsterIconPalettes.push(new BitmapPalette(undefined, 16, paletteValues, undefined, this.bitmapService, this.romService, j));
        }
      }

      let iconBitmap0 = this.bitmapService.createBitmapCanvas(frame0Data, monsterIconPalettes[paletteId], 32, 32, true);
      let iconBitmap1 = this.bitmapService.createBitmapCanvas(frame1Data, monsterIconPalettes[paletteId], 32, 32, true);

      this.monsterIcons.push(new BitmapAnimation([iconBitmap0, iconBitmap1], iconBitmap0, 350, true, false, 0));
    }
  }

  private loadNames() {
    this.romService.goTo(this.romService.constants().MONSTER_NAMES_ADDRESS);
    let monsterNamesAddress: number = this.romService.getPointer();
    this.romService.goTo(monsterNamesAddress);
    let names: string[] = this.romService
      .getGameStringAutoList(this.romService.constants().MONSTER_COUNT);
    
    for (let i = 0; i < names.length; i++) {
      if (this.monsters[i] == undefined)
        this.monsters[i] = new Monster();
      
      this.monsters[i].uid = i;
      this.monsters[i].name = names[i];
    }
  }

  private loadBaseStats() {
    this.romService.goTo(this.romService.constants().MONSTER_BASE_STATS_ADDRESS);
    let startPosition: number = this.romService.getPointer();
    for (let i = 0; i < this.monsters.length; i++) {
      let baseStats: MonsterBaseStats = new MonsterBaseStats();

      baseStats.address = startPosition + (i * 28);
      this.romService.goTo(baseStats.address);
      baseStats.data = this.romService.getBytes(28);

      this.romService.goTo(baseStats.address);
      baseStats.baseHP = this.romService.getByte();
      baseStats.baseAttack = this.romService.getByte();
      baseStats.baseDefense = this.romService.getByte();
      baseStats.baseSpeed = this.romService.getByte();
      baseStats.baseSpAttack = this.romService.getByte();
      baseStats.baseSpDefense = this.romService.getByte();
      baseStats.type1 = this.romService.getByte();
      baseStats.type2 = this.romService.getByte();
      baseStats.catchRate = this.romService.getByte();
      baseStats.baseExpYield = this.romService.getByte();
      baseStats.effortYield = this.romService.getShort();
      baseStats.item1 = this.romService.getShort();
      baseStats.item2 = this.romService.getShort();
      baseStats.gender = this.romService.getByte();
      baseStats.eggCycles = this.romService.getByte();
      baseStats.baseFriendship = this.romService.getByte();
      baseStats.levelUpType = this.romService.getByte();
      baseStats.eggGroup1 = this.romService.getByte();
      baseStats.eggGroup2 = this.romService.getByte();
      baseStats.ability1 = this.romService.getByte();
      baseStats.ability2 = this.romService.getByte();
      baseStats.safariZoneRate = this.romService.getByte();
      baseStats.colorAndFlip = this.romService.getByte();

      // lol i hated this so much, edit at your own risk
      baseStats.hpYield = ((baseStats.effortYield & ((1 << 2) - 1) & ~(((1 << 0) - 1))) >>> 0);
      baseStats.attackYield = ((baseStats.effortYield & ((1 << 4) - 1) & ~(((1 << 2) - 1))) >>> 2);
      baseStats.defenseYield = ((baseStats.effortYield & ((1 << 6) - 1) & ~(((1 << 4) - 1))) >>> 4);
      baseStats.speedYield = ((baseStats.effortYield & ((1 << 8) - 1) & ~(((1 << 6) - 1))) >>> 6);
      baseStats.spAttackYield = ((baseStats.effortYield & ((1 << 10) - 1) & ~(((1 << 8) - 1))) >>> 8);
      baseStats.spDefenseYield = ((baseStats.effortYield & ((1 << 12) - 1) & ~(((1 << 10) - 1))) >>> 10);

      this.monsters[i].baseStats = baseStats;
    }
  }

  public loadAbilityNames() {
    this.romService.goTo(this.romService.constants().ABILITY_NAMES_ADDRESS);
    this.abilityNames = this.romService.getGameStringAutoList(this.romService.constants().ABILITY_COUNT);
  }

  public loadMoveNames() {
    this.romService.goTo(this.romService.constants().MOVE_NAMES_ADDRESS);
    let moveNamesAddress = this.romService.getPointer();
    this.romService.goTo(moveNamesAddress);
    this.moveNames = this.romService.getGameStringAutoList(this.romService.constants().MOVE_COUNT);
    console.log(this.moveNames);
  }

  public loadBattleSprite(monsterId: number, isFront: boolean, isShiny: boolean) {
    let pixelStart = 0;
    let paletteStart = 0;

    if (isFront) 
      pixelStart = this.romService.constants().MONSTER_FRONT_PIXEL_ADDRESS;
    else
      pixelStart = this.romService.constants().MONSTER_BACK_PIXEL_ADDRESS;
    if (this.romService.header.gameCode.startsWith('BPRE')) {
      this.romService.goTo(pixelStart);
      pixelStart = this.romService.getPointer();
    }

    if (isShiny)
      paletteStart = this.romService.constants().MONSTER_SHINY_PALETTE_ADDRESS;
    else
      paletteStart = this.romService.constants().MONSTER_NORMAL_PALETTE_ADDRESS;
    if (this.romService.header.gameCode.startsWith('BPRE')) {
      this.romService.goTo(paletteStart);
      paletteStart = this.romService.getPointer();
    }

    this.romService.goTo(pixelStart + (8 * monsterId));
    let pixelAddress: number = this.romService.getPointer();
    this.romService.goTo(paletteStart + (8 * monsterId));
    let paletteAddress: number = this.romService.getPointer();

    let pixelObj: BitmapPixelData = new BitmapPixelData(pixelAddress, BitmapPixelDepth.BPP_4, undefined, this.bitmapService, this.romService);
    let paletteObj: BitmapPalette = new BitmapPalette(paletteAddress, 16, undefined, undefined, this.bitmapService, this.romService);

    return this.bitmapService.createBitmap(pixelObj, paletteObj, 64, 64);
  }

}
export class Monster {

  constructor(
    public uid?: number,
    public name?: string,
    public baseStats?: MonsterBaseStats
  ) { }
}
export class MonsterBaseStats {

  constructor(
    public address?: number,
    public data: number[] = [],
    public baseHP?: number,
    public baseAttack?: number,
    public baseDefense?: number,
    public baseSpeed?: number,
    public baseSpAttack?: number,
    public baseSpDefense?: number,
    public type1?: number,
    public type2?: number,
    public catchRate?: number,
    public baseExpYield?: number,
    public effortYield?: number,
    public item1?: number,
    public item2?: number,
    public gender?: number,
    public eggCycles?: number,
    public baseFriendship?: number,
    public levelUpType?: number,
    public eggGroup1?: number,
    public eggGroup2?: number,
    public ability1?: number,
    public ability2?: number,
    public safariZoneRate?: number,
    public colorAndFlip?: number,

    public hpYield?: number,
    public attackYield?: number,
    public defenseYield?: number,
    public speedYield?: number,
    public spAttackYield?: number,
    public spDefenseYield?: number,
  ) { }
}
