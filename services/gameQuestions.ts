
export type QuestionType = 'MATH' | 'ENGLISH';

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    type: QuestionType;
}

export const generateQuestion = (type: QuestionType): Question => {
    switch (type) {
        case 'MATH': return generateMathQuestion();
        case 'ENGLISH': return generateEnglishQuestion();
        default: return generateMathQuestion();
    }
};

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateMathQuestion = (): Question => {
    const operator = Math.random() > 0.5 ? '+' : '-';
    let a, b, result;
    
    if (operator === '+') {
        a = getRandomInt(1, 20);
        b = getRandomInt(1, 20);
        result = a + b;
    } else {
        a = getRandomInt(5, 20);
        b = getRandomInt(1, a); // ensure positive result
        result = a - b;
    }

    const correctAnswer = result.toString();
    const options = new Set<string>();
    options.add(correctAnswer);
    
    while (options.size < 3) {
        const wrong = result + getRandomInt(-5, 5);
        if (wrong >= 0 && wrong !== result) options.add(wrong.toString());
    }

    const text = `${a} ${operator} ${b} = ?`;
    
    // Use text as ID to prevent duplicate questions (e.g. 5+5 appearing twice)
    return {
        id: text.replace(/\s/g, ''),
        text: text,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        correctAnswer,
        type: 'MATH'
    };
};

const englishWords = [
    // Animals
    { cs: 'Pes', en: 'Dog' }, { cs: 'Kočka', en: 'Cat' }, { cs: 'Prase', en: 'Pig' },
    { cs: 'Kůň', en: 'Horse' }, { cs: 'Kráva', en: 'Cow' }, { cs: 'Ovce', en: 'Sheep' },
    { cs: 'Lev', en: 'Lion' }, { cs: 'Slon', en: 'Elephant' }, { cs: 'Opice', en: 'Monkey' },
    { cs: 'Ryba', en: 'Fish' }, { cs: 'Pták', en: 'Bird' }, { cs: 'Myš', en: 'Mouse' },
    
    // Food
    { cs: 'Jablko', en: 'Apple' }, { cs: 'Banán', en: 'Banana' }, { cs: 'Pomeranč', en: 'Orange' },
    { cs: 'Chléb', en: 'Bread' }, { cs: 'Voda', en: 'Water' }, { cs: 'Mléko', en: 'Milk' },
    { cs: 'Vejce', en: 'Egg' }, { cs: 'Sýr', en: 'Cheese' }, { cs: 'Dort', en: 'Cake' },
    { cs: 'Zmrzlina', en: 'Ice cream' }, { cs: 'Maso', en: 'Meat' }, { cs: 'Jahoda', en: 'Strawberry' },

    // Colors
    { cs: 'Červená', en: 'Red' }, { cs: 'Modrá', en: 'Blue' }, { cs: 'Zelená', en: 'Green' },
    { cs: 'Žlutá', en: 'Yellow' }, { cs: 'Černá', en: 'Black' }, { cs: 'Bílá', en: 'White' },
    { cs: 'Růžová', en: 'Pink' }, { cs: 'Fialová', en: 'Purple' }, { cs: 'Oranžová', en: 'Orange' },
    
    // Home & Objects
    { cs: 'Auto', en: 'Car' }, { cs: 'Dům', en: 'House' }, { cs: 'Kniha', en: 'Book' },
    { cs: 'Stůl', en: 'Table' }, { cs: 'Židle', en: 'Chair' }, { cs: 'Postel', en: 'Bed' },
    { cs: 'Tužka', en: 'Pencil' }, { cs: 'Míč', en: 'Ball' }, { cs: 'Hračka', en: 'Toy' },
    { cs: 'Boty', en: 'Shoes' }, { cs: 'Tričko', en: 'T-shirt' }, { cs: 'Hodiny', en: 'Clock' },

    // Nature
    { cs: 'Slunce', en: 'Sun' }, { cs: 'Měsíc', en: 'Moon' }, { cs: 'Hvězda', en: 'Star' },
    { cs: 'Strom', en: 'Tree' }, { cs: 'Květina', en: 'Flower' }, { cs: 'Déšť', en: 'Rain' },
    { cs: 'Sníh', en: 'Snow' }, { cs: 'Řeka', en: 'River' }, { cs: 'Moře', en: 'Sea' },

    // Body
    { cs: 'Hlava', en: 'Head' }, { cs: 'Ruka', en: 'Hand' }, { cs: 'Noha', en: 'Leg' },
    { cs: 'Oko', en: 'Eye' }, { cs: 'Ucho', en: 'Ear' }, { cs: 'Nos', en: 'Nose' }
];

const generateEnglishQuestion = (): Question => {
    const word = englishWords[getRandomInt(0, englishWords.length - 1)];
    const correctAnswer = word.en;
    
    const options = new Set<string>();
    options.add(correctAnswer);
    
    while (options.size < 3) {
        const wrong = englishWords[getRandomInt(0, englishWords.length - 1)].en;
        if (wrong !== correctAnswer) options.add(wrong);
    }

    return {
        id: `EN_${word.en}`, // Use word as ID to prevent duplicates
        text: `Jak se řekne anglicky "${word.cs}"?`,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        correctAnswer,
        type: 'ENGLISH'
    };
};
