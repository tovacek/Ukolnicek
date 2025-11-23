
export interface AvatarAsset {
    id: string;
    label: string;
    value: string; // The query param value for DiceBear
    unlockMonth: number; // Months of membership required
    gender?: 'male' | 'female' | 'neutral';
}

// DiceBear Avataaars Options

export const TOP_ASSETS: AvatarAsset[] = [
    { id: 't1', label: 'Krátké', value: 'shortHair', unlockMonth: 0, gender: 'male' },
    { id: 't2', label: 'Dlouhé', value: 'longHair', unlockMonth: 0, gender: 'female' },
    { id: 't3', label: 'Kudrnaté', value: 'curly', unlockMonth: 0, gender: 'neutral' },
    { id: 't4', label: 'Bob', value: 'bob', unlockMonth: 1, gender: 'female' },
    { id: 't5', label: 'Dredy', value: 'dreads01', unlockMonth: 1, gender: 'male' },
    { id: 't6', label: 'Culík', value: 'bigHair', unlockMonth: 2, gender: 'female' },
    { id: 't7', label: 'Kšiltovka', value: 'hat', unlockMonth: 3, gender: 'male' },
    { id: 't8', label: 'Zimní čepice', value: 'winterHat02', unlockMonth: 4, gender: 'neutral' },
    { id: 't9', label: 'Elvis', value: 'curvy', unlockMonth: 5, gender: 'male' },
    { id: 't10', label: 'Číro', value: 'shaggy', unlockMonth: 6, gender: 'male' },
    { id: 't11', label: 'Drdol', value: 'bun', unlockMonth: 1, gender: 'female' },
    { id: 't12', label: 'Ofina', value: 'straight02', unlockMonth: 2, gender: 'female' },
];

export const ACCESSORIES_ASSETS: AvatarAsset[] = [
    { id: 'a1', label: 'Žádné', value: 'none', unlockMonth: 0 },
    { id: 'a2', label: 'Brýle 1', value: 'prescription01', unlockMonth: 0 },
    { id: 'a3', label: 'Brýle 2', value: 'prescription02', unlockMonth: 1 },
    { id: 'a4', label: 'Kulaté', value: 'round', unlockMonth: 2 },
    { id: 'a5', label: 'Sluneční', value: 'sunglasses', unlockMonth: 3 },
    { id: 'a6', label: 'Kočičí', value: 'wayfarers', unlockMonth: 5 },
];

export const CLOTHING_ASSETS: AvatarAsset[] = [
    { id: 'c1', label: 'Tričko', value: 'shirtCrewNeck', unlockMonth: 0 },
    { id: 'c2', label: 'Límeček', value: 'collarAndSweater', unlockMonth: 0 },
    { id: 'c3', label: 'Mikina', value: 'hoodie', unlockMonth: 1 },
    { id: 'c4', label: 'Sako', value: 'blazerShirt', unlockMonth: 2 },
    { id: 'c5', label: 'Lacláče', value: 'overall', unlockMonth: 3 },
    { id: 'c6', label: 'Grafické triko', value: 'graphicShirt', unlockMonth: 4 },
];

export const SKIN_ASSETS: AvatarAsset[] = [
    { id: 's1', label: 'Světlá', value: 'f8fdc9', unlockMonth: 0 },
    { id: 's2', label: 'Střední', value: 'd08b5b', unlockMonth: 0 },
    { id: 's3', label: 'Tmavá', value: 'ae5d29', unlockMonth: 0 },
    { id: 's4', label: 'Bledá', value: 'ffdbb4', unlockMonth: 0 },
    { id: 's5', label: 'Žlutá', value: 'edb98a', unlockMonth: 0 },
];
