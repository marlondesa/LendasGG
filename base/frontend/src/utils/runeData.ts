export const CDR = 'https://ddragon.leagueoflegends.com/cdn/img/perk-images'

export const KEYSTONE_MAP: Record<number, string> = {
  8005: 'Styles/Precision/PressTheAttack/PressTheAttack.png',
  8008: 'Styles/Precision/LethalTempo/LethalTempoTemp.png',
  8021: 'Styles/Precision/FleetFootwork/FleetFootwork.png',
  8010: 'Styles/Precision/Conqueror/Conqueror.png',
  8112: 'Styles/Domination/Electrocute/Electrocute.png',
  8124: 'Styles/Domination/Predator/Predator.png',
  8128: 'Styles/Domination/DarkHarvest/DarkHarvest.png',
  9923: 'Styles/Domination/HailOfBlades/HailOfBlades.png',
  8214: 'Styles/Sorcery/SummonAery/SummonAery.png',
  8229: 'Styles/Sorcery/ArcaneComet/ArcaneComet.png',
  8230: 'Styles/Sorcery/PhaseRush/PhaseRush.png',
  8351: 'Styles/Inspiration/GlacialAugment/GlacialAugment.png',
  8360: 'Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png',
  8369: 'Styles/Inspiration/FirstStrike/FirstStrike.png',
  8437: 'Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png',
  8439: 'Styles/Resolve/VeteranAftershock/VeteranAftershock.png',
  8465: 'Styles/Resolve/Guardian/Guardian.png',
}

export const KEYSTONE_NAMES: Record<number, string> = {
  8005: 'Aperte o Ataque',
  8008: 'Tempo Letal',
  8021: 'Passo Ligeiro',
  8010: 'Conquistador',
  8112: 'Eletrocutar',
  8124: 'Predador',
  8128: 'Colheita Sombria',
  9923: 'Rajada de Golpes',
  8214: 'Invocar Aery',
  8229: 'Cometa Arcano',
  8230: 'Arremetida de Fase',
  8351: 'Aprimoramento Glacial',
  8360: 'Livro de Feitiços Lacrado',
  8369: 'Primeiro Ataque',
  8437: 'Aperto dos Mortos-Vivos',
  8439: 'Pós-choque',
  8465: 'Guardião',
}

export const PATH_MAP: Record<number, string> = {
  8000: 'Styles/7201_Precision.png',
  8100: 'Styles/7200_Domination.png',
  8200: 'Styles/7202_Sorcery.png',
  8300: 'Styles/7203_Whimsy.png',
  8400: 'Styles/7204_Resolve.png',
}

export const PATH_NAMES: Record<number, string> = {
  8000: 'Precisão',
  8100: 'Dominação',
  8200: 'Feitiçaria',
  8300: 'Inspiração',
  8400: 'Determinação',
}

export function keystoneImg(id: number | undefined): string | null {
  if (!id || !KEYSTONE_MAP[id]) return null
  return `${CDR}/${KEYSTONE_MAP[id]}`
}

export function pathImg(id: number | undefined): string | null {
  if (!id || !PATH_MAP[id]) return null
  return `${CDR}/${PATH_MAP[id]}`
}
